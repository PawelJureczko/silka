import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '#shared/types/database.generated'
import { exerciseProgressSchema, progressOverviewSchema, workoutHistorySchema } from '#shared/schemas/progress'
import type { ExerciseVariant } from '#shared/schemas/progress'

type Client = SupabaseClient<Database>
export const historyPageSize = 20
export async function fetchProgressOverview(client: Client, timezone: string) {
  const { data, error } = await client.rpc('progress_overview', { p_timezone: timezone }).abortSignal(AbortSignal.timeout(12000))
  if (error) throw new Error('Nie udało się pobrać statystyk. Spróbuj ponownie.')
  return progressOverviewSchema.parse(data)
}
export async function fetchExerciseProgress(client: Client, variant: Omit<ExerciseVariant, 'name'>, before?: string) {
  const { data, error } = await client.rpc('exercise_progress', { p_exercise_id: variant.exerciseId, p_equipment: variant.equipment, p_load_mode: variant.loadMode, p_weight_convention: variant.weightConvention, ...(before ? { p_before: before } : {}) }).abortSignal(AbortSignal.timeout(12000))
  if (error) throw new Error('Nie udało się pobrać wyników ćwiczenia. Spróbuj ponownie.')
  return exerciseProgressSchema.parse(data)
}
export async function fetchWorkoutHistory(client: Client, page: number, status: 'all' | 'completed' | 'abandoned', days: number) {
  let query = client.from('workout_sessions').select('id,workout_name_snapshot,plan_name_snapshot,started_at,finished_at,status').neq('status', 'active').order('started_at', { ascending: false }).order('id', { ascending: false })
  if (status !== 'all') query = query.eq('status', status)
  if (days) query = query.gte('started_at', new Date(Date.now() - days * 86400000).toISOString())
  const { data, error } = await query.range(page * historyPageSize, (page + 1) * historyPageSize).abortSignal(AbortSignal.timeout(12000))
  if (error) throw new Error('Nie udało się pobrać historii. Spróbuj ponownie.')
  const rows = workoutHistorySchema.parse(data)
  return { rows: rows.slice(0, historyPageSize), hasMore: rows.length > historyPageSize }
}
