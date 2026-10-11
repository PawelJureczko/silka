import { signInWithPassword, signOut } from '~/services/auth'
import { signInSchema } from '#shared/schemas/auth'

export function useAuth() {
  const state = useAuthState()
  const { $supabase } = useNuxtApp()

  async function login(email: string, password: string): Promise<string | null> {
    if (state.pending.value) return 'Logowanie już trwa.'
    const credentials = signInSchema.safeParse({ email: email.trim(), password })
    if (!credentials.success) return credentials.error.issues[0]?.message ?? 'Sprawdź dane logowania.'
    if (!$supabase) return 'Logowanie jest chwilowo niedostępne. Spróbuj później.'
    state.pending.value = true
    try {
      state.user.value = await signInWithPassword($supabase, credentials.data)
      await navigateTo('/', { replace: true })
      return null
    }
    catch (error) {
      return error instanceof Error ? error.message : 'Nie udało się zalogować. Spróbuj ponownie.'
    }
    finally {
      state.pending.value = false
    }
  }

  async function logout(): Promise<string | null> {
    if (!$supabase || state.pending.value) return 'Wylogowanie jest chwilowo niedostępne.'
    state.pending.value = true
    try {
      await signOut($supabase)
      state.user.value = null
      clearNuxtData()
      await navigateTo('/login', { replace: true })
      return null
    }
    catch (error) {
      return error instanceof Error ? error.message : 'Nie udało się wylogować. Spróbuj ponownie.'
    }
    finally {
      state.pending.value = false
    }
  }

  return { ...state, configured: $supabase !== null, login, logout }
}
