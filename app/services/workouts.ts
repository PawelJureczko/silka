import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '#shared/types/database.generated'
import { previousSetsSchema, workoutSchema } from '#shared/schemas/workouts'
import type { WorkoutPayload } from '#shared/schemas/workouts'

type Client = SupabaseClient<Database>
export class WorkoutConflict extends Error {
  constructor(message = 'Trening zmienił się na innym urządzeniu. Twój szkic pozostaje bezpieczny lokalnie. Odczytaj wersję z konta, aby rozstrzygnąć konflikt.') { super(message) }
}
export class WorkoutDeleted extends Error {
  sessionId: string
  constructor(sessionId: string) {
    super('Ten trening został trwale usunięty.')
    this.sessionId = sessionId
  }
}
export async function isWorkoutDeleted(client: Client, id: string) {
  const { data, error } = await client.from('deleted_workout_sessions').select('session_id').eq('session_id', id).abortSignal(AbortSignal.timeout(12000)).maybeSingle()
  // Older databases must still sync workouts until the deletion migration is installed.
  if (error?.code === 'PGRST205') return false
  if (error) throw new Error('Nie udało się sprawdzić stanu treningu. Ponów po odzyskaniu połączenia.')
  return Boolean(data)
}
export async function deleteWorkout(client: Client, id: string, revision: number) {
  const { error } = await client.rpc('delete_workout', { p_id: id, p_base_revision: revision }).abortSignal(AbortSignal.timeout(12000))
  if (error?.code === 'PGRST202') throw new Error('Usuwanie treningów nie jest jeszcze dostępne. Spróbuj po aktualizacji aplikacji.')
  if (error?.code === 'PT409') throw new WorkoutConflict('Trening zmienił się od ostatniego odczytu. Odczytaj wersję z konta przed ponownym usunięciem.')
  if (error) throw new Error('Nie potwierdzono usunięcia treningu. Sprawdź połączenie i ponów; ponowienie jest bezpieczne.')
}
function checkError(error: { code?: string } | null) {
  if (!error) return
  if (error.code === 'PT409') throw new WorkoutConflict()
  throw new Error(error.code === '42501' ? 'Brak dostępu do treningu. Zaloguj się ponownie na właściwe konto.' : 'Nie udało się zapisać na koncie. Szkic pozostaje lokalnie; ponów synchronizację.')
}
export async function startWorkout(client: Client, id: string, workoutId: string, revision: number) {
  const { error } = await client.rpc('start_workout', { p_id: id, p_workout_id: workoutId, p_plan_revision: revision }).abortSignal(AbortSignal.timeout(12000))
  if (error?.code === 'PT410') throw new WorkoutDeleted(id)
  if (error && ['23514', '42501'].includes(error.code))
    throw new WorkoutConflict('Nie można rozpocząć treningu z tego planu. Plan lub ćwiczenia nie są już dostępne. Anuluj próbę i odczytaj aktualne dane na ekranie Start.')
  checkError(error)
}
export async function saveWorkout(client: Client, id: string, revision: number, operationId: string, payload: WorkoutPayload) {
  const { data, error } = await client.rpc('save_workout', { p_id: id, p_base_revision: revision, p_operation_id: operationId, p_payload: payload }).abortSignal(AbortSignal.timeout(12000))
  if (error?.code === '42501' && await isWorkoutDeleted(client, id)) throw new WorkoutDeleted(id)
  checkError(error)
  if (data === null) throw new Error('Brak potwierdzenia zapisu. Ponów synchronizację.')
  return data
}
export async function fetchWorkout(client: Client, id: string) {
  const { data, error } = await client.from('workout_sessions').select('*,workout_exercises(*,workout_sets(*))').eq('id', id).abortSignal(AbortSignal.timeout(12000)).maybeSingle()
  if (!error && !data && await isWorkoutDeleted(client, id)) throw new WorkoutDeleted(id)
  if (error || !data) throw new Error('Nie udało się odczytać treningu z konta.')
  return workoutSchema.parse({ id: data.id, userId: data.user_id, planId: data.plan_id, sourceWorkoutId: data.source_workout_id,
    planRevision: data.plan_revision_snapshot, planName: data.plan_name_snapshot, workoutName: data.workout_name_snapshot,
    startedAt: data.started_at, finishedAt: data.finished_at, status: data.status, revision: data.revision, restEndsAt: data.rest_ends_at,
    exercises: data.workout_exercises.sort((a, b) => a.position - b.position).map(exercise => ({
      id: exercise.id, exerciseId: exercise.exercise_id, name: exercise.exercise_name_snapshot, equipment: exercise.equipment_snapshot,
      loadMode: exercise.load_mode_snapshot, weightConvention: exercise.weight_convention_snapshot, restSeconds: exercise.rest_seconds, notes: exercise.notes,
      sets: exercise.workout_sets.sort((a, b) => a.position - b.position).map(set => ({
        id: set.id, setType: set.set_type, plannedRepsMin: set.planned_reps_min, plannedRepsMax: set.planned_reps_max, plannedWeightKg: set.planned_weight_kg,
        reps: set.reps, weightKg: set.weight_kg, status: set.status, completedAt: set.completed_at,
      })),
    })),
  })
}
export async function fetchPreviousSets(client: Client, id: string) {
  const { data, error } = await client.rpc('previous_workout_sets', { p_session_id: id }).abortSignal(AbortSignal.timeout(12000))
  if (error) throw new Error('Nie udało się pobrać poprzednich wyników.')
  return previousSetsSchema.parse(data)
}
export async function fetchWorkoutDashboard(client: Client, timezone: string) {
  const localDate = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
  const signal = AbortSignal.timeout(12000)
  const activeRequest = client.from('workout_sessions').select('id').eq('status', 'active').abortSignal(signal).maybeSingle()
  const planRequest = client.from('plan_assignments').select('training_plans(id,name,revision,plan_workouts(id,name,weekday,position))').eq('is_active', true).abortSignal(signal).maybeSingle()
  const recentRequest = client.from('workout_sessions').select('id,workout_name_snapshot,started_at,finished_at,status,source_workout_id,plan_id').neq('status', 'active').order('started_at', { ascending: false }).limit(30).abortSignal(signal)
  const [active, plan, recent, weekly] = await Promise.all([activeRequest, planRequest, recentRequest, client.rpc('weekly_workout_count', { p_timezone: timezone }).abortSignal(signal)])
  if (active.error || plan.error || recent.error || weekly.error) throw new Error('Nie udało się odczytać danych treningowych.')
  const weekday = new Date(`${localDate}T12:00:00Z`).getUTCDay() || 7
  const selected = plan.data?.training_plans ?? null
  const workouts = selected?.plan_workouts.sort((a, b) => a.position - b.position) ?? []
  const last = recent.data.find(session => session.status === 'completed' && session.plan_id === selected?.id)
  const lastIndex = workouts.findIndex(workout => workout.id === last?.source_workout_id)
  const next = workouts.find(workout => workout.weekday === weekday) ?? workouts[(lastIndex + 1) % workouts.length] ?? null
  return { activeId: active.data?.id ?? null, plan: selected, workouts, next, recent: recent.data.slice(0, 3), weekly: weekly.data ?? 0 }
}
