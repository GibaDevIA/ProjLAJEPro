import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { stripe } from '../_shared/stripe.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
)

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return new Response('No signature', { status: 400 })
  }

  try {
    const body = await req.text()
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SECRET') || '',
    )

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        const customerId = session.customer
        const subscriptionId = session.subscription

        // Find profile by customer ID
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (profile) {
          // Get the 'Profissional' plan ID
          const { data: plan } = await supabase
            .from('plans')
            .select('id')
            .eq('name', 'Profissional')
            .single()

          if (plan) {
            // Update profile plan
            await supabase
              .from('profiles')
              .update({ plan_id: plan.id })
              .eq('id', profile.id)

            // Update subscription
            await supabase.from('subscriptions').upsert(
              {
                user_id: profile.id,
                plan_id: plan.id,
                stripe_subscription_id: subscriptionId,
                status: 'active',
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'user_id' },
            )
          }
        }
        break
      }
      case 'customer.subscription.updated': {
        const subscription = event.data.object
        const status = subscription.status
        const customerId = subscription.customer

        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (profile) {
          await supabase
            .from('subscriptions')
            .update({
              status: status,
              current_period_start: new Date(
                subscription.current_period_start * 1000,
              ).toISOString(),
              current_period_end: new Date(
                subscription.current_period_end * 1000,
              ).toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', profile.id)

          // If status is not active, maybe downgrade plan?
          // User story: "When a user cancels... remain active until end of period".
          // Stripe usually keeps status active until end of period if using 'cancel_at_period_end'.
          // If status becomes 'canceled' or 'past_due', we might need to act.

          if (status === 'canceled' || status === 'unpaid') {
            // Revert to free plan?
            // Usually handled by a scheduled job or subsequent event, but let's keep it simple
            const { data: freePlan } = await supabase
              .from('plans')
              .select('id')
              .eq('name', 'Gratuito 7 dias')
              .single()
            if (freePlan) {
              // Only revert profile plan if fully canceled
              if (status === 'canceled') {
                await supabase
                  .from('profiles')
                  .update({ plan_id: freePlan.id })
                  .eq('id', profile.id)
              }
            }
          }
        }
        break
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object
        const customerId = subscription.customer

        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (profile) {
          await supabase
            .from('subscriptions')
            .update({
              status: 'canceled',
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', profile.id)

          const { data: freePlan } = await supabase
            .from('plans')
            .select('id')
            .eq('name', 'Gratuito 7 dias')
            .single()
          if (freePlan) {
            await supabase
              .from('profiles')
              .update({ plan_id: freePlan.id })
              .eq('id', profile.id)
          }
        }
        break
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }
})
