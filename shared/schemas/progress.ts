import { z } from 'zod'
import { weightSchema } from './plans.ts'

const instant = z.iso.datetime({ offset: true })
export const exerciseVariantSchema = z.strictObject({
  exerciseId: z.uuid(), name: z.string().min(1).max(100), equipment: z.string().min(1).max(100),
  loadMode: z.enum(['external', 'bodyweight', 'assisted']),
  weightConvention: z.enum(['total', 'per_hand', 'bodyweight', 'assistance']),
})
export const progressOverviewSchema = z.strictObject({
  completedCount: z.number().int().nonnegative(),
  weeks: z.array(z.strictObject({ startsOn: z.iso.date(), count: z.number().int().nonnegative() })).length(12),
  exercises: z.array(exerciseVariantSchema).max(200),
})
export const exerciseProgressSchema = z.strictObject({
  incrementKg: weightSchema.refine(value => value > 0 && value <= 100).nullable(),
  record: z.strictObject({ sessionId: z.uuid(), startedAt: instant, weightKg: weightSchema.nullable(), reps: z.number().int().min(1).max(100) }).nullable(),
  points: z.array(z.strictObject({ sessionId: z.uuid(), startedAt: instant, reps: z.number().int().min(1).max(100), weightKg: weightSchema.nullable(), volumeKg: z.number().finite().nonnegative().nullable() })).max(30),
  latest: z.strictObject({
    sessionId: z.uuid(), startedAt: instant,
    sets: z.array(z.strictObject({ position: z.number().int().nonnegative(), repsMin: z.number().int().min(1).max(100).nullable(), repsMax: z.number().int().min(1).max(100).nullable(), weightKg: weightSchema.nullable(), reps: z.number().int().min(1).max(100).nullable(), status: z.enum(['pending', 'completed', 'skipped']) })).max(40).nullable(),
  }).nullable(),
})
export const workoutHistorySchema = z.array(z.strictObject({
  id: z.uuid(), workout_name_snapshot: z.string(), plan_name_snapshot: z.string(),
  started_at: instant, finished_at: instant, status: z.enum(['completed', 'abandoned']),
})).max(21)
export type ExerciseVariant = z.infer<typeof exerciseVariantSchema>
export type ProgressOverview = z.infer<typeof progressOverviewSchema>
export type ExerciseProgress = z.infer<typeof exerciseProgressSchema>
export type WorkoutHistory = z.infer<typeof workoutHistorySchema>
