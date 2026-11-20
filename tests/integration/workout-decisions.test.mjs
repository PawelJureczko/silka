import { test } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import { localContext, localPassword } from '../../scripts/local-supabase.mjs'
import { fetchWorkout, fetchPreviousSets } from '../../app/services/workouts.ts'
import { workoutPayload } from '../../app/domain/workouts.ts'

test('decyzje: historia, dawne klienty, RLS i niezmienność wykonanych wyników', async (context) => {
  const config = localContext()
  const options = { auth: { persistSession: false, autoRefreshToken: false } }
  const admin = createClient(config.url, config.serviceRoleKey, options)
  const clients = [createClient(config.url, config.anonKey, options), createClient(config.url, config.anonKey, options)]
  const anon = createClient(config.url, config.anonKey, options)
  const users = []
  const planId = randomUUID(), sessionId = randomUUID()
  let revision = 1
  const exerciseIds = ['23e82d62-62ed-4f8d-8ef7-f28d130857d9', '20000000-0000-4000-8000-000000000040']
  try {
    for (const client of clients) {
      const email = `decision-${randomUUID()}@silka.test`
      const user = await admin.auth.admin.createUser({ email, password: localPassword, email_confirm: true })
      assert.equal(user.error, null)
      users.push(user.data.user.id)
      assert.equal((await client.auth.signInWithPassword({ email, password: localPassword })).error, null)
    }
    const [a, b] = clients
    const plan = { name: 'Lokalna decyzja', description: '', workouts: [{ name: 'A', weekday: null, exercises: exerciseIds.map(exerciseId => ({ exerciseId, restSeconds: 60, notes: '', sets: [{ setType: 'working', repsMin: 8, repsMax: 12, targetWeightKg: null }] })) }] }
    assert.equal((await a.rpc('create_training_plan', { p_id: planId, p_operation_id: randomUUID(), p_plan: plan })).error, null)
    const template = (await a.from('plan_workouts').select('id').eq('plan_id', planId).single()).data.id
    const start = id => a.rpc('start_workout', { p_id: id, p_workout_id: template, p_plan_revision: 1 })
    assert.equal((await start(sessionId)).error, null)
    const read = () => fetchWorkout(a, sessionId)
    const save = (payload, base = revision, operation = randomUUID(), client = a) => client.rpc('save_workout', { p_id: sessionId, p_base_revision: base, p_operation_id: operation, p_payload: payload })
    await context.test('nowe rekordy domyślnie zostają, odczyt i zapis są prywatne', async () => {
      const current = await read()
      assert.ok(current.exercises.every(e => e.nextLoadDecision === 'maintain'))
      assert.equal((await save(workoutPayload(current), revision, randomUUID(), b)).error?.code, '42501')
      assert.equal((await save(workoutPayload(current), revision, randomUUID(), anon)).error?.code, '42501')
      assert.deepEqual((await b.rpc('previous_workout_sets_v2', { p_session_id: sessionId })).data, [])
      assert.equal((await anon.rpc('previous_workout_sets_v2', { p_session_id: sessionId })).error?.code, '42501')
    })
    await context.test('aktywny zapis i stara kolejka bez pola zachowują decyzję', async () => {
      const payload = workoutPayload(await read())
      payload.exercises[0].nextLoadDecision = 'progress'
      assert.equal((await save(payload)).data, ++revision)
      payload.exercises.forEach(e => delete e.nextLoadDecision)
      assert.equal((await save(payload)).data, ++revision)
      assert.equal((await read()).exercises[0].nextLoadDecision, 'progress')
    })
    await context.test('nieznana wartość, null i obcy identyfikator wycofują także pierwszą zmianę', async () => {
      const before = await read()
      for (const bad of ['increase', null, 1]) {
        const payload = workoutPayload(before)
        payload.exercises[0].nextLoadDecision = 'reduce'
        payload.exercises[1].nextLoadDecision = bad
        assert.equal((await save(payload)).error?.code, '23514')
        assert.deepEqual(await read(), before)
      }
      const payload = workoutPayload(before)
      payload.exercises[0].id = randomUUID()
      payload.exercises[0].exerciseId = undefined
      assert.ok((await save(payload)).error)
      assert.deepEqual(await read(), before)
    })
    await context.test('zakończona sesja pozwala zmienić tylko decyzję, z rewizją i ponowieniem', async () => {
      const current = await read()
      current.exercises.forEach(e => Object.assign(e.sets[0], { status: 'completed', reps: 10, weightKg: 20, completedAt: new Date().toISOString() }))
      current.status = 'completed'
      current.finishedAt = new Date().toISOString()
      assert.equal((await save(workoutPayload(current))).data, ++revision)
      const before = await read()
      const payload = workoutPayload(before)
      payload.exercises[0].nextLoadDecision = 'reduce'
      const operation = randomUUID(), base = revision
      assert.equal((await save(payload, base, operation)).data, ++revision)
      assert.equal((await save(payload, base, operation)).data, revision)
      assert.equal((await save(payload, base)).error?.code, 'PT409')
      const after = await read()
      assert.equal(after.exercises[0].nextLoadDecision, 'reduce')
      assert.deepEqual(after.exercises.map(e => e.sets), before.exercises.map(e => e.sets))
      assert.equal(after.finishedAt, before.finishedAt)
      payload.exercises[0].nextLoadDecision = 'progress'
      assert.equal((await save(payload, revision, operation)).error?.code, '23514')
    })
    await context.test('feedback nie pozwala obejść zamknięcia sesji ani zmienić jej grafu', async () => {
      const before = await read()
      const edits = [
        p => p.exercises[1].sets[0].reps++,
        p => p.exercises[1].sets[0].weightKg++,
        p => p.exercises[1].sets[0].plannedRepsMin++,
        p => p.exercises[1].sets[0].completedAt = new Date().toISOString(),
        p => p.exercises[1].sets.push({ ...p.exercises[1].sets[0], id: randomUUID() }),
        p => p.exercises.pop(),
        p => p.exercises[1].exerciseId = exerciseIds[0],
        p => p.exercises[1].restSeconds++,
        p => p.finishedAt = new Date().toISOString(),
        (p) => {
          p.status = 'active'
          p.finishedAt = null
        },
      ]
      for (const edit of edits) {
        const payload = workoutPayload(before)
        payload.exercises[0].nextLoadDecision = 'progress'
        edit(payload)
        assert.ok((await save(payload)).error)
        assert.deepEqual(await read(), before)
      }
      const old = workoutPayload(before)
      old.exercises.forEach(e => delete e.nextLoadDecision)
      assert.equal((await save(old)).error?.code, 'PT409')
    })
    await context.test('kolejna sesja pokazuje ostatnią decyzję tylko swojego konta i wariantu', async () => {
      const nextId = randomUUID()
      assert.equal((await start(nextId)).error, null)
      const next = await fetchWorkout(a, nextId)
      assert.ok(next.exercises.every(e => e.nextLoadDecision === 'maintain'))
      const previous = await fetchPreviousSets(a, nextId)
      assert.equal(previous.find(e => e.workoutExerciseId === next.exercises[0].id).nextLoadDecision, 'reduce')
      assert.deepEqual((await b.rpc('previous_workout_sets_v2', { p_session_id: nextId })).data, [])
      const old = (await a.rpc('previous_workout_sets', { p_session_id: nextId })).data
      assert.equal('nextLoadDecision' in old[0], false)
      const changed = workoutPayload(next)
      changed.exercises[0].exerciseId = '10000000-0000-4000-8000-000000000011'
      assert.equal((await a.rpc('save_workout', { p_id: nextId, p_base_revision: 1, p_operation_id: randomUUID(), p_payload: changed })).error, null)
      assert.ok(!(await fetchPreviousSets(a, nextId)).some(e => e.workoutExerciseId === next.exercises[0].id))
      // Two occurrences in the latest matching session must not supply an arbitrary decision.
      const prior = (await a.from('workout_exercises').select('*').eq('session_id', sessionId).order('position')).data[1]
      assert.equal((await admin.from('workout_exercises').insert({ ...prior, id: randomUUID(), position: 2 })).error, null)
      assert.ok(!(await fetchPreviousSets(a, nextId)).some(e => e.workoutExerciseId === next.exercises[1].id))
    })
  }
  finally {
    for (const id of users) assert.equal((await admin.auth.admin.deleteUser(id)).error, null)
  }
})
