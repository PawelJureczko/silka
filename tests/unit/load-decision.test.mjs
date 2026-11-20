import { test } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { workoutSchema, workoutJournalSchema, nextLoadDecisionSchema } from '../../shared/schemas/workouts.ts'
import { changeLoadDecision } from '../../app/domain/load-decision.ts'
import { workoutPayload, queueWorkout } from '../../app/domain/workouts.ts'
import { replaceWorkoutExercise } from '../../app/domain/workout-replacement.ts'

function fixture() {
  return workoutSchema.parse({ id: randomUUID(), userId: randomUUID(), planId: null, sourceWorkoutId: null, planRevision: null, planName: 'Test', workoutName: 'A', startedAt: '2026-11-20T10:00:00Z', finishedAt: null, restEndsAt: null, status: 'active', revision: 1,
    exercises: [{ id: randomUUID(), exerciseId: randomUUID(), name: 'Test', equipment: 'Hantle', loadMode: 'external', weightConvention: 'per_hand', restSeconds: 60, notes: '', sets: [{ id: randomUUID(), setType: 'working', plannedRepsMin: 8, plannedRepsMax: 12, plannedWeightKg: null, reps: null, weightKg: null, status: 'pending', completedAt: null }] }] })
}

test('decyzja: starszy trening i szkic v1 dostają „zostaw”, stara kolejka zachowuje brak pola', () => {
  const session = fixture()
  assert.equal(session.exercises[0].nextLoadDecision, 'maintain')
  const payload = workoutPayload(session)
  delete payload.exercises[0].nextLoadDecision
  delete session.exercises[0].nextLoadDecision
  const parsed = workoutJournalSchema.parse({ schemaVersion: 1, userId: session.userId, sessionId: session.id, start: null, session, serverRevision: 1, previous: [], conflict: false, queue: [{ operationId: randomUUID(), baseRevision: 1, payload }] })
  assert.equal(parsed.session.exercises[0].nextLoadDecision, 'maintain')
  assert.equal('nextLoadDecision' in parsed.queue[0].payload.exercises[0], false)
  for (const value of ['increase', '', null, 1]) assert.equal(nextLoadDecisionSchema.safeParse(value).success, false)
})

test('decyzja: wybór zachowuje serie i trafia do trwałego snapshotu kolejki', () => {
  const session = fixture()
  const sets = structuredClone(session.exercises[0].sets)
  const catalogId = session.exercises[0].exerciseId
  changeLoadDecision(session, session.id, session.exercises[0].id, 'reduce', catalogId)
  const journal = { schemaVersion: 1, userId: session.userId, sessionId: session.id, start: null, session, serverRevision: 1, previous: [], queue: [], conflict: false }
  const parsed = workoutJournalSchema.parse(JSON.parse(JSON.stringify(queueWorkout(journal, session, randomUUID()))))
  assert.equal(parsed.queue[0].payload.exercises[0].nextLoadDecision, 'reduce')
  assert.deepEqual(parsed.session.exercises[0].sets, sets)
  assert.equal(changeLoadDecision(session, session.id, session.exercises[0].id, 'reduce', catalogId), false)
  session.status = 'completed'
  session.finishedAt = '2026-11-20T11:00:00Z'
  changeLoadDecision(session, session.id, session.exercises[0].id, 'progress', catalogId)
  assert.equal(session.exercises[0].nextLoadDecision, 'progress')
  assert.deepEqual(session.exercises[0].sets, sets)
  assert.throws(() => changeLoadDecision(session, randomUUID(), session.exercises[0].id, 'reduce', catalogId))
  assert.throws(() => changeLoadDecision(session, session.id, randomUUID(), 'reduce', catalogId))
  assert.throws(() => changeLoadDecision(session, session.id, session.exercises[0].id, 'reduce', randomUUID()))
  session.status = 'abandoned'
  assert.throws(() => changeLoadDecision(session, session.id, session.exercises[0].id, 'reduce', catalogId))
})

test('decyzja: podmiana nie przenosi odczuć na inny wariant ćwiczenia', () => {
  const session = fixture()
  session.exercises[0].nextLoadDecision = 'progress'
  const replacement = { id: randomUUID(), name: 'Zamiennik', equipment: 'Maszyna', loadMode: 'external', weightConvention: 'total' }
  assert.equal(replaceWorkoutExercise(session, session.exercises[0].id, replacement, randomUUID).session.exercises[0].nextLoadDecision, 'maintain')
  session.exercises[0].sets.push({ ...session.exercises[0].sets[0], id: randomUUID() })
  Object.assign(session.exercises[0].sets[0], { status: 'completed', reps: 10, weightKg: 12, completedAt: '2026-11-20T10:05:00Z' })
  const result = replaceWorkoutExercise(session, session.exercises[0].id, replacement, randomUUID)
  assert.equal(result.session.exercises[0].nextLoadDecision, 'progress')
  assert.equal(result.session.exercises[1].nextLoadDecision, 'maintain')
})
