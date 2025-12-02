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
  const { data, error } = await supabase
    .from('plans')
    .select('id, name, duration_days')
    .eq('is_active', true)
    .order('price', { ascending: true })

  console.log('getAllPlans result:', { data, error })

  return { data: data as Plan[] | null, error }
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
