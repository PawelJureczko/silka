import { fetchProfile } from '~/services/profiles'

export function useProfile() {
  const { user } = useAuthState()
  const { $supabase } = useNuxtApp()
  return useAsyncData(
    () => `profile:${user.value?.id ?? 'guest'}`,
    async () => {
      if (!$supabase || !user.value) return null
      return fetchProfile($supabase, user.value.id)
    },
  )
}
