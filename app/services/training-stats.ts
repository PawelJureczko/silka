import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '#shared/types/database.generated'
import { z } from 'zod'
import { exerciseInsightsSchema, periodStatsSchema, statsSessionHeadSchema, statsSessionSchema } from '../../shared/schemas/training-stats.ts'
import type { ExerciseVariant } from '#shared/schemas/progress'

type Client = SupabaseClient<Database>

export async function fetchPeriodStats(client: Client, month: string, week: string, timezone: string) {
  const { data, error } = await client.rpc('training_period_stats', { p_month: month, p_week: week, p_timezone: timezone }).abortSignal(AbortSignal.timeout(12000))
  if (error) throw new Error('Nie udało się pobrać podsumowania okresu.')
  return periodStatsSchema.parse(data)
}

export async function fetchExerciseInsights(client: Client, variant: ExerciseVariant, page: number) {
  const { data, error } = await client.rpc('exercise_insights', { p_exercise_id: variant.exerciseId, p_equipment: variant.equipment, p_load_mode: variant.loadMode, p_weight_convention: variant.weightConvention, p_page: page }).abortSignal(AbortSignal.timeout(12000))
  if (error) throw new Error('Nie udało się pobrać rekordów i decyzji.')
  return exerciseInsightsSchema.parse(data)
}
const head = 'id,source_workout_id,plan_id,workout_name_snapshot,plan_name_snapshot,started_at,finished_at' as const
const graph = `${head},workout_exercises(id,exercise_id,exercise_name_snapshot,equipment_snapshot,load_mode_snapshot,weight_convention_snapshot,position,next_load_decision,workout_sets(id,position,set_type,status,reps,weight_kg,planned_reps_min,planned_reps_max))` as const

export async function fetchComparisonOptions(client: Client) {
  const { data, error } = await client.from('workout_sessions').select(head).eq('status', 'completed').not('source_workout_id', 'is', null).order('started_at', { ascending: false }).order('id', { ascending: false }).limit(60).abortSignal(AbortSignal.timeout(12000))
  if (error) throw new Error('Nie udało się pobrać jednostek treningowych.')
  const rows = z.array(statsSessionHeadSchema).max(60).parse(data)
  return rows.filter((item, index) => rows.findIndex(other => other.source_workout_id === item.source_workout_id && other.plan_id === item.plan_id) === index)
}
export async function fetchSessionComparison(client: Client, sourceId: string, planId: string | null) {
  let query = client.from('workout_sessions').select(graph).eq('status', 'completed').eq('source_workout_id', sourceId)
  query = planId === null ? query.is('plan_id', null) : query.eq('plan_id', planId)
  const { data, error } = await query.order('started_at', { ascending: false }).order('id', { ascending: false }).limit(2).abortSignal(AbortSignal.timeout(12000))
  if (error) throw new Error('Nie udało się pobrać porównania treningów.')
  return z.array(statsSessionSchema).max(2).parse(data)
}
