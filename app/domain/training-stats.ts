import type { StatsExercise, StatsSession } from '../../shared/schemas/training-stats.ts'

export function statsVariantKey(exercise: StatsExercise) {
  return JSON.stringify([exercise.exercise_id, exercise.equipment_snapshot, exercise.load_mode_snapshot, exercise.weight_convention_snapshot])
}
export function workingSets(exercise: StatsExercise) {
  return exercise.workout_sets.filter(set => set.set_type === 'working').toSorted((a, b) => a.position - b.position)
}
export function compareSessions(current: StatsSession, previous: StatsSession | null) {
  const comparable = previous && current.source_workout_id !== null && current.source_workout_id === previous.source_workout_id && current.plan_id === previous.plan_id
  return current.workout_exercises.toSorted((a, b) => a.position - b.position).map((exercise) => {
    const key = statsVariantKey(exercise)
    const matches = comparable ? previous.workout_exercises.filter(item => statsVariantKey(item) === key) : []
    const ambiguous = current.workout_exercises.filter(item => statsVariantKey(item) === key).length > 1 || matches.length > 1
    const before = !ambiguous ? matches[0] : undefined
    const nowSets = workingSets(exercise)
    const oldSets = before ? workingSets(before) : []
    return { exercise, ambiguous, matched: Boolean(before), sets: Array.from({ length: Math.max(nowSets.length, oldSets.length) }, (_, index) => ({ current: nowSets[index] ?? null, previous: oldSets[index] ?? null })) }
  })
}
export function recordedStatsSet(set: ReturnType<typeof workingSets>[number] | null, convention: StatsExercise['weight_convention_snapshot']) {
  if (!set) return 'Brak serii'
  if (set.status !== 'completed') return set.status === 'skipped' ? 'Pominięta' : 'Niewykonana'
  const number = (value: number) => new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 2 }).format(value)
  const weight = set.weight_kg === null ? 'ciężar nieznany' : `${number(set.weight_kg)} kg${convention === 'per_hand' ? ' / rękę' : convention === 'assistance' ? ' asysty' : convention === 'bodyweight' ? ' dodatkowo' : ''}`
  return `${set.reps ?? '?'} powt. × ${weight}`
}
