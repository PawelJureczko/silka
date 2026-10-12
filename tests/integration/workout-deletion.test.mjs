import { test } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import { localContext, localPassword } from '../../scripts/local-supabase.mjs'

test('trwałe usuwanie treningów', async (context) => {
  const config = localContext()
  const admin = createClient(config.url, config.serviceRoleKey, { auth: { persistSession: false } })
  const users = []
  try {
    const clients = []
    for (let i = 0; i < 2; i++) {
      const email = `delete-workout-${randomUUID()}@silka.test`
      const result = await admin.auth.admin.createUser({ email, password: localPassword, email_confirm: true })
      assert.equal(result.error, null)
      users.push(result.data.user.id)
      const client = createClient(config.url, config.anonKey, { auth: { persistSession: false, autoRefreshToken: false } })
      assert.equal((await client.auth.signInWithPassword({ email, password: localPassword })).error, null)
      clients.push(client)
    }
    const [a, b] = clients
    const anon = createClient(config.url, config.anonKey, { auth: { persistSession: false } })
    const planId = randomUUID()
    const plan = { name: 'Plan testowy usuwania', description: '', workouts: [{ name: 'A', weekday: null, exercises: [{ exerciseId: '23e82d62-62ed-4f8d-8ef7-f28d130857d9', restSeconds: 120, notes: '', sets: [{ setType: 'working', repsMin: 8, repsMax: 12, targetWeightKg: null }] }] }] }
    assert.equal((await a.rpc('create_training_plan', { p_id: planId, p_operation_id: randomUUID(), p_plan: plan })).error, null)
    const workoutId = (await a.from('plan_workouts').select('id').eq('plan_id', planId).single()).data.id
    const start = id => a.rpc('start_workout', { p_id: id, p_workout_id: workoutId, p_plan_revision: 1 })
    const remove = (id, revision = 1, client = a) => client.rpc('delete_workout', { p_id: id, p_base_revision: revision })
    const graph = id => a.from('workout_sessions').select('*,workout_exercises(*,workout_sets(*))').eq('id', id).single()
    const payload = (session, status = 'active') => ({ status, finishedAt: status === 'active' ? null : new Date().toISOString(), restEndsAt: null, exercises: session.workout_exercises.map(exercise => ({ id: exercise.id, sets: exercise.workout_sets.map(set => ({ id: set.id, reps: status === 'completed' ? 10 : null, weightKg: status === 'completed' ? 50 : null, status: status === 'completed' ? 'completed' : status === 'abandoned' ? 'skipped' : 'pending', completedAt: status === 'completed' ? new Date().toISOString() : null })) })) })
    const save = (id, revision, value) => a.rpc('save_workout', { p_id: id, p_base_revision: revision, p_operation_id: randomUUID(), p_payload: value })
    const empty = randomUUID()
    assert.equal((await start(empty)).error, null)
    await context.test('wymaga konta, własności i poprawnej rewizji; nie pozwala ominąć RPC', async () => {
      assert.equal((await remove(empty, 1, anon)).error?.code, '42501')
      assert.equal((await remove(empty, 1, b)).error?.code, '42501')
      assert.equal((await remove(empty, null)).error?.code, '23514')
      assert.equal((await remove(empty, 0)).error?.code, '23514')
      assert.equal((await remove(randomUUID())).error?.code, '42501')
      assert.equal((await a.from('workout_sessions').delete().eq('id', empty)).error?.code, '42501')
      assert.equal((await a.from('deleted_workout_sessions').insert({ session_id: empty, user_id: users[0] })).error?.code, '42501')
      assert.equal((await graph(empty)).error, null)
    })
    await context.test('pustą aktywną sesję usuwa razem z ćwiczeniami i seriami; nie zmienia planu', async () => {
      const original = (await graph(empty)).data
      const exerciseId = original.workout_exercises[0].id
      const setId = original.workout_exercises[0].workout_sets[0].id
      assert.equal((await remove(empty)).error, null)
      assert.deepEqual((await a.from('workout_sessions').select('id').eq('id', empty)).data, [])
      assert.deepEqual((await admin.from('workout_exercises').select('id').eq('id', exerciseId)).data, [])
      assert.deepEqual((await admin.from('workout_sets').select('id').eq('id', setId)).data, [])
      assert.equal((await a.from('training_plans').select('revision').eq('id', planId).single()).data.revision, 1)
      assert.equal((await a.from('plan_sets').select('id').eq('user_id', users[0])).data.length, 1)
    })
    await context.test('ponowienie jest idempotentne; znacznik jest prywatny i nieusuwalny', async () => {
      assert.equal((await remove(empty)).error, null)
      assert.equal((await remove(empty, 1, b)).error?.code, '42501')
      assert.equal((await a.from('deleted_workout_sessions').select('session_id')).data.length, 1)
      assert.deepEqual((await b.from('deleted_workout_sessions').select('session_id')).data, [])
      assert.equal((await anon.from('deleted_workout_sessions').select('session_id')).error?.code, '42501')
      assert.equal((await a.from('deleted_workout_sessions').delete().eq('session_id', empty)).error?.code, '42501')
      assert.equal((await a.from('deleted_workout_sessions').update({ session_id: randomUUID() }).eq('session_id', empty)).error?.code, '42501')
    })
    await context.test('opóźniony start i bezpośredni insert nie odtwarzają usuniętego UUID', async () => {
      assert.equal((await start(empty)).error?.code, 'PT410')
      assert.equal((await a.from('workout_sessions').insert({ id: empty, plan_name_snapshot: 'Test', workout_name_snapshot: 'A' })).error?.code, 'PT410')
    })
    const completed = randomUUID()
    await context.test('usunięcie zakończonej sesji aktualizuje statystyki i rekordy', async () => {
      assert.equal((await start(completed)).error, null)
      assert.equal((await save(completed, 1, payload((await graph(completed)).data, 'completed'))).data, 2)
      assert.equal((await a.rpc('progress_overview', { p_timezone: 'Europe/Warsaw' })).data.completedCount, 1)
      assert.equal((await remove(completed, 2)).error, null)
      const overview = await a.rpc('progress_overview', { p_timezone: 'Europe/Warsaw' })
      assert.equal(overview.error, null)
      assert.equal(overview.data.completedCount, 0)
      assert.deepEqual(overview.data.exercises, [])
      assert.equal((await a.rpc('weekly_workout_count', { p_timezone: 'Europe/Warsaw' })).data, 0)
    })
    await context.test('nieaktualna rewizja niczego nie usuwa, późny zapis nie odtwarza sesji', async () => {
      const id = randomUUID()
      assert.equal((await start(id)).error, null)
      const state = payload((await graph(id)).data)
      assert.equal((await save(id, 1, state)).data, 2)
      assert.equal((await remove(id, 1)).error?.code, 'PT409')
      assert.equal((await graph(id)).data.revision, 2)
      assert.deepEqual((await a.from('deleted_workout_sessions').select('session_id').eq('session_id', id)).data, [])
      assert.equal((await remove(id, 2)).error, null)
      assert.equal((await save(id, 2, state)).error?.code, '42501')
      assert.equal((await start(id)).error?.code, 'PT410')
    })
    await context.test('usuwa porzucone sesje i blokuje odtworzenie przez zmianę ID', async () => {
      const id = randomUUID()
      assert.equal((await start(id)).error, null)
      assert.equal((await a.from('workout_sessions').update({ id: empty }).eq('id', id)).error?.code, 'PT410')
      assert.equal((await save(id, 1, payload((await graph(id)).data, 'abandoned'))).data, 2)
      assert.equal((await remove(id, 2)).error, null)
    })
    await context.test('równoległy zapis i usunięcie są serializowane bez częściowego grafu', async () => {
      const id = randomUUID()
      assert.equal((await start(id)).error, null)
      const state = payload((await graph(id)).data)
      const [saved, deleted] = await Promise.all([save(id, 1, state), remove(id)])
      if (deleted.error) {
        assert.equal(deleted.error.code, 'PT409')
        assert.equal(saved.data, 2)
        assert.equal((await remove(id, 2)).error, null)
      }
      else assert.equal(saved.error?.code, '42501')
      assert.deepEqual((await a.from('workout_sessions').select('id').eq('id', id)).data, [])
      assert.equal((await start(id)).error?.code, 'PT410')
    })
  }
  finally {
    for (const id of users) assert.equal((await admin.auth.admin.deleteUser(id)).error, null)
  }
})
