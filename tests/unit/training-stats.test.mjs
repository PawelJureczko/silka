import { test } from 'node:test'
import assert from 'node:assert/strict'
import { compareSessions, recordedStatsSet } from '../../app/domain/training-stats.ts'

const set = { id: 's', position: 0, set_type: 'working', status: 'completed', reps: 10, weight_kg: 20, planned_reps_min: 8, planned_reps_max: 12 }
const exercise = { id: 'e', exercise_id: 'catalog', equipment_snapshot: 'Hantle', load_mode_snapshot: 'external', weight_convention_snapshot: 'per_hand', position: 0, workout_sets: [set] }
const session = { source_workout_id: 'B', plan_id: 'p', workout_exercises: [exercise] }

test('porównanie rozdziela jednostki, plany, sprzęt, wariant i konwencję', () => {
  assert.equal(compareSessions(session, session)[0].matched, true)
  for (const patch of [{ source_workout_id: 'C' }, { plan_id: 'old' }, { source_workout_id: null }]) assert.equal(compareSessions(session, { ...session, ...patch })[0].matched, false)
  for (const patch of [{ exercise_id: 'other' }, { equipment_snapshot: 'Sztanga' }, { weight_convention_snapshot: 'total' }, { load_mode_snapshot: 'assisted' }]) assert.equal(compareSessions(session, { ...session, workout_exercises: [{ ...exercise, ...patch }] })[0].matched, false)
})
test('duplikat wariantu jest niejednoznaczny, rozgrzewki pomijamy, dodatkowe serie zachowujemy', () => {
  assert.equal(compareSessions(session, { ...session, workout_exercises: [exercise, exercise] })[0].ambiguous, true)
  const current = { ...session, workout_exercises: [{ ...exercise, workout_sets: [{ ...set, set_type: 'warmup' }, { ...set, position: 2 }, { ...set, position: 3, status: 'skipped' }] }] }
  const rows = compareSessions(current, session)[0].sets
  assert.equal(rows.length, 2)
  assert.equal(rows[0].current.position, 2)
  assert.equal(rows[1].previous, null)
  assert.equal(recordedStatsSet(rows[1].current, 'total'), 'Pominięta')
})
test('opis zachowuje zero, brak ciężaru, asystę i polski przecinek', () => {
  assert.equal(recordedStatsSet({ ...set, weight_kg: 12.5 }, 'per_hand'), '10 powt. × 12,5 kg / rękę')
  assert.match(recordedStatsSet({ ...set, weight_kg: 0 }, 'bodyweight'), /0 kg dodatkowo/)
  assert.match(recordedStatsSet({ ...set, weight_kg: null }, 'bodyweight'), /ciężar nieznany/)
  assert.match(recordedStatsSet(set, 'assistance'), /kg asysty/)
})
