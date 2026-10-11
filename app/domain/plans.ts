import { planExportSchema, planSchema } from '../../shared/schemas/plans.ts'
import type { PlanExport, PlanInput, PlanSetInput, PlanWorkoutInput } from '../../shared/schemas/plans.ts'

export const maxPlanBytes = 256 * 1024
export function newSet(): PlanSetInput {
  return { setType: 'working', repsMin: 8, repsMax: 12, targetWeightKg: null }
}
export function newWorkout(): PlanWorkoutInput {
  return { name: '', weekday: null, exercises: [] }
}
export function newPlan(): PlanInput {
  return { name: '', description: '', workouts: [newWorkout()] }
}
export function moveItem<T>(items: T[], index: number, direction: -1 | 1) {
  const target = index + direction
  if (target < 0 || target >= items.length)
    return
  const item = items.splice(index, 1)[0]
  if (item !== undefined)
    items.splice(target, 0, item)
}
export function parseDecimal(value: string): number | null {
  const text = value.trim().replace(',', '.')
  if (!text)
    return null
  if (!/^\d+(?:\.\d{1,2})?$/.test(text))
    return Number.NaN
  return Number(text)
}
export function parsePlanExport(text: string): PlanExport {
  if (new TextEncoder().encode(text).byteLength > maxPlanBytes)
    throw new Error('Plik przekracza limit 256 KiB.')
  let value: unknown
  try {
    value = JSON.parse(text)
  }
  catch {
    throw new Error('To nie jest poprawny JSON. Wklej pełny eksport planu z Siłki.')
  }
  const result = planExportSchema.safeParse(value)
  if (!result.success)
    throw new Error(result.error.issues[0]?.message ?? 'Niepoprawny eksport planu.')
  return result.data
}
export function mapImportedPlan(source: PlanExport, mapping: Record<string, string>): PlanInput {
  const copy = planSchema.parse(source.plan)
  copy.name = `${copy.name.slice(0, 91)} — kopia`
  for (const workout of copy.workouts) {
    for (const exercise of workout.exercises) {
      const target = mapping[exercise.exerciseId]
      if (!target)
        throw new Error('Wybierz odpowiednik każdego ćwiczenia.')
      exercise.exerciseId = target
    }
  }
  return planSchema.parse(copy)
}
