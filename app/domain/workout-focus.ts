import type { Workout } from '../../shared/schemas/workouts.ts'

export function nextWorkoutSet(workout: Workout, selectedId: string | null = null) {
  const sets = workout.exercises.flatMap((exercise, exerciseIndex) => exercise.sets.map((set, setIndex) => ({ exercise, exerciseIndex, set, setIndex })))
  const selected = sets.findIndex(item => item.set.id === selectedId)
  const current = sets[selected]
  if (current?.set.status === 'pending') return current
  const ordered = selected >= 0 ? [...sets.slice(selected + 1), ...sets.slice(0, selected + 1)] : sets
  return ordered.find(item => item.set.status === 'pending') ?? null
}
