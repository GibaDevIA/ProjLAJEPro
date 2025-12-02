import { supabase } from '@/lib/supabase/client'
import { addDays } from 'date-fns'

export interface AdminProfile {
  id: string
  email: string | null
  full_name: string | null
  created_at: string
  updated_at: string | null
  is_admin: boolean
  is_active: boolean
  plan_id: string
  plans?: {
    name: string
  }
}

export interface Plan {
  id: string
  name: string
  duration_days: number | null
}

export interface ExpiringSubscription {
  id: string
  user_id: string
  current_period_end: string
  status: string
  profiles: {
    full_name: string | null
    email: string | null
  }
  plans: {
    name: string
  }
}

interface GetUsersParams {
  page: number
  perPage: number
  sortBy: 'full_name' | 'email' | 'created_at'
  sortOrder: 'asc' | 'desc'
  search?: string
}

export const getUsers = async ({
  page,
  perPage,
  sortBy,
  sortOrder,
  search,
}: GetUsersParams) => {
  const from = (page - 1) * perPage
  const to = from + perPage - 1

  let query = supabase
    .from('profiles')
    .select('*, plans(name)', { count: 'exact' })
    .order(sortBy, { ascending: sortOrder === 'asc' })
    .range(from, to)

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
  }

  const { data, error, count } = await query

  return {
    data: data as AdminProfile[] | null,
    error,
    count,
  }
}

export const getAllPlans = async () => {
  // Removed .eq('is_active', true) to allow admins to see all plans regardless of status
  const { data, error } = await supabase
    .from('plans')
    .select('id, name, duration_days')
    .order('price', { ascending: true })

  return { data: data as Plan[] | null, error }
}

export const getExpiringSubscriptions = async (days: number = 30) => {
  const today = new Date().toISOString()
  const futureDate = addDays(new Date(), days).toISOString()

  const { data, error } = await supabase
    .from('subscriptions')
    .select(
      `
      id,
      user_id,
      current_period_end,
      status,
      profiles (
        full_name,
        email
      ),
      plans (
        name
      )
    `,
    )
    .eq('status', 'active')
    .eq('plans.name', 'Profissional') // Filter by plan name, might need to handle if Supabase doesn't support nested filter easily this way, but usually works if RLS allows
    .gte('current_period_end', today)
    .lte('current_period_end', futureDate)
    .order('current_period_end', { ascending: true })

  // Supabase postgrest doesn't always support deep filtering on joined tables nicely in one go without !inner,
  // so we might fetch more and filter in client if plan filtering fails, but let's try to be specific.
  // Better approach:
  // .not('current_period_end', 'is', null) is implied by gte/lte

  // NOTE: 'plans.name' filtering in select string requires !inner to enforce the join filter
  // select('..., plans!inner(name)')

  const { data: strictData, error: strictError } = await supabase
    .from('subscriptions')
    .select(
      `
      id,
      user_id,
      current_period_end,
      status,
      profiles (
        full_name,
        email
      ),
      plans!inner (
        name
      )
    `,
    )
    .eq('status', 'active')
    .eq('plans.name', 'Profissional')
    .gte('current_period_end', today)
    .lte('current_period_end', futureDate)
    .order('current_period_end', { ascending: true })

  return {
    data: strictData as unknown as ExpiringSubscription[] | null,
    error: strictError,
  }
}

export const updateUserRole = async (userId: string, isAdmin: boolean) => {
  const { data, error } = await supabase
    .from('profiles')
    .update({ is_admin: isAdmin, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single()

  return { data: data as AdminProfile | null, error }
}

export const updateUserStatus = async (userId: string, isActive: boolean) => {
  const { data, error } = await supabase
    .from('profiles')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single()

  return { data: data as AdminProfile | null, error }
}

export const updateUserDetails = async (userId: string, fullName: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .update({ full_name: fullName, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single()

  return { data: data as AdminProfile | null, error }
}

export const updateUserPlan = async (userId: string, planId: string) => {
  // 1. Get Plan Details
  const { data: plan, error: planError } = await supabase
    .from('plans')
    .select('*')
    .eq('id', planId)
    .single()

  if (planError || !plan) {
    return { error: planError || new Error('Plan not found') }
  }

  // 2. Update Profile
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ plan_id: planId, updated_at: new Date().toISOString() })
    .eq('id', userId)

  if (profileError) return { error: profileError }

  // 3. Update or Create Subscription
  const now = new Date()
  const endDate = plan.duration_days
    ? addDays(now, plan.duration_days)
    : addDays(now, 30) // Default fallback

  // Check if subscription exists
  const { data: existingSub } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle()

  let subError
  if (existingSub) {
    const { error } = await supabase
      .from('subscriptions')
      .update({
        plan_id: planId,
        status: 'active',
        current_period_start: now.toISOString(),
        current_period_end: endDate.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq('user_id', userId)
    subError = error
  } else {
    const { error } = await supabase.from('subscriptions').insert({
      user_id: userId,
      plan_id: planId,
      status: 'active',
      current_period_start: now.toISOString(),
      current_period_end: endDate.toISOString(),
    })
    subError = error
  }

  return { error: subError }
}
