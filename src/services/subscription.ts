import { supabase } from '@/lib/supabase/client'

export interface Subscription {
  id: string
  user_id: string
  plan_id: string
  status: string
  current_period_start: string | null
  current_period_end: string | null
  trial_start: string | null
  trial_end: string | null
  stripe_subscription_id: string | null
}

export interface Plan {
  id: string
  name: string
  description: string | null
  price: number
  max_panos_per_project: number | null
  duration_days: number | null
}

export const getSubscription = async (userId: string) => {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*, plans(*)')
    .eq('user_id', userId)
    .maybeSingle()

  return { data: data as (Subscription & { plans: Plan }) | null, error }
}

export const getPlan = async (planId: string) => {
  const { data, error } = await supabase
    .from('plans')
    .select('*')
    .eq('id', planId)
    .single()

  return { data: data as Plan | null, error }
}

export const createCheckoutSession = async (priceId: string) => {
  // Assuming a hardcoded price ID for simplicity or retrieved from env/constants
  // In a real app, this comes from the plan configuration
  // For this demo, we pass a dummy or expect the function to handle it if not passed
  const { data, error } = await supabase.functions.invoke('create-checkout', {
    body: {
      priceId: priceId, // e.g. 'price_123...'
      returnUrl: window.location.href,
    },
  })
  return { data, error }
}

export const createPortalSession = async () => {
  const { data, error } = await supabase.functions.invoke('create-portal', {
    body: { returnUrl: window.location.href },
  })
  return { data, error }
}

export const checkProjectLimit = async (
  userId: string,
  currentCount: number,
) => {
  // Get user profile to know the plan
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan_id')
    .eq('id', userId)
    .single()

  if (!profile) return { allowed: false, limit: 0 }

  // Get plan limits
  const { data: plan } = await supabase
    .from('plans')
    .select('max_panos_per_project')
    .eq('id', profile.plan_id)
    .single()

  if (!plan) return { allowed: true, limit: Infinity } // Should not happen, but safe fallback

  if (plan.max_panos_per_project === null)
    return { allowed: true, limit: Infinity }

  return {
    allowed: currentCount < plan.max_panos_per_project,
    limit: plan.max_panos_per_project,
  }
}
