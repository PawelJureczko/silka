import { test } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import { localContext, localPassword } from '../../scripts/local-supabase.mjs'

const globalId = '23e82d62-62ed-4f8d-8ef7-f28d130857d9'
const plan = { name: 'Fixture treningu', description: '', workouts: [{ name: 'Dół A', weekday: null, exercises: [{ exerciseId: globalId, restSeconds: 120, notes: '', sets: [1, 2].map(() => ({ setType: 'working', repsMin: 8, repsMax: 12, targetWeightKg: 80 })) }] }] }

test('trening: snapshot, RLS, kolejność, ponowienie, konflikt i zakończenie', async (context) => {
  const config = localContext()
  const admin = createClient(config.url, config.serviceRoleKey, { auth: { persistSession: false } })
  const users = []
  const clients = []
  const planId = randomUUID()
  const sessionId = randomUUID()
  try {
    for (let i = 0; i < 2; i++) {
      const email = `workout-${randomUUID()}@silka.test`
      const result = await admin.auth.admin.createUser({ email, password: localPassword, email_confirm: true })
      assert.equal(result.error, null)
      users.push(result.data.user.id)
      const client = createClient(config.url, config.anonKey, { auth: { persistSession: false, autoRefreshToken: false } })
      assert.equal((await client.auth.signInWithPassword({ email, password: localPassword })).error, null)
      clients.push(client)
    }
    const [a, b] = clients
    const anon = createClient(config.url, config.anonKey, { auth: { persistSession: false } })
    assert.equal((await a.rpc('create_training_plan', { p_id: planId, p_operation_id: randomUUID(), p_plan: plan })).error, null)
    const original = await a.from('plan_workouts').select('id').eq('plan_id', planId).single()
    const start = (client, id = sessionId, workoutId = original.data.id, revision = 1) => client.rpc('start_workout', { p_id: id, p_workout_id: workoutId, p_plan_revision: revision })
    const graph = () => a.from('workout_sessions').select('*,workout_exercises(*,workout_sets(*))').eq('id', sessionId).single()
    const payload = value => ({ status: 'active', finishedAt: null, restEndsAt: null, exercises: value.workout_exercises.map(exercise => ({ id: exercise.id, sets: exercise.workout_sets.sort((x, y) => x.position - y.position).map(set => ({ id: set.id, reps: set.reps, weightKg: set.weight_kg, status: set.status, completedAt: set.completed_at })) })) })
    const save = (revision, value, op = randomUUID(), client = a) => client.rpc('save_workout', { p_id: sessionId, p_base_revision: revision, p_operation_id: op, p_payload: value })
    await context.test('start jest atomowy, idempotentny, izolowany i dopuszcza jedną aktywną sesję', async () => {
      assert.equal((await start(anon)).error?.code, '42501')
      assert.equal((await start(b)).error?.code, '42501')
      assert.equal((await start(a)).error, null)
      assert.equal((await start(a)).data, sessionId)
      assert.equal((await start(a, sessionId, original.data.id, 2)).error?.code, '23514')
      assert.equal((await start(a, randomUUID())).error?.code, 'PT409')
      const saved = (await graph()).data
      assert.equal(saved.workout_exercises.length, 1)
      assert.equal(saved.workout_exercises[0].workout_sets.length, 2)
      assert.equal((await b.from('workout_sessions').select('id').eq('id', sessionId)).data.length, 0)
      assert.equal((await save(1, payload(saved), randomUUID(), b)).error?.code, '42501')
    })
    await context.test('edycja i archiwizacja planu nie zmieniają snapshotu rozpoczętego treningu', async () => {
      const changed = structuredClone(plan)
      changed.name = 'Nowy plan'
      changed.workouts[0].exercises[0].sets[0].targetWeightKg = 90
      assert.equal((await a.rpc('save_training_plan', { p_id: planId, p_base_revision: 1, p_operation_id: randomUUID(), p_plan: changed })).error, null)
      assert.equal((await a.rpc('archive_training_plan', { p_id: planId, p_base_revision: 2, p_archived: true })).error, null)
      const saved = (await graph()).data
      assert.equal(saved.plan_name_snapshot, plan.name)
      assert.equal(saved.plan_revision_snapshot, 1)
      assert.equal(saved.workout_exercises[0].workout_sets[0].planned_weight_kg, 80)
    })
    await context.test('walidacja, brakujące serie i późny błąd nie zmieniają grafu ani rewizji', async () => {
      const originalPayload = payload((await graph()).data)
      for (const changes of [{ reps: '8' }, { reps: 8.5 }, { weightKg: 1.234 }, { status: 'completed', reps: 10, completedAt: new Date().toISOString(), weightKg: null }, { userId: users[1] }]) {
        const invalid = structuredClone(originalPayload)
        Object.assign(invalid.exercises[0].sets[1], changes)
        assert.equal((await save(1, invalid)).error?.code, '23514')
      }
      const missing = structuredClone(originalPayload)
      missing.exercises[0].sets.pop()
      assert.equal((await save(1, missing)).error?.code, '23514')
      const foreign = structuredClone(originalPayload)
      foreign.exercises[0].id = randomUUID()
      assert.equal((await save(1, foreign)).error?.code, '42501')
      assert.equal((await graph()).data.revision, 1)
      assert.deepEqual(payload((await graph()).data), originalPayload)
    })
    let state
    await context.test('dopisana seria, timer i utracona odpowiedź nie tworzą duplikatów', async () => {
      state = payload((await graph()).data)
      Object.assign(state.exercises[0].sets[0], { reps: 10, weightKg: 82.5, status: 'completed', completedAt: new Date().toISOString() })
      state.exercises[0].sets.push({ id: randomUUID(), reps: null, weightKg: null, status: 'pending', completedAt: null })
      state.restEndsAt = new Date(Date.now() + 120000).toISOString()
      const op = randomUUID()
      assert.equal((await save(1, state, op)).data, 2)
      assert.equal((await save(1, state, op)).data, 2)
      assert.equal((await graph()).data.workout_exercises[0].workout_sets.length, 3)
      assert.equal((await save(1, state)).error?.code, 'PT409')
      assert.equal((await save(2, { ...state, restEndsAt: null }, op)).error?.code, '23514')
    })
    await context.test('zakończenie wymaga rozstrzygniętych serii i nie pozwala na późniejsze nadpisanie', async () => {
      state.status = 'completed'
      state.finishedAt = new Date().toISOString()
      state.restEndsAt = null
      assert.equal((await save(2, state)).error?.code, '23514')
      for (const set of state.exercises[0].sets) if (set.status === 'pending') set.status = 'skipped'
      const op = randomUUID()
      assert.equal((await save(2, state, op)).data, 3)
      assert.equal((await save(2, state, op)).data, 3)
      assert.equal((await save(3, state)).error?.code, 'PT409')
      assert.equal((await a.rpc('weekly_workout_count', { p_timezone: 'Europe/Warsaw' })).data, 1)
      assert.equal((await b.rpc('weekly_workout_count', { p_timezone: 'Europe/Warsaw' })).data, 0)
    })
    await context.test('kolejna sesja dostaje wyłącznie zgodne poprzednie wykonane wyniki', async () => {
      assert.equal((await a.rpc('archive_training_plan', { p_id: planId, p_base_revision: 3, p_archived: false })).error, null)
      const workout = (await a.from('plan_workouts').select('id').eq('plan_id', planId).single()).data
      const id = randomUUID()
      assert.equal((await start(a, id, workout.id, 4)).error, null)
      const previous = await a.rpc('previous_workout_sets', { p_session_id: id })
      assert.equal(previous.error, null)
      assert.equal(previous.data.length, 1)
      assert.equal(previous.data[0].sets.length, 1)
      assert.equal(previous.data[0].sets[0].weightKg, 82.5)
      assert.deepEqual((await b.rpc('previous_workout_sets', { p_session_id: id })).data, [])
    })
  }
  finally {
    for (const id of users) assert.equal((await admin.auth.admin.deleteUser(id)).error, null)
  }
})
