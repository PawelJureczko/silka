import { workoutPayloadSchema, workoutSchema } from '../../shared/schemas/workouts.ts'
import type { Workout, WorkoutJournal, WorkoutPayload } from '../../shared/schemas/workouts.ts'

export function workoutPayload(session: Workout): WorkoutPayload {
  return workoutPayloadSchema.parse({ status: session.status, finishedAt: session.finishedAt, restEndsAt: session.restEndsAt,
    exercises: session.exercises.map(exercise => ({ id: exercise.id, sets: exercise.sets.map(set => ({
      id: set.id, reps: set.reps, weightKg: set.weightKg, status: set.status, completedAt: set.completedAt,
    })) })),
  })
}
export function queueWorkout(journal: WorkoutJournal, session: Workout, operationId: string): WorkoutJournal {
  const next = { ...journal, session: workoutSchema.parse(session), queue: [...journal.queue] }
  const operation = { operationId, baseRevision: null, payload: workoutPayload(session) }
  // Only snapshots never sent to the server may be compacted. Each contains all prior changes.
  if (next.queue.at(-1)?.baseRevision === null) next.queue.pop()
  next.queue.push(operation)
  if (next.queue.length > 100) throw new Error('Kolejka jest pełna. Połącz się z internetem przed dalszą edycją.')
  return next
}
export function acknowledgeWorkout(journal: WorkoutJournal, operationId: string, revision: number): WorkoutJournal {
  if (journal.queue[0]?.operationId !== operationId) throw new Error('Kolejność zapisów uległa zmianie.')
  return { ...journal, serverRevision: revision, queue: journal.queue.slice(1), session: journal.session ? { ...journal.session, revision } : null }
}
export function finishWorkout(value: Workout, status: 'completed' | 'abandoned', now = Date.now()): Workout {
  const session = workoutSchema.parse(value)
  if (status === 'completed' && !session.exercises.some(exercise => exercise.sets.some(set => set.status === 'completed')))
    throw new Error('Wykonaj przynajmniej jedną serię albo porzuć trening.')
  session.status = status
  session.finishedAt = new Date(Math.max(now, Date.parse(session.startedAt))).toISOString()
  session.restEndsAt = null
  for (const exercise of session.exercises) {
    for (const set of exercise.sets) {
      if (set.status === 'pending') set.status = 'skipped'
    }
  }
  return session
}
export function restRemaining(end: string | null, now = Date.now()) {
  return end ? Math.max(0, Math.ceil((Date.parse(end) - now) / 1000)) : 0
}
export function workoutSummary(session: Workout) {
  const sets = session.exercises.flatMap(exercise => exercise.sets)
  return { completed: sets.filter(set => set.status === 'completed').length, skipped: sets.filter(set => set.status === 'skipped').length,
    minutes: Math.max(0, Math.round(((session.finishedAt ? Date.parse(session.finishedAt) : Date.now()) - Date.parse(session.startedAt)) / 60000)) }
}
