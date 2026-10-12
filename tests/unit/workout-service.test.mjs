import { test } from 'node:test'
import assert from 'node:assert/strict'
import { registerHooks } from 'node:module'

registerHooks({ resolve(specifier, context, nextResolve) {
  if (specifier === '#shared/schemas/workouts')
    return nextResolve(new URL('../../shared/schemas/workouts.ts', import.meta.url).href, context)
  return nextResolve(specifier, context)
} })
const { deleteWorkout, isWorkoutDeleted, startWorkout, saveWorkout, fetchWorkout, WorkoutConflict, WorkoutDeleted } = await import('../../app/services/workouts.ts')

function clientFor({ marker = { data: null, error: null }, rpc = { data: null, error: null }, session = { data: null, error: null } } = {}) {
  return {
    from(table) {
      const chain = { select: () => chain, eq: () => chain, abortSignal: () => chain, maybeSingle: async () => table === 'deleted_workout_sessions' ? marker : session }
      return chain
    },
    rpc() { return { abortSignal: async () => rpc } },
  }
}
test('sprawdzanie usunięcia toleruje starszy schemat, ale nie ukrywa błędów odczytu', async () => {
  assert.equal(await isWorkoutDeleted(clientFor(), 'session'), false)
  assert.equal(await isWorkoutDeleted(clientFor({ marker: { data: { session_id: 'session' }, error: null } }), 'session'), true)
  assert.equal(await isWorkoutDeleted(clientFor({ marker: { data: null, error: { code: 'PGRST205' } } }), 'session'), false)
  await assert.rejects(isWorkoutDeleted(clientFor({ marker: { data: null, error: { code: '42501' } } }), 'session'), /sprawdzić stanu/)
})
test('usuwanie rozróżnia potwierdzenie, konflikt, brak migracji i niepewną odpowiedź', async () => {
  await deleteWorkout(clientFor(), 'session', 1)
  await assert.rejects(deleteWorkout(clientFor({ rpc: { error: { code: 'PT409' } } }), 'session', 1), WorkoutConflict)
  await assert.rejects(deleteWorkout(clientFor({ rpc: { error: { code: 'PGRST202' } } }), 'session', 1), /jeszcze dostępne/)
  await assert.rejects(deleteWorkout(clientFor({ rpc: { error: { code: 'timeout' } } }), 'session', 1), /Nie potwierdzono usunięcia/)
})
test('spóźniony start, zapis i odczyt rozpoznają trwale usunięte UUID', async () => {
  await assert.rejects(startWorkout(clientFor({ rpc: { error: { code: 'PT410' } } }), 'session', 'workout', 1), error => error instanceof WorkoutDeleted && error.sessionId === 'session')
  const marker = { data: { session_id: 'session' }, error: null }
  await assert.rejects(saveWorkout(clientFor({ marker, rpc: { error: { code: '42501' } } }), 'session', 1, 'operation', {}), WorkoutDeleted)
  await assert.rejects(fetchWorkout(clientFor({ marker }), 'session'), WorkoutDeleted)
  await assert.rejects(saveWorkout(clientFor({ rpc: { error: { code: '42501' } } }), 'session', 1, 'operation', {}), /Brak dostępu/)
  await assert.rejects(fetchWorkout(clientFor({ marker, session: { error: { code: 'timeout' } } }), 'session'), /odczytać treningu/)
})
