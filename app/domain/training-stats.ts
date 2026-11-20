import type { StatsExercise, StatsSession } from '../../shared/schemas/training-stats.ts'

export function statsVariantKey(exercise: StatsExercise) {
  return JSON.stringify([exercise.exercise_id, exercise.equipment_snapshot, exercise.load_mode_snapshot, exercise.weight_convention_snapshot])
}
export function workingSets(exercise: StatsExercise) {
  return exercise.workout_sets.filter(set => set.set_type === 'working').toSorted((a, b) => a.position - b.position)
}
export function planCompletion(session: StatsSession) {
  const planned = session.workout_exercises.flatMap(workingSets).filter(set => set.planned_reps_min !== null && set.planned_reps_max !== null)
  const completed = planned.filter(set => set.status === 'completed' && set.reps !== null)
  return {
    planned: planned.length, completed: completed.length,
    inRange: completed.filter(set => set.reps! >= set.planned_reps_min! && set.reps! <= set.planned_reps_max!).length,
    below: completed.filter(set => set.reps! < set.planned_reps_min!).length,
    above: completed.filter(set => set.reps! > set.planned_reps_max!).length,
    extra: session.workout_exercises.flatMap(workingSets).filter(set => set.planned_reps_min === null && set.status === 'completed').length,
  }
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

export function localDateKey(now: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now)
  const part = (type: string) => parts.find(item => item.type === type)?.value
  return `${part('year')}-${part('month')}-${part('day')}`
}
export function shiftDate(day: string, amount: number) {
  const date = new Date(`${day}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() + amount)
  return date.toISOString().slice(0, 10)
}
export function mondayOf(day: string) {
  return shiftDate(day, -((new Date(`${day}T12:00:00Z`).getUTCDay() + 6) % 7))
}
export function shiftMonth(month: string, amount: number) {
  const date = new Date(`${month}T12:00:00Z`)
  date.setUTCMonth(date.getUTCMonth() + amount, 1)
  return date.toISOString().slice(0, 10)
}
export function monthCells(month: string) {
  const first = mondayOf(month)
  const end = shiftMonth(month, 1)
  const result: (string | null)[] = []
  for (let day = first; day < end; day = shiftDate(day, 1)) result.push(day < month ? null : day)
  while (result.length % 7) result.push(null)
  return result
}
