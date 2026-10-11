import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '#shared/types/database.generated'
import { planSchema, exerciseSchema } from '#shared/schemas/plans'
import type { ExerciseInput, PlanExport, PlanInput } from '#shared/schemas/plans'

type Client = SupabaseClient<Database>
export type CatalogExercise = Database['public']['Tables']['exercises']['Row']
export const catalogPageSize = 50
export const planPageSize = 20

export function planError(error: { code?: string } | null): Error {
  if (error?.code === 'PT409') return new Error('Plan zmienił się od ostatniego odczytu. Odśwież dane przed kolejną edycją. Twoje zmiany pozostają w formularzu.')
  if (error?.code === '42501') return new Error('Nie masz dostępu do planu lub wybranego ćwiczenia. Odśwież katalog i sprawdź wybór.')
  return new Error('Nie udało się zapisać zmian. Sprawdź połączenie i spróbuj ponownie.')
}

export async function fetchCatalog(client: Client, search = '', page = 0) {
  const escaped = search.trim().replace(/[\\%_]/g, '\\$&')
  let query = client.from('exercises').select('*').is('archived_at', null).order('name').order('id')
  if (escaped) query = query.ilike('name', `%${escaped}%`)
  const { data, error } = await query.range(page * catalogPageSize, (page + 1) * catalogPageSize - 1)
  if (error) throw new Error('Nie udało się pobrać katalogu ćwiczeń.')
  return data
}

export async function fetchExercisesByIds(client: Client, ids: string[]) {
  if (!ids.length) return []
  const { data, error } = await client.from('exercises').select('*').in('id', [...new Set(ids)])
  if (error) throw new Error('Nie udało się pobrać ćwiczeń planu.')
  return data
}

export async function createExercise(client: Client, input: ExerciseInput, id: string) {
  const value = exerciseSchema.parse(input)
  const row = { id, name: value.name, equipment: value.equipment, muscle_group: value.muscleGroup,
    load_mode: value.loadMode, weight_convention: value.weightConvention, weight_increment_kg: value.weightIncrementKg }
  const { data, error } = await client.from('exercises').insert(row).select('*').single()
  if (error?.code === '23505') {
    const existing = await fetchExercisesByIds(client, [id])
    const found = existing[0]
    if (found && Object.entries(row).every(([key, expected]) => Reflect.get(found, key) === expected)) return found
  }
  if (error || !data) throw planError(error)
  return data
}

export async function fetchPlans(client: Client, archived: boolean, page = 0) {
  let query = client.from('training_plans').select('id,name,description,revision,archived_at,updated_at').order('updated_at', { ascending: false }).order('id')
  query = archived ? query.not('archived_at', 'is', null) : query.is('archived_at', null)
  const { data, error } = await query.range(page * planPageSize, (page + 1) * planPageSize - 1)
  if (error) throw new Error('Nie udało się pobrać planów.')
  return data
}

export async function fetchActivePlan(client: Client) {
  const { data, error } = await client.from('plan_assignments').select('plan_id').eq('is_active', true).maybeSingle()
  if (error) throw new Error('Nie udało się pobrać aktywnego planu.')
  return data?.plan_id ?? null
}

export async function fetchPlan(client: Client, id: string) {
  const { data, error } = await client.from('training_plans').select(`id,name,description,revision,archived_at,
    plan_workouts(name,weekday,position,plan_exercises(exercise_id,position,rest_seconds,notes,
      plan_sets(position,set_type,reps_min,reps_max,target_weight_kg)))`).eq('id', id).single()
  if (error) throw new Error('Plan jest niedostępny lub nie udało się go pobrać.')
  const plan = planSchema.parse({ name: data.name, description: data.description,
    workouts: data.plan_workouts.sort((a, b) => a.position - b.position).map(workout => ({
      name: workout.name, weekday: workout.weekday,
      exercises: workout.plan_exercises.sort((a, b) => a.position - b.position).map(exercise => ({
        exerciseId: exercise.exercise_id, restSeconds: exercise.rest_seconds, notes: exercise.notes,
        sets: exercise.plan_sets.sort((a, b) => a.position - b.position).map(set => ({
          setType: set.set_type, repsMin: set.reps_min, repsMax: set.reps_max, targetWeightKg: set.target_weight_kg,
        })),
      })),
    })),
  })
  const exercises = await fetchExercisesByIds(client, plan.workouts.flatMap(workout => workout.exercises.map(exercise => exercise.exerciseId)))
  return { id: data.id, revision: data.revision, archived: data.archived_at !== null, plan, exercises }
}

export async function savePlan(client: Client, id: string, baseRevision: number | null, operationId: string, input: PlanInput) {
  const plan = planSchema.parse(input)
  const request = baseRevision === null
    ? client.rpc('create_training_plan', { p_id: id, p_operation_id: operationId, p_plan: plan })
    : client.rpc('save_training_plan', { p_id: id, p_base_revision: baseRevision, p_operation_id: operationId, p_plan: plan })
  const { data, error } = await request.single()
  if (error || !data) throw planError(error)
  return data
}
export async function activatePlan(client: Client, id: string) {
  const { error } = await client.rpc('activate_training_plan', { p_id: id })
  if (error) throw planError(error)
}
export async function archivePlan(client: Client, id: string, baseRevision: number, archived: boolean) {
  const { error } = await client.rpc('archive_training_plan', { p_id: id, p_base_revision: baseRevision, p_archived: archived })
  if (error) throw planError(error)
}
export function buildPlanExport(plan: PlanInput, catalog: CatalogExercise[]): PlanExport {
  const ids = new Set(plan.workouts.flatMap(workout => workout.exercises.map(exercise => exercise.exerciseId)))
  return {
    format: 'silka-plan', schemaVersion: 1, plan,
    exercises: catalog.filter(exercise => ids.has(exercise.id)).map(exercise => ({
      id: exercise.id,
      ...exerciseSchema.parse({ name: exercise.name, equipment: exercise.equipment, muscleGroup: exercise.muscle_group,
        loadMode: exercise.load_mode, weightConvention: exercise.weight_convention, weightIncrementKg: exercise.weight_increment_kg }),
    })),
  }
}
