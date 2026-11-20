import { z } from 'zod'
import { weightSchema } from './plans.ts'
import { nextLoadDecisionSchema } from './workouts.ts'

export const statsSessionHeadSchema = z.strictObject({
  id: z.uuid(), source_workout_id: z.uuid().nullable(), plan_id: z.uuid().nullable(),
  workout_name_snapshot: z.string(), plan_name_snapshot: z.string(),
  started_at: z.iso.datetime({ offset: true }), finished_at: z.iso.datetime({ offset: true }),
})
export const statsExerciseSchema = z.strictObject({
  id: z.uuid(), exercise_id: z.uuid(), exercise_name_snapshot: z.string(), equipment_snapshot: z.string(),
  load_mode_snapshot: z.enum(['external', 'bodyweight', 'assisted']),
  weight_convention_snapshot: z.enum(['total', 'per_hand', 'bodyweight', 'assistance']),
  position: z.number().int().nonnegative(), next_load_decision: nextLoadDecisionSchema,
  workout_sets: z.array(z.strictObject({
    id: z.uuid(), position: z.number().int().nonnegative(), set_type: z.enum(['working', 'warmup']),
    status: z.enum(['pending', 'completed', 'skipped']), reps: z.number().int().positive().nullable(),
    weight_kg: weightSchema.nullable(), planned_reps_min: z.number().int().positive().nullable(),
    planned_reps_max: z.number().int().positive().nullable(),
  })).max(40),
})
export const statsSessionSchema = statsSessionHeadSchema.extend({ workout_exercises: z.array(statsExerciseSchema).max(20) })
export type StatsSessionHead = z.infer<typeof statsSessionHeadSchema>
export type StatsSession = z.infer<typeof statsSessionSchema>
export type StatsExercise = z.infer<typeof statsExerciseSchema>

export const exerciseInsightsSchema = z.strictObject({
  records: z.array(z.strictObject({ weightKg: weightSchema.nullable(), reps: z.number().int().positive(), sessionId: z.uuid(), startedAt: z.iso.datetime({ offset: true }) })).max(21),
  decisions: z.array(z.strictObject({
    sessionId: z.uuid(), startedAt: z.iso.datetime({ offset: true }), decision: nextLoadDecisionSchema.nullable(),
    sets: z.array(z.strictObject({ reps: z.number().int().positive(), weightKg: weightSchema.nullable() })).max(800),
  })).max(12),
})

const count = z.number().int().nonnegative()
export const periodStatsSchema = z.strictObject({
  month: z.iso.date(), week: z.iso.date(),
  summary: z.strictObject({ sessions: count, previousSessions: count, minutes: count, previousMinutes: count, sets: count, previousSets: count, reps: count, planned: count, completedPlanned: count, inRange: count, below: count, above: count }),
  calendar: z.array(z.strictObject({ id: z.uuid(), day: z.iso.date(), name: z.string(), plan: z.string(), sourceId: z.uuid().nullable() })).max(201),
  muscles: z.array(z.strictObject({ name: z.string(), sets: count })),
})
export type PeriodStats = z.infer<typeof periodStatsSchema>
