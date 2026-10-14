import { test } from 'node:test'
import assert from 'node:assert/strict'
import { nextWorkoutSet } from '../../app/domain/workout-focus.ts'

test('tryb serii: odtwarza pierwszą oczekującą, pomija wykonane i pozwala zmienić ćwiczenie', () => {
  const workout = { exercises: [
    { id: 'a', sets: [{ id: '1', status: 'completed' }, { id: '2', status: 'pending' }] },
    { id: 'b', sets: [{ id: '3', status: 'pending' }, { id: '4', status: 'skipped' }] },
  ] }
  assert.equal(nextWorkoutSet(workout).set.id, '2')
  assert.equal(nextWorkoutSet(workout, '3').exercise.id, 'b')
  assert.equal(nextWorkoutSet(workout, 'missing').set.id, '2')
  workout.exercises[1].sets[0].status = 'completed'
  assert.equal(nextWorkoutSet(workout, '3').set.id, '2')
  workout.exercises[0].sets[1].status = 'completed'
  assert.equal(nextWorkoutSet(workout, '2'), null)
})
