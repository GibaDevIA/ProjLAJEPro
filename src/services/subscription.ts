import { supabase } from '@/lib/supabase/client'
import { isAfter, parseISO } from 'date-fns'

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
  max_projects: number | null
  duration_days: number | null
  stripe_price_id: string
  is_active: boolean
}

export type SubscriptionStatus = 'active' | 'trialing' | 'expired' | 'none'

export const getSubscription = async (userId: string) => {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*, plans(*)')
    .eq('user_id', userId)
    .maybeSingle()

  return { data: data as (Subscription & { plans: Plan }) | null, error }
}

export const getPlans = async () => {
  const { data, error } = await supabase
    .from('plans')
    .select('*')
    .eq('is_active', true)
    .order('price', { ascending: true })

  return { data: data as Plan[] | null, error }
}

export const getPlan = async (planId: string) => {
  const { data, error } = await supabase
    .from('plans')
    .select('*')
    .eq('id', planId)
    .single()

  return { data: data as Plan | null, error }
}

export const getPlanByName = async (name: string) => {
  const { data, error } = await supabase
    .from('plans')
    .select('*')
    .eq('name', name)
    .maybeSingle()

  return { data: data as Plan | null, error }
}

export const createCheckoutSession = async (priceId: string) => {
  const { data, error } = await supabase.functions.invoke('create-checkout', {
    body: {
      priceId: priceId,
      successUrl: `${window.location.origin}/success`,
      cancelUrl: `${window.location.origin}/cancel`,
      returnUrl: window.location.href, // Fallback
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

/**
 * Helper to determine if a subscription is effectively active.
 */
export const isSubscriptionActive = (
  subscription: Subscription | null,
): {
  isActive: boolean
  reason?: 'expired' | 'canceled' | 'unpaid' | 'none'
} => {
  if (!subscription) return { isActive: false, reason: 'none' }

  const now = new Date()
  const status = subscription.status

  // Check Free Trial
  if (status === 'trialing') {
    if (
      subscription.trial_end &&
      isAfter(parseISO(subscription.trial_end), now)
    ) {
      return { isActive: true }
    }
    return { isActive: false, reason: 'expired' }
  }

  // Check Paid Subscription
  if (status === 'active') {
    // Even if status is active, check period end just in case,
    // though typically 'active' status from Stripe is enough.
    // We'll trust the status primarily, but if current_period_end is vastly in past, it might be stale.
    // For this implementation, let's rely on status being 'active' OR 'trialing'.
    return { isActive: true }
  }

  // All other statuses (canceled, unpaid, incomplete_expired, past_due, etc)
  // We treat 'past_due' as potentially active depending on business logic,
  // but User Story says "expired... status is 'canceled', 'unpaid'".
  // We will err on the side of blocking if not strictly active/trialing.
  return { isActive: false, reason: 'expired' }
}

export const checkProjectLimit = async (
  userId: string,
  currentCount: number,
) => {
  // 1. Get Subscription
  const { data: subscription, error: subError } = await getSubscription(userId)

  if (subError || !subscription)
    return { allowed: false, limit: 0, error: subError || 'No subscription' }

  // 2. Check if Active
  const { isActive } = isSubscriptionActive(subscription)
  if (!isActive) {
    return { allowed: false, limit: 0, reason: 'expired' }
  }

  const plan = subscription.plans

  if (!plan) return { allowed: true, limit: Infinity }

  if (plan.max_panos_per_project === null)
    return { allowed: true, limit: Infinity }

  return {
    allowed: currentCount < plan.max_panos_per_project,
    limit: plan.max_panos_per_project,
  }
}

export const checkMaxProjectsLimit = async (userId: string) => {
  // 1. Get projects count
  const { count, error: countError } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  if (countError) return { allowed: false, error: countError }

  // 2. Get Subscription & Plan
  const { data: subscription, error: subError } = await getSubscription(userId)

  if (subError) return { allowed: false, error: subError }
  if (!subscription) return { allowed: false, error: 'No subscription found' }

  // 3. Check Expiration
  const { isActive } = isSubscriptionActive(subscription)
  if (!isActive) {
    return {
      allowed: false,
      limit: 0,
      current: count || 0,
      reason: 'expired',
    }
  }

  const plan = subscription.plans

  // Cast to any to access max_projects since it might not be in the generated types yet
  const maxProjects = (plan as any).max_projects as number | null

  if (maxProjects === null || maxProjects === undefined)
    return { allowed: true, limit: Infinity, current: count || 0 }

  return {
    allowed: count !== null && count < maxProjects,
    limit: maxProjects,
    current: count || 0,
  }
}
