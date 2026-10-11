import { signInWithPassword, signOut } from '~/services/auth'
import { signInSchema } from '#shared/schemas/auth'
import { readWorkoutJournal } from '~/services/workout-storage'

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
    if (useState<number>('workout:saving', () => 0).value > 0) return 'Poczekaj na zakończenie lokalnego zapisu przed wylogowaniem.'
    try {
      const journal = state.user.value ? await readWorkoutJournal(state.user.value.id) : null
      if (journal && (journal.start || journal.queue.length || journal.conflict)
        && !window.confirm('Masz trening oczekujący na zapis na koncie. Wylogować się i zachować go lokalnie? Wróć na to samo konto w tej przeglądarce, aby dokończyć synchronizację.')) return null
    }
    catch {
      if (!window.confirm('Nie można sprawdzić lokalnego szkicu treningu. Wylogować się? Lokalny zapis pozostanie w tej przeglądarce.')) return null
    }
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
