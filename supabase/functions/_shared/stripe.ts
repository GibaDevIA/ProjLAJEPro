import Stripe from 'https://esm.sh/stripe@17.4.0?target=deno'

export const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2024-11-20.acacia',
  httpClient: Stripe.createFetchHttpClient(),
})

export { Stripe }
