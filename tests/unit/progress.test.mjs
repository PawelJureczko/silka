import { test } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { applySuggestedWeight, suggestWeight, regularity, exerciseVariantKey } from '../../app/domain/progress.ts'
import { profileInputSchema } from '../../shared/schemas/profile.ts'

const exercise = { id: randomUUID(), exerciseId: randomUUID(), name: 'Test', equipment: 'Sztanga', loadMode: 'external', weightConvention: 'total', restSeconds: 60, notes: '', sets: [0, 1].map(() => ({ id: randomUUID(), setType: 'working', plannedRepsMin: 8, plannedRepsMax: 12, plannedWeightKg: 80, reps: null, weightKg: null, status: 'pending', completedAt: null })) }
const history = { incrementKg: 2.5, record: null, points: [], latest: { sessionId: randomUUID(), startedAt: '2026-10-11T10:00:00Z', sets: [0, 1].map(position => ({ position, repsMin: 8, repsMax: 12, reps: 12, weightKg: 80, status: 'completed' })) } }

test('zatwierdzenie sugestii uzupełnia tylko wskazane ciężary; nie zmienia planu i wykonania', () => {
  const session = { id: randomUUID(), status: 'active', exercises: [structuredClone(exercise)] }
  const expected = session.exercises[0].sets.map(({ id, weightKg, reps }) => ({ id, weightKg, reps }))
  applySuggestedWeight(session, session.id, exercise.id, expected, 83.75)
  for (const set of session.exercises[0].sets) {
    assert.equal(set.weightKg, 83.75)
    assert.equal(set.plannedWeightKg, 80)
    assert.equal(set.reps, null)
    assert.equal(set.status, 'pending')
  }
})
test('nieaktualny podgląd i błędny ciężar są odrzucane bez częściowego zastosowania', () => {
  for (const patch of [{ weightKg: 81 }, { reps: 5 }, { status: 'completed' }, { setType: 'warmup' }]) {
    const session = { id: randomUUID(), status: 'active', exercises: [structuredClone(exercise)] }
    const expected = session.exercises[0].sets.map(({ id, weightKg, reps }) => ({ id, weightKg, reps }))
    Object.assign(session.exercises[0].sets[1], patch)
    assert.throws(() => applySuggestedWeight(session, session.id, exercise.id, expected, 85))
    assert.equal(session.exercises[0].sets[0].weightKg, null)
  }
  const session = { id: randomUUID(), status: 'active', exercises: [structuredClone(exercise)] }
  const expected = session.exercises[0].sets.map(({ id, weightKg, reps }) => ({ id, weightKg, reps }))
  for (const weight of [-1, 1001, 83.755, Infinity]) assert.throws(() => applySuggestedWeight(session, session.id, exercise.id, expected, weight))
  assert.throws(() => applySuggestedWeight(session, randomUUID(), exercise.id, expected, 85))
  session.status = 'completed'
  assert.throws(() => applySuggestedWeight(session, session.id, exercise.id, expected, 85))
  assert.equal(session.exercises[0].sets[0].weightKg, null)
})

test('sugestia zwiększa ciężar dopiero po wszystkich górnych zakresach; asysta maleje', () => {
  assert.equal(suggestWeight(exercise, history).weightKg, 82.5)
  assert.equal(suggestWeight({ ...exercise, loadMode: 'assisted', weightConvention: 'assistance' }, history).weightKg, 77.5)
  assert.equal(suggestWeight({ ...exercise, loadMode: 'bodyweight', weightConvention: 'bodyweight' }, history).weightKg, null)
  const lower = structuredClone(history)
  lower.latest.sets[1].reps = 7
  assert.equal(suggestWeight(exercise, lower).weightKg, 80)
  assert.equal(exercise.sets[0].weightKg, null)
})
test('niepełna, zmieniona lub niejednoznaczna historia nie daje sugestii', () => {
  for (const patch of [{ status: 'skipped' }, { weightKg: null }, { weightKg: 82.5 }, { repsMax: 10 }, { position: 3 }]) {
    const changed = structuredClone(history)
    Object.assign(changed.latest.sets[1], patch)
    assert.equal(suggestWeight(exercise, changed).weightKg, null)
  }
  assert.equal(suggestWeight(exercise, { ...history, incrementKg: null }).weightKg, null)
  assert.equal(suggestWeight(exercise, { ...history, latest: null }).weightKg, null)
  assert.equal(suggestWeight({ ...exercise, sets: exercise.sets.slice(0, 1) }, history).weightKg, null)
})
test('rozgrzewka i dodatkowa seria nie zmieniają reguły; zero i granice są obsługiwane', () => {
  const value = structuredClone(exercise)
  value.sets.push({ ...value.sets[0], id: randomUUID(), plannedRepsMin: null, plannedRepsMax: null })
  const previous = structuredClone(history)
  previous.latest.sets.push({ position: 2, repsMin: null, repsMax: null, reps: null, weightKg: null, status: 'skipped' })
  assert.equal(suggestWeight(value, previous).weightKg, 82.5)
  const warmed = structuredClone(value)
  warmed.sets.unshift({ ...warmed.sets[0], id: randomUUID(), setType: 'warmup' })
  const warmedHistory = structuredClone(previous)
  for (const set of warmedHistory.latest.sets) set.position++
  assert.equal(suggestWeight(warmed, warmedHistory).weightKg, 82.5)
  previous.latest.sets[0].weightKg = previous.latest.sets[1].weightKg = 0
  assert.equal(suggestWeight(value, previous).weightKg, 2.5)
  assert.equal(suggestWeight({ ...value, loadMode: 'assisted' }, previous).weightKg, 0)
  previous.latest.sets[0].weightKg = previous.latest.sets[1].weightKg = 1000
  assert.equal(suggestWeight(value, previous).weightKg, 1000)
  assert.notEqual(exerciseVariantKey({ ...exercise, weightConvention: 'per_hand' }), exerciseVariantKey(exercise))
})
test('regularność ma 12 tygodni, cel i toleruje niezakończony pusty tydzień', () => {
  const weeks = [0, 2, 3, 1, 0].map((count, index) => ({ startsOn: `2026-09-0${index + 1}`, count }))
  assert.deepEqual(regularity(weeks, 3), { activeWeeks: 3, targetWeeks: 1, streak: 3 })
  assert.equal(regularity([{ startsOn: '2026-10-05', count: 0 }], 3).streak, 0)
})
test('profil waliduje zakres celu tygodnia i strefę czasową', () => {
  const value = { displayName: ' Paweł ', trainingGoal: 'Regularność', timezone: 'Europe/Warsaw', weeklyTarget: 3 }
  assert.equal(profileInputSchema.parse(value).displayName, 'Paweł')
  for (const changes of [{ weeklyTarget: 0 }, { weeklyTarget: 8 }, { weeklyTarget: 2.5 }, { timezone: 'Nie/Ma' }, { displayName: ' ' }, { userId: randomUUID() }]) assert.equal(profileInputSchema.safeParse({ ...value, ...changes }).success, false)
})
