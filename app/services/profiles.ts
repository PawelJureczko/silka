import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../../shared/types/database.generated'

export async function fetchProfile(client: SupabaseClient<Database>, userId: string) {
  const { data, error } = await client.from('profiles')
    .select('display_name, training_goal, timezone')
    .eq('user_id', userId)
    .single()
  if (error) throw new Error('Nie udało się pobrać profilu. Spróbuj ponownie.')
  return data
}
