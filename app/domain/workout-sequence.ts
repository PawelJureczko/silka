export function nextWorkoutInSequence<T extends { id: string }>(workouts: readonly T[], lastCompletedWorkoutId: string | null): T | null {
  if (!workouts.length) return null
  const lastIndex = workouts.findIndex(workout => workout.id === lastCompletedWorkoutId)
  return workouts[(lastIndex + 1) % workouts.length] ?? null
}
