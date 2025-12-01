import { stripe, Stripe } from '../_shared/stripe.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const cryptoProvider = Stripe.createSubtleCryptoProvider()

Deno.serve(async (req) => {
  const signature = req.headers.get('Stripe-Signature')
  const body = await req.text()
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

  if (!signature || !webhookSecret) {
    return new Response('Webhook secret not configured or signature missing', {
      status: 400,
    })
  }

  let event
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret,
      undefined,
      cryptoProvider,
    )
  } catch (err) {
    console.error(`Webhook signature verification failed.`, err.message)
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  )

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        const subscriptionId = session.subscription as string
        const customerId = session.customer as string
        const userId = session.subscription_data?.metadata?.userId

        if (userId) {
          await supabaseAdmin
            .from('profiles')
            .update({ stripe_customer_id: customerId })
            .eq('id', userId)
        }

        // If there is a subscription, retrieve it and update database
        if (subscriptionId) {
          const subscription =
            await stripe.subscriptions.retrieve(subscriptionId)
          await upsertSubscription(supabaseAdmin, subscription, userId)
        }
        break
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object
        await upsertSubscription(supabaseAdmin, subscription)
        break
      }
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 })
  } catch (error) {
    console.error(error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
    })
  }
})

async function upsertSubscription(
  supabaseAdmin: any,
  subscription: any,
  userId?: string,
) {
  const status = subscription.status
  const planId = subscription.items.data[0].price.id

  // Find the internal plan ID based on the Stripe Price ID
  const { data: planData } = await supabaseAdmin
    .from('plans')
    .select('id')
    .eq('stripe_price_id', planId)
    .single()

  if (!planData) {
    console.error('Plan not found for stripe price id:', planId)
    return
  }

  // If userId is not provided (e.g. in updates), find it via customer id
  let targetUserId = userId
  if (!targetUserId) {
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('stripe_customer_id', subscription.customer)
      .single()
    targetUserId = profile?.id
  }

  if (!targetUserId) {
    console.error('User not found for subscription:', subscription.id)
    return
  }

  const subscriptionData = {
    id: subscription.id,
    user_id: targetUserId,
    status: status,
    plan_id: planData.id,
    current_period_start: new Date(
      subscription.current_period_start * 1000,
    ).toISOString(),
    current_period_end: new Date(
      subscription.current_period_end * 1000,
    ).toISOString(),
    cancel_at_period_end: subscription.cancel_at_period_end,
    stripe_subscription_id: subscription.id,
  }

  // Also update user profile with the new plan
  if (status === 'active' || status === 'trialing') {
    await supabaseAdmin
      .from('profiles')
      .update({ plan_id: planData.id })
      .eq('id', targetUserId)
  }

  // Upsert subscription record
  const { error } = await supabaseAdmin
    .from('subscriptions')
    .upsert(subscriptionData)

  if (error) {
    console.error('Error upserting subscription:', error)
  }
}
