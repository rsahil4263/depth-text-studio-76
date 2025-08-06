import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

// Generic hook for Supabase queries
export function useSupabaseQuery<T>(
  queryKey: string[],
  queryFn: () => Promise<{ data: T | null; error: any }>
) {
  return useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await queryFn()
      if (error) throw error
      return data
    },
  })
}

// Generic hook for Supabase mutations
export function useSupabaseMutation<T, V>(
  mutationFn: (variables: V) => Promise<{ data: T | null; error: any }>,
  options?: {
    onSuccess?: (data: T) => void
    onError?: (error: any) => void
    invalidateQueries?: string[][]
  }
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (variables: V) => {
      const { data, error } = await mutationFn(variables)
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      options?.onSuccess?.(data)
      options?.invalidateQueries?.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey })
      })
    },
    onError: options?.onError,
  })
}

// Example: Hook for fetching user profile
export function useUserProfile(userId?: string) {
  return useSupabaseQuery(
    ['user-profile', userId],
    () => supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
  )
}

// Example: Hook for updating user profile
export function useUpdateProfile() {
  return useSupabaseMutation(
    (profile: { id: string; [key: string]: any }) =>
      supabase
        .from('profiles')
        .update(profile)
        .eq('id', profile.id)
        .select()
        .single(),
    {
      invalidateQueries: [['user-profile']],
    }
  )
}