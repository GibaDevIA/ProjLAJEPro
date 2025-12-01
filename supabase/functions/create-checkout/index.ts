import { corsHeaders } from '../_shared/cors.ts'
import { stripe } from '../_shared/stripe.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      },
    )

    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders })
    }

    const { priceId, returnUrl, successUrl, cancelUrl } = await req.json()

    if (!priceId) {
      throw new Error('Price ID is required')
    }

    // Log checkout initiation
    console.log(
      `Initiating checkout for user ${user.id} with priceId: ${priceId}`,
    )

    // Lookup plan details for logging and validation
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { data: plan, error: planError } = await supabaseAdmin
      .from('plans')
      .select('name, is_active, stripe_price_id')
      .eq('stripe_price_id', priceId)
      .maybeSingle()

    if (planError) {
      console.error('Error fetching plan details:', planError)
    }

    if (plan) {
      console.log(
        `Plan found: ${plan.name}, Active: ${plan.is_active}, ID: ${plan.stripe_price_id}`,
      )
      if (!plan.is_active) {
        console.warn(`Attempt to checkout inactive plan: ${plan.name}`)
        // We could throw here, but logic just said to log.
        // However AC says "verify that the retrieved... plan is active".
        // It is safer to block it if inactive.
        throw new Error('Selected plan is not active.')
      }
    } else {
      console.warn(`No plan found for priceId: ${priceId}`)
      throw new Error('Plan not found.')
    }

    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('stripe_customer_id, email')
      .eq('id', user.id)
      .single()

    let customerId = profile?.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabaseUUID: user.id,
        },
      })
      customerId = customer.id

      await supabaseAdmin
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
    }

    const success_url =
      successUrl || `${returnUrl}?session_id={CHECKOUT_SESSION_ID}`
    const cancel_url = cancelUrl || `${returnUrl}?canceled=true`

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: success_url,
      cancel_url: cancel_url,
      subscription_data: {
        metadata: {
          userId: user.id,
        },
      },
    })

    console.log(
      `Checkout session created successfully for user ${user.id}. Session ID: ${session.id}`,
    )

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Checkout error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
