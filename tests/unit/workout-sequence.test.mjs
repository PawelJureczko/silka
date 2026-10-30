import { test } from 'node:test'
import assert from 'node:assert/strict'
import { nextWorkoutInSequence } from '../../app/domain/workout-sequence.ts'

const workouts = [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }, { id: 'c', name: 'C' }]

test('kolejność treningów: A → B → C → A', () => {
  assert.equal(nextWorkoutInSequence(workouts, 'a'), workouts[1])
  assert.equal(nextWorkoutInSequence(workouts, 'b'), workouts[2])
  assert.equal(nextWorkoutInSequence(workouts, 'c'), workouts[0])
})

test('nowy lub zmieniony plan zaczyna od pierwszej jednostki', () => {
  assert.equal(nextWorkoutInSequence(workouts, null), workouts[0])
  assert.equal(nextWorkoutInSequence(workouts, 'removed-workout'), workouts[0])
})

test('kolejność wynika z planu, również po ręcznej zmianie kolejności', () => {
  const reordered = [workouts[2], workouts[0], workouts[1]]
  assert.equal(nextWorkoutInSequence(reordered, null), workouts[2])
  assert.equal(nextWorkoutInSequence(reordered, 'c'), workouts[0])
  assert.equal(nextWorkoutInSequence(reordered, 'b'), workouts[2])
})

test('plan z jedną jednostką powtarza ją, a pusty nie wybiera treningu', () => {
  assert.equal(nextWorkoutInSequence([workouts[0]], 'a'), workouts[0])
  assert.equal(nextWorkoutInSequence([], null), null)
})
