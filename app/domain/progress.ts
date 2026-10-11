import type { ExerciseProgress, ProgressOverview } from '../../shared/schemas/progress.ts'
import type { Workout, WorkoutExercise } from '../../shared/schemas/workouts.ts'
import { weightSchema } from '../../shared/schemas/plans.ts'

export function applySuggestedWeight(session: Workout, sessionId: string, exerciseId: string, expected: { id: string, weightKg: number | null, reps: number | null }[], weightKg: number) {
  weightSchema.parse(weightKg)
  if (session.id !== sessionId || session.status !== 'active') throw new Error('Sesja zmieniła się. Otwórz propozycję ponownie.')
  const current = session.exercises.find(item => item.id === exerciseId)
  if (!current || !expected.length) throw new Error('Nie ma serii do uzupełnienia.')
  const sets = expected.map((before) => {
    const found = current.sets.find(set => set.id === before.id)
    if (!found || found.status !== 'pending' || found.setType !== 'working' || found.weightKg !== before.weightKg || found.reps !== before.reps)
      throw new Error('Serie zmieniły się od podglądu. Otwórz propozycję ponownie.')
    return found
  })
  for (const set of sets) set.weightKg = weightKg
}

export function exerciseVariantKey(value: { exerciseId: string, equipment: string, loadMode: string, weightConvention: string }) {
  return JSON.stringify([value.exerciseId, value.equipment, value.loadMode, value.weightConvention])
}
export function regularity(weeks: ProgressOverview['weeks'], target: number) {
  let streak = 0
  const end = weeks.at(-1)?.count ? weeks.length - 1 : weeks.length - 2
  for (let i = end; i >= 0 && (weeks[i]?.count ?? 0) > 0; i--) streak++
  return { activeWeeks: weeks.filter(week => week.count > 0).length, targetWeeks: weeks.filter(week => week.count >= target).length, streak }
}
export function suggestWeight(exercise: WorkoutExercise, history: ExerciseProgress): { weightKg: number, reason: string } | { reason: string, weightKg: null } {
  const unavailable = (reason: string) => ({ weightKg: null, reason })
  if (exercise.loadMode === 'bodyweight') return unavailable('Dla ćwiczeń z masą ciała porównuj powtórzenia i dodatkowy ciężar samodzielnie.')
  if (!history.latest || history.incrementKg === null) return unavailable('Brakuje zgodnej historii lub kroku ciężaru ćwiczenia.')
  const current = exercise.sets.map((set, position) => ({ ...set, position })).filter(set => set.setType === 'working' && set.plannedRepsMin !== null && set.plannedRepsMax !== null)
  const previous = (history.latest.sets ?? []).filter(set => set.repsMin !== null && set.repsMax !== null)
  if (!current.length || current.length !== previous.length || !current.every((set, index) => {
    const prior = previous[index]
    return prior && prior.position === set.position && prior.repsMin === set.plannedRepsMin && prior.repsMax === set.plannedRepsMax
  })) return unavailable('Liczba, kolejność lub zakresy serii zmieniły się. Porównaj wyniki ręcznie.')
  const weight = previous[0]?.weightKg
  if (weight === null || weight === undefined || previous.some(set => set.status !== 'completed' || set.reps === null || set.weightKg !== weight))
    return unavailable('Ostatnia sesja nie ma kompletu wykonanych serii roboczych przy jednym ciężarze.')
  const top = previous.every(set => set.reps !== null && set.repsMax !== null && set.reps >= set.repsMax)
  if (!top) return { weightKg: weight, reason: 'Utrzymaj ciężar: ostatnio nie wszystkie serie osiągnęły górny zakres powtórzeń.' }
  const direction = exercise.loadMode === 'assisted' ? -1 : 1
  const proposed = Math.round((weight + direction * history.incrementKg) * 100) / 100
  if (proposed < 0 || proposed > 1000) return { weightKg: weight, reason: 'Utrzymaj ciężar: kolejny krok przekracza zakres zapisu 0–1000 kg.' }
  return { weightKg: proposed, reason: `Wszystkie zaplanowane serie osiągnęły górny zakres. Propozycja: ${direction > 0 ? 'zwiększ ciężar' : 'zmniejsz asystę'} o ${String(history.incrementKg).replace('.', ',')} kg.` }
}
