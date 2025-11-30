import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface AuthContextType {
  user: User | null
  session: Session | null
  signUp: (email: string, password: string) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signInWithGoogle: () => Promise<{ error: any }>
  signOut: () => Promise<{ error: any }>
  resetPasswordForEmail: (email: string) => Promise<{ error: any }>
  updatePassword: (password: string) => Promise<{ error: any }>
  loading: boolean
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  const checkUserProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_admin, is_active')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching user profile:', error)
        // If we can't fetch profile, we assume safe default or handle error
        // For security, if RLS blocks or error, maybe assume not admin.
        // But we need to know if is_active check failed.
        return false
      }

      if (data) {
        // Check if user is active
        if (data.is_active === false) {
          await supabase.auth.signOut()
          toast.error(
            'Sua conta foi desativada. Entre em contato com o suporte.',
          )
          return false
        }
        // Update admin status
        setIsAdmin(!!data.is_admin)
        return true
      }
      return true // Default to true if no profile found (should exist via trigger)
    } catch (error) {
      console.error('Unexpected error in checkUserProfile:', error)
      return false
    }
  }, [])

  useEffect(() => {
    // Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)

      if (!session) {
        setIsAdmin(false)
      }
      // Note: We do not set loading(false) here because we want to wait for profile check
      // in the initSession logic. For subsequent events (like token refresh),
      // the user is already logged in so loading is already false.
    })

    // Check for existing session on mount
    const initSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          await checkUserProfile(session.user.id)
        }
      } catch (error) {
        console.error('Error initializing session:', error)
      } finally {
        setLoading(false)
      }
    }

    initSession()

    return () => subscription.unsubscribe()
  }, [checkUserProfile])

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
      },
    })
    return { error }
  }

  const signIn = async (email: string, password: string) => {
    // 1. Authenticate with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return { error }
    }

    // 2. If successful, verify profile status immediately
    if (data.session?.user) {
      const isActive = await checkUserProfile(data.session.user.id)
      if (!isActive) {
        // checkUserProfile handles the signOut and toast
        return { error: { message: 'Conta inativa.' } }
      }
    }

    return { data, error: null }
  }

  const signInWithGoogle = async () => {
    const redirectUrl = `${window.location.origin}/`
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
      },
    })
    return { error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    setIsAdmin(false)
    return { error }
  }

  const resetPasswordForEmail = async (email: string) => {
    const redirectUrl = `${window.location.origin}/reset-password`
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    })
    return { error }
  }

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({
      password: password,
    })
    return { error }
  }

  const value = {
    user,
    session,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    resetPasswordForEmail,
    updatePassword,
    loading,
    isAdmin,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
