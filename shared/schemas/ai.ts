import { z } from 'zod'
import { planSchema, weightSchema } from './plans.ts'

export const aiActionSchema = z.enum(['create_plan', 'replace_plan', 'analyze_history', 'suggest_progression'])
const envelope = { schemaVersion: z.literal(1), requestId: z.uuid() }
const text = z.string().trim().min(1).max(2000)
export const aiResponseSchema = z.discriminatedUnion('action', [
  z.strictObject({ ...envelope, action: z.literal('create_plan'), payload: z.strictObject({ plan: planSchema }) }),
  z.strictObject({ ...envelope, action: z.literal('replace_plan'), target: z.strictObject({ planId: z.uuid(), baseRevision: z.number().int().positive() }), payload: z.strictObject({ plan: planSchema }) }),
  z.strictObject({ ...envelope, action: z.literal('analyze_history'), payload: z.strictObject({ summary: z.string().trim().min(1).max(4000), observations: z.array(text).max(50), recommendations: z.array(text).max(50) }) }),
  z.strictObject({ ...envelope, action: z.literal('suggest_progression'), payload: z.strictObject({ suggestions: z.array(z.strictObject({ exerciseId: z.uuid(), suggestedWeightKg: weightSchema, reason: text })).min(1).max(100) }) }),
])
const catalogItem = z.strictObject({ id: z.uuid(), name: z.string(), equipment: z.string(), loadMode: z.enum(['external', 'bodyweight', 'assisted']), weightConvention: z.enum(['total', 'per_hand', 'bodyweight', 'assistance']), weightIncrementKg: weightSchema })
export const aiContextSchema = z.strictObject({
  plan: planSchema.nullable(),
  catalog: z.array(catalogItem).max(200),
  historyLimit: z.union([z.literal(0), z.literal(10), z.literal(20)]),
  instructions: z.string().max(2000),
  history: z.array(z.strictObject({
    startedAt: z.iso.datetime({ offset: true }), workoutName: z.string(),
    exercises: z.array(z.strictObject({
      exerciseId: z.uuid(), name: z.string(), equipment: z.string(), loadMode: z.string(), weightConvention: z.string(),
      sets: z.array(z.strictObject({ setType: z.enum(['working', 'warmup']), reps: z.number().int().min(1).max(100), weightKg: weightSchema.nullable() })).max(40),
    })).max(20),
  })).max(20),
})
export const aiResultSchema = z.strictObject({ planId: z.uuid().nullable(), revision: z.number().int().positive().nullable() })
export const aiRequestSchema = z.strictObject({ id: z.uuid(), action: aiActionSchema, planId: z.uuid().nullable(), baseRevision: z.number().int().positive().nullable(), context: aiContextSchema, applied: z.boolean(), response: aiResponseSchema.nullable(), result: aiResultSchema.nullable() })
export const aiSelectionSchema = z.strictObject({ suggestionIndex: z.number().int().min(0).max(99), workoutIndex: z.number().int().min(0).max(6), exerciseIndex: z.number().int().min(0).max(19), setIndex: z.number().int().min(0).max(19) })
export const recentAiSchema = z.array(z.strictObject({ id: z.uuid(), action: aiActionSchema, created_at: z.iso.datetime({ offset: true }), applied_hash: z.string().nullable() })).max(10)
export type AiAction = z.infer<typeof aiActionSchema>
export type AiResponse = z.infer<typeof aiResponseSchema>
export type AiRequest = z.infer<typeof aiRequestSchema>
export type AiSelection = z.infer<typeof aiSelectionSchema>
