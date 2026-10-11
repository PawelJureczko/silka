import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../../shared/types/database.generated'
import type { SignInCredentials } from '../../shared/schemas/auth'

export function getAuthErrorMessage(code: string | undefined): string {
  switch (code) {
    case 'invalid_credentials': return 'Adres e-mail lub hasło są nieprawidłowe.'
    case 'email_not_confirmed': return 'Potwierdź adres e-mail przed zalogowaniem.'
    case 'over_request_rate_limit':
    case 'over_email_send_rate_limit': return 'Zbyt wiele prób. Poczekaj chwilę i spróbuj ponownie.'
    default: return 'Nie udało się zalogować. Sprawdź połączenie i spróbuj ponownie.'
  }
}

export async function signInWithPassword(client: SupabaseClient<Database>, credentials: SignInCredentials) {
  const { data, error } = await client.auth.signInWithPassword(credentials)
  if (error) throw new Error(getAuthErrorMessage(error.code))
  return data.user
}

export async function signOut(client: SupabaseClient<Database>): Promise<void> {
  const { error } = await client.auth.signOut({ scope: 'local' })
  if (error) throw new Error('Nie udało się wylogować. Sprawdź połączenie i spróbuj ponownie.')
}
