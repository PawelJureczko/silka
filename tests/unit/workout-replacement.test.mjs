import { test } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { replaceWorkoutExercise } from '../../app/domain/workout-replacement.ts'
import { workoutPayload, queueWorkout } from '../../app/domain/workouts.ts'
import { workoutJournalSchema } from '../../shared/schemas/workouts.ts'

const replacement = { id: randomUUID(), name: 'Wyciskanie hantli nad głowę', equipment: 'Hantle', loadMode: 'external', weightConvention: 'per_hand' }
const makeSession = () => ({ id: randomUUID(), userId: randomUUID(), planId: null, sourceWorkoutId: null, planRevision: null, planName: 'Test', workoutName: 'A', startedAt: new Date().toISOString(), finishedAt: null, restEndsAt: null, status: 'active', revision: 1, exercises: [{ id: randomUUID(), exerciseId: randomUUID(), name: 'Stare ćwiczenie', equipment: 'Sztanga', loadMode: 'external', weightConvention: 'total', restSeconds: 60, notes: 'Wskazówki do starego ćwiczenia', sets: [1, 2, 3].map(() => ({ id: randomUUID(), setType: 'working', plannedRepsMin: 8, plannedRepsMax: 12, plannedWeightKg: 40, reps: 10, weightKg: 40, status: 'pending', completedAt: null })) }] })

test('podmiana przed pierwszą serią zachowuje ID, zakres i przerwę, zeruje ciężary i notatki', () => {
  const original = makeSession()
  const next = replaceWorkoutExercise(original, original.exercises[0].id, replacement, randomUUID)
  const exercise = next.session.exercises[0]
  assert.equal(exercise.id, original.exercises[0].id)
  assert.equal(exercise.exerciseId, replacement.id)
  assert.equal(next.selectedSetId, original.exercises[0].sets[0].id)
  assert.equal(exercise.restSeconds, 60)
  assert.equal(exercise.weightConvention, 'per_hand')
  assert.equal(exercise.notes, '')
  assert.ok(exercise.sets.every(set => set.reps === null && set.weightKg === null && set.plannedWeightKg === null && set.plannedRepsMin === 8))
  assert.equal(original.exercises[0].name, 'Stare ćwiczenie')
})

test('podmiana po wykonaniu zachowuje wyniki i tworzy tylko oczekujące serie zamiennika', () => {
  const original = makeSession()
  const performed = original.exercises[0].sets[0]
  Object.assign(performed, { status: 'completed', completedAt: new Date().toISOString() })
  const next = replaceWorkoutExercise(original, original.exercises[0].id, replacement, randomUUID)
  assert.equal(next.session.exercises.length, 2)
  assert.deepEqual(next.session.exercises[0].sets[0], performed)
  assert.ok(next.session.exercises[0].sets.slice(1).every(set => set.status === 'skipped'))
  assert.equal(next.session.exercises[1].sets.length, 2)
  assert.ok(next.session.exercises[1].sets.every(set => !original.exercises[0].sets.some(old => old.id === set.id)))
  assert.equal(next.selectedSetId, next.session.exercises[1].sets[0].id)
})

test('podmiana odrzuca zakończoną sesję, brak serii, to samo ćwiczenie i przekroczenie limitu', () => {
  const original = makeSession()
  const id = original.exercises[0].id
  assert.throws(() => replaceWorkoutExercise({ ...original, status: 'completed' }, id, replacement, randomUUID), /dostępne/)
  assert.throws(() => replaceWorkoutExercise(original, id, { ...replacement, id: original.exercises[0].exerciseId }, randomUUID), /inne ćwiczenie/)
  original.exercises[0].sets.forEach(set => Object.assign(set, { status: 'skipped' }))
  assert.throws(() => replaceWorkoutExercise(original, id, replacement, randomUUID), /oczekujących/)
  original.exercises[0].sets[0].status = 'pending'
  original.exercises = Array.from({ length: 20 }, (_, i) => ({ ...original.exercises[0], id: i ? randomUUID() : id }))
  assert.throws(() => replaceWorkoutExercise(original, id, replacement, randomUUID), /20 ćwiczeń/)
})

test('kolejka utrwala podmianę wraz z wynikami i zachowuje odczyt starszego szkicu v1', () => {
  const original = makeSession()
  const journal = { schemaVersion: 1, userId: original.userId, sessionId: original.id, session: original, start: null, serverRevision: 1, previous: [], queue: [], conflict: false }
  const next = replaceWorkoutExercise(original, original.exercises[0].id, replacement, randomUUID)
  const queued = queueWorkout(journal, next.session, randomUUID)
  assert.equal(queued.queue[0].payload.exercises[0].exerciseId, replacement.id)
  assert.equal(queued.queue[0].payload.exercises[0].sets[0].plannedWeightKg, null)
  const legacy = workoutPayload(original)
  legacy.exercises.forEach((exercise) => {
    delete exercise.exerciseId
    delete exercise.restSeconds
    exercise.sets.forEach((set) => {
      delete set.setType
      delete set.plannedRepsMin
      delete set.plannedRepsMax
      delete set.plannedWeightKg
    })
  })
  assert.equal(workoutJournalSchema.safeParse({ ...journal, queue: [{ operationId: randomUUID(), baseRevision: 1, payload: legacy }] }).success, true)
})
