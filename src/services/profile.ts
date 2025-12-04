import { supabase } from '@/lib/supabase/client'
import { Json } from '@/lib/supabase/types'

export interface Profile {
  id: string
  email: string | null
  full_name: string | null
  plan_id: string
  created_at: string
  updated_at: string | null
  last_joist_config: Json | null
}

export const getProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  return { data: data as Profile | null, error }
}

export const createProfile = async (
  userId: string,
  email: string | null,
  planId: string,
) => {
  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      email: email,
      full_name: null,
      plan_id: planId,
    })
    .select()
    .single()

  return { data: data as Profile | null, error }
}

export const updateProfile = async (
  userId: string,
  updates: Partial<Profile>,
) => {
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single()

  return { data: data as Profile | null, error }
}
