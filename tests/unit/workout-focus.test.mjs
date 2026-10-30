import { test } from 'node:test'
import assert from 'node:assert/strict'
import { nextWorkoutSet, previousRestSets, recordedSetLabel } from '../../app/domain/workout-focus.ts'

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

test('przerwa: porównuje właściwe ćwiczenie, pozycję i rodzaj kolejnej serii', () => {
  const exercise = { id: 'next-exercise', sets: [{ setType: 'warmup' }, { setType: 'working' }, { setType: 'working' }] }
  const history = [{ workoutExerciseId: 'next-exercise', startedAt: '2026-10-30T10:00:00Z', sets: [
    { position: 0, setType: 'warmup', reps: 15, weightKg: 8 },
    { position: 1, setType: 'working', reps: 12, weightKg: 16 },
    { position: 2, setType: 'working', reps: 10, weightKg: 18 },
  ] }]
  const result = previousRestSets(exercise, 2, history)
  assert.equal(result.exact, true)
  assert.deepEqual(result.sets, [history[0].sets[2]])
  assert.deepEqual(previousRestSets({ ...exercise, id: 'replacement' }, 2, history).sets, [])
  assert.deepEqual(previousRestSets(exercise, 0, [{ ...history[0], sets: history[0].sets.slice(1) }]).sets, [])
})

test('przerwa: nowa seria pokazuje tylko zgodne serie ostatniej sesji, bez udawania dopasowania', () => {
  const exercise = { id: 'next-exercise', sets: [{ setType: 'working' }, { setType: 'working' }, { setType: 'working' }] }
  const sets = [{ position: 0, setType: 'working', reps: 12, weightKg: 16 }, { position: 1, setType: 'working', reps: 10, weightKg: 18 }]
  assert.deepEqual(previousRestSets(exercise, 2, [{ workoutExerciseId: exercise.id, sets }]), { exact: false, sets })
  assert.deepEqual(previousRestSets(exercise, 0, []), { exact: false, sets: [] })
})

test('przerwa: wynik zachowuje przecinek, zero, brak ciężaru oraz konwencję obciążenia', () => {
  assert.equal(recordedSetLabel({ reps: 10, weightKg: 12.5 }, 'per_hand'), '10 powt. × 12,5 kg na rękę')
  assert.equal(recordedSetLabel({ reps: 8, weightKg: 0 }, 'total'), '8 powt. × 0 kg łącznie')
  assert.equal(recordedSetLabel({ reps: 8, weightKg: 30 }, 'assistance'), '8 powt. × 30 kg asysty')
  assert.equal(recordedSetLabel({ reps: 12, weightKg: null }, 'bodyweight'), '12 powt. · ciężar niezapisany')
  assert.equal(recordedSetLabel({ reps: 12, weightKg: 0 }, 'bodyweight'), '12 powt. · masa ciała')
  assert.equal(recordedSetLabel({ reps: 12, weightKg: 5 }, 'bodyweight'), '12 powt. · +5 kg')
})
