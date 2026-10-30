import type { PreviousSets, Workout, WorkoutExercise } from '../../shared/schemas/workouts.ts'

export function nextWorkoutSet(workout: Workout, selectedId: string | null = null) {
  const sets = workout.exercises.flatMap((exercise, exerciseIndex) => exercise.sets.map((set, setIndex) => ({ exercise, exerciseIndex, set, setIndex })))
  const selected = sets.findIndex(item => item.set.id === selectedId)
  const current = sets[selected]
  if (current?.set.status === 'pending') return current
  const ordered = selected >= 0 ? [...sets.slice(selected + 1), ...sets.slice(0, selected + 1)] : sets
  return ordered.find(item => item.set.status === 'pending') ?? null
}

export function previousRestSets(exercise: WorkoutExercise, setIndex: number, previous: PreviousSets) {
  const set = exercise.sets[setIndex]
  const history = previous.find(item => item.workoutExerciseId === exercise.id)
  const sameType = history?.sets.filter(item => item.setType === set?.setType) ?? []
  const matching = sameType.find(item => item.position === setIndex)
  return { exact: Boolean(matching), sets: matching ? [matching] : sameType }
}

export function recordedSetLabel(set: { reps: number, weightKg: number | null }, convention: WorkoutExercise['weightConvention']) {
  const repetitions = `${set.reps} powt.`
  if (set.weightKg === null) return `${repetitions} · ciężar niezapisany`
  const weight = new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 2 }).format(set.weightKg)
  if (convention === 'bodyweight') return `${repetitions} · ${set.weightKg === 0 ? 'masa ciała' : `+${weight} kg`}`
  const unit = { total: 'kg łącznie', per_hand: 'kg na rękę', assistance: 'kg asysty' }[convention]
  return `${repetitions} × ${weight} ${unit}`
}
