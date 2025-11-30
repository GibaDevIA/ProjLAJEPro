import { supabase } from '@/lib/supabase/client'

export interface Profile {
  id: string
  email: string | null
  full_name: string | null
  created_at: string
  updated_at: string | null
}

export const getProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  return { data: data as Profile | null, error }
}

export const createProfile = async (userId: string, email: string | null) => {
  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      email: email,
      full_name: null,
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
