import { z } from 'zod'
import { weightSchema } from './plans.ts'

const instant = z.iso.datetime({ offset: true })
const reps = z.number().int().min(1).max(100).nullable()
export const workoutSetSchema = z.strictObject({
  id: z.uuid(),
  setType: z.enum(['working', 'warmup']),
  plannedRepsMin: reps,
  plannedRepsMax: reps,
  plannedWeightKg: weightSchema.nullable(),
  reps,
  weightKg: weightSchema.nullable(),
  status: z.enum(['pending', 'completed', 'skipped']),
  completedAt: instant.nullable(),
}).refine(set => set.status === 'completed' ? set.reps !== null && set.completedAt !== null : set.completedAt === null, 'Sprawdź powtórzenia i stan serii.')
export const workoutExerciseSchema = z.strictObject({
  id: z.uuid(), exerciseId: z.uuid(), name: z.string().min(1).max(100), equipment: z.string().min(1).max(100),
  loadMode: z.enum(['external', 'bodyweight', 'assisted']),
  weightConvention: z.enum(['total', 'per_hand', 'bodyweight', 'assistance']),
  restSeconds: z.number().int().min(0).max(900), notes: z.string().max(2000),
  sets: z.array(workoutSetSchema).min(1).max(40),
}).refine(exercise => exercise.loadMode === 'bodyweight' || exercise.sets.every(set => set.status !== 'completed' || set.weightKg !== null), 'Wykonana seria wymaga ciężaru.')
export const workoutSchema = z.strictObject({
  id: z.uuid(), userId: z.uuid(), planId: z.uuid().nullable(), sourceWorkoutId: z.uuid().nullable(),
  planRevision: z.number().int().positive().nullable(), planName: z.string(), workoutName: z.string(),
  startedAt: instant, finishedAt: instant.nullable(), restEndsAt: instant.nullable(),
  status: z.enum(['active', 'completed', 'abandoned']), revision: z.number().int().positive(),
  exercises: z.array(workoutExerciseSchema).min(1).max(20),
})
export const workoutPayloadSchema = z.strictObject({
  status: z.enum(['active', 'completed', 'abandoned']), finishedAt: instant.nullable(), restEndsAt: instant.nullable(),
  exercises: z.array(z.strictObject({ id: z.uuid(), sets: z.array(z.strictObject({
    id: z.uuid(), reps, weightKg: weightSchema.nullable(), status: z.enum(['pending', 'completed', 'skipped']), completedAt: instant.nullable(),
  })).min(1).max(40) })).min(1).max(20),
})
export const previousSetsSchema = z.array(z.strictObject({
  workoutExerciseId: z.uuid(), startedAt: instant,
  sets: z.array(z.strictObject({ position: z.number().int().min(0), setType: z.enum(['working', 'warmup']), reps: z.number().int().positive(), weightKg: weightSchema.nullable() })),
}))
export const workoutJournalSchema = z.strictObject({
  schemaVersion: z.literal(1), userId: z.uuid(), sessionId: z.uuid(),
  start: z.strictObject({ workoutId: z.uuid(), planRevision: z.number().int().positive() }).nullable(),
  session: workoutSchema.nullable(), previous: previousSetsSchema,
  serverRevision: z.number().int().positive().nullable(),
  queue: z.array(z.strictObject({ operationId: z.uuid(), baseRevision: z.number().int().positive().nullable(), payload: workoutPayloadSchema })).max(100),
  conflict: z.boolean(),
}).refine(value => value.session === null || (value.session.userId === value.userId && value.session.id === value.sessionId), 'Szkic należy do innego konta.')

export type Workout = z.infer<typeof workoutSchema>
export type WorkoutSet = z.infer<typeof workoutSetSchema>
export type WorkoutExercise = z.infer<typeof workoutExerciseSchema>
export type WorkoutPayload = z.infer<typeof workoutPayloadSchema>
export type WorkoutJournal = z.infer<typeof workoutJournalSchema>
export type PreviousSets = z.infer<typeof previousSetsSchema>
