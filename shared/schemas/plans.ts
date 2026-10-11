import { z } from 'zod'

const name = z.string().trim().min(1, 'Podaj nazwę.').max(100, 'Nazwa może mieć najwyżej 100 znaków.')
const note = z.string().max(2000, 'Tekst może mieć najwyżej 2000 znaków.')
export const weightSchema = z.number().finite().min(0).max(1000).refine(value => Math.abs(value * 100 - Math.round(value * 100)) < 1e-8, 'Ciężar może mieć najwyżej dwa miejsca po przecinku.')
export const planSetSchema = z.strictObject({
  setType: z.enum(['working', 'warmup']),
  repsMin: z.number().int().min(1).max(100),
  repsMax: z.number().int().min(1).max(100),
  targetWeightKg: weightSchema.nullable(),
}).refine(value => value.repsMin <= value.repsMax, { message: 'Minimum powtórzeń nie może przekraczać maksimum.', path: ['repsMax'] })
export const planExerciseSchema = z.strictObject({
  exerciseId: z.uuid(),
  restSeconds: z.number().int().min(0).max(900),
  notes: note,
  sets: z.array(planSetSchema).min(1, 'Dodaj przynajmniej jedną serię.').max(20),
})
export const planWorkoutSchema = z.strictObject({
  name,
  weekday: z.number().int().min(1).max(7).nullable(),
  exercises: z.array(planExerciseSchema).min(1, 'Dodaj przynajmniej jedno ćwiczenie.').max(20),
})
export const planSchema = z.strictObject({
  name,
  description: note,
  workouts: z.array(planWorkoutSchema).min(1, 'Dodaj przynajmniej jeden trening.').max(7),
})
export const exerciseSchema = z.strictObject({
  name,
  equipment: name,
  muscleGroup: name,
  loadMode: z.enum(['external', 'bodyweight', 'assisted']),
  weightConvention: z.enum(['total', 'per_hand', 'bodyweight', 'assistance']),
  weightIncrementKg: weightSchema.refine(value => value > 0 && value <= 100, 'Krok ciężaru musi wynosić więcej niż 0 i najwyżej 100 kg.'),
}).refine(value => (
  (value.loadMode === 'external' && ['total', 'per_hand'].includes(value.weightConvention))
  || (value.loadMode === 'bodyweight' && value.weightConvention === 'bodyweight')
  || (value.loadMode === 'assisted' && value.weightConvention === 'assistance')
), { message: 'Sposób zapisu ciężaru musi pasować do rodzaju obciążenia.', path: ['weightConvention'] })

export const planExportSchema = z.strictObject({
  format: z.literal('silka-plan'),
  schemaVersion: z.literal(1),
  plan: planSchema,
  exercises: z.array(exerciseSchema.safeExtend({ id: z.uuid() })).min(1).max(140),
}).superRefine((value, context) => {
  const ids = new Set(value.exercises.map(exercise => exercise.id))
  const used = new Set(value.plan.workouts.flatMap(workout => workout.exercises.map(exercise => exercise.exerciseId)))
  if (ids.size !== value.exercises.length) context.addIssue({ code: 'custom', message: 'Katalog zawiera powtórzone identyfikatory.' })
  if ([...ids].some(id => !used.has(id))) context.addIssue({ code: 'custom', message: 'Katalog zawiera ćwiczenie nieużyte w planie.' })
  for (const workout of value.plan.workouts) {
    for (const exercise of workout.exercises) {
      if (!ids.has(exercise.exerciseId)) context.addIssue({ code: 'custom', message: 'Brakuje opisu ćwiczenia użytego w planie.' })
    }
  }
})

export type PlanInput = z.infer<typeof planSchema>
export type PlanWorkoutInput = z.infer<typeof planWorkoutSchema>
export type PlanExerciseInput = z.infer<typeof planExerciseSchema>
export type PlanSetInput = z.infer<typeof planSetSchema>
export type ExerciseInput = z.infer<typeof exerciseSchema>
export type PlanExport = z.infer<typeof planExportSchema>
