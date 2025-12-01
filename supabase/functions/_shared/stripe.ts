import Stripe from 'https://esm.sh/stripe@14.14.0?target=deno'

export const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})
