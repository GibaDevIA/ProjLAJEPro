import { supabase } from '@/lib/supabase/client'
import { Shape, ViewState } from '@/types/drawing'

export interface ProjectContent {
  shapes: Shape[]
  view: ViewState
  version: string
  dateCreated: string
  units: string
}

export interface Project {
  id: string
  user_id: string
  name: string
  content: ProjectContent | null
  created_at: string
  updated_at: string | null
}

export const getProjects = async () => {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('updated_at', { ascending: false })

  return { data: data as Project[] | null, error }
}

export const getProject = async (id: string) => {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single()

  return { data: data as Project | null, error }
}

export const createProject = async (name: string, content?: ProjectContent) => {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { data: null, error: new Error('User not authenticated') }

  const { data, error } = await supabase
    .from('projects')
    .insert({
      user_id: user.id,
      name,
      content: content || null,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single()

  return { data: data as Project | null, error }
}

export const updateProject = async (
  id: string,
  updates: Partial<Pick<Project, 'name' | 'content'>>,
) => {
  const { data, error } = await supabase
    .from('projects')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  return { data: data as Project | null, error }
}

export const deleteProject = async (id: string) => {
  const { error } = await supabase.from('projects').delete().eq('id', id)
  return { error }
}

export const getUserProjectsCount = async (userId: string) => {
  const { count, error } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  return { count, error }
}
