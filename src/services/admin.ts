import { supabase } from '@/lib/supabase/client'

export interface AdminProfile {
  id: string
  email: string | null
  full_name: string | null
  created_at: string
  updated_at: string | null
  is_admin: boolean
  is_active: boolean
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
    .select('*', { count: 'exact' })
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
