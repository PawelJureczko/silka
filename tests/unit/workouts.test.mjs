import { test } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { reactive } from 'vue'
import { workoutSchema, workoutJournalSchema } from '../../shared/schemas/workouts.ts'
import { queueWorkout, acknowledgeWorkout, finishWorkout, restRemaining, workoutSummary } from '../../app/domain/workouts.ts'

const id = randomUUID()
const owner = randomUUID()
const session = { id, userId: owner, planId: null, sourceWorkoutId: null, planRevision: null, planName: 'Plan', workoutName: 'A', startedAt: '2026-10-11T10:00:00Z', finishedAt: null, restEndsAt: null, status: 'active', revision: 1, exercises: [{ id: randomUUID(), exerciseId: randomUUID(), name: 'Przysiad', equipment: 'Sztanga', loadMode: 'external', weightConvention: 'total', restSeconds: 120, notes: '', sets: [{ id: randomUUID(), setType: 'working', plannedRepsMin: 8, plannedRepsMax: 12, plannedWeightKg: 80, reps: null, weightKg: null, status: 'pending', completedAt: null }] }] }
const journal = { schemaVersion: 1, userId: owner, sessionId: id, session, start: null, serverRevision: 1, previous: [], queue: [], conflict: false }

test('kolejka kompresuje tylko niewysłane snapshoty i zachowuje ID próby po utracie odpowiedzi', () => {
  let value = queueWorkout(reactive(journal), session, randomUUID())
  value = queueWorkout(value, session, randomUUID())
  assert.equal(value.queue.length, 1)
  value.queue[0].baseRevision = 1
  const attemptedId = value.queue[0].operationId
  value = queueWorkout(value, session, randomUUID())
  assert.equal(value.queue.length, 2)
  assert.equal(value.queue[0].operationId, attemptedId)
  assert.equal(value.queue[0].baseRevision, 1)
  value = acknowledgeWorkout(value, attemptedId, 2)
  assert.equal(value.serverRevision, 2)
  assert.equal(value.queue.length, 1)
  assert.equal(value.queue[0].baseRevision, null)
  assert.throws(() => acknowledgeWorkout(value, attemptedId, 3), /Kolejność/)
  assert.equal(workoutJournalSchema.safeParse({ ...journal, userId: randomUUID() }).success, false)
})
test('zakończenie rozstrzyga pozostałe serie, a brak wykonania pozwala tylko na porzucenie', () => {
  assert.throws(() => finishWorkout(session, 'completed'), /przynajmniej/)
  assert.equal(finishWorkout(session, 'abandoned').exercises[0].sets[0].status, 'skipped')
  const performed = workoutSchema.parse(reactive(session))
  Object.assign(performed.exercises[0].sets[0], { reps: 10, weightKg: 0, status: 'completed', completedAt: '2026-10-11T10:02:00Z' })
  performed.exercises[0].sets.push({ ...session.exercises[0].sets[0], id: randomUUID() })
  const done = finishWorkout(performed, 'completed', Date.parse('2026-10-11T10:30:00Z'))
  assert.equal(done.exercises[0].sets[1].status, 'skipped')
  assert.deepEqual(workoutSummary(done), { completed: 1, skipped: 1, minutes: 30 })
  assert.equal(session.status, 'active')
  assert.equal(done.restEndsAt, null)
})
test('timer odtwarza czas z końca odpoczynku po odświeżeniu i powrocie z tła', () => {
  const end = '2026-10-11T10:02:00Z'
  assert.equal(restRemaining(end, Date.parse('2026-10-11T10:00:01Z')), 119)
  assert.equal(restRemaining(end, Date.parse('2026-10-11T10:03:00Z')), 0)
  assert.equal(restRemaining(null), 0)
})
