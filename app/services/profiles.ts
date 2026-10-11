import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../../shared/types/database.generated'
import { profileInputSchema } from '#shared/schemas/profile'
import type { ProfileInput } from '#shared/schemas/profile'

export async function fetchProfile(client: SupabaseClient<Database>, userId: string) {
  const { data, error } = await client.from('profiles')
    .select('display_name, training_goal, timezone, preferences')
    .eq('user_id', userId)
    .abortSignal(AbortSignal.timeout(12000))
    .single()
  if (error) throw new Error('Nie udało się pobrać profilu. Spróbuj ponownie.')
  return data
}

export async function saveProfile(client: SupabaseClient<Database>, input: ProfileInput) {
  const value = profileInputSchema.parse(input)
  const { error } = await client.rpc('save_profile', { p_display_name: value.displayName, p_training_goal: value.trainingGoal, p_timezone: value.timezone, p_weekly_target: value.weeklyTarget }).abortSignal(AbortSignal.timeout(12000))
  if (error) throw new Error('Nie udało się zapisać profilu. Sprawdź dane i połączenie, a następnie ponów zapis.')
}
