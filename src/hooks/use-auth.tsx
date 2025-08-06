import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useSupabase } from '@/contexts/SupabaseContext'

export function useAuth() {
  const { user, session, loading, signOut } = useSupabase()
  const [authLoading, setAuthLoading] = useState(false)

  const signInWithEmail = async (email: string, password: string) => {
    setAuthLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    } finally {
      setAuthLoading(false)
    }
  }

  const signUpWithEmail = async (email: string, password: string) => {
    setAuthLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    } finally {
      setAuthLoading(false)
    }
  }

  const signInWithProvider = async (provider: 'google' | 'github' | 'discord') => {
    setAuthLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    } finally {
      setAuthLoading(false)
    }
  }

  const resetPassword = async (email: string) => {
    setAuthLoading(true)
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    } finally {
      setAuthLoading(false)
    }
  }

  return {
    user,
    session,
    loading: loading || authLoading,
    signInWithEmail,
    signUpWithEmail,
    signInWithProvider,
    resetPassword,
    signOut,
  }
}