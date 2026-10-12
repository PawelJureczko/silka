import { test } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import { ensureLocalUsers, localContext, localUsers, localPassword } from '../../scripts/local-supabase.mjs'

test('RPC planów: transakcje, izolacja, powtórzenia, rewizje i aktywne przypisanie', async (context) => {
  const config = localContext()
  const users = await ensureLocalUsers(config)
  const clients = localUsers.map(() => createClient(config.url, config.anonKey, { auth: { persistSession: false, autoRefreshToken: false } }))
  const admin = createClient(config.url, config.serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } })
  const anonymous = createClient(config.url, config.anonKey, { auth: { persistSession: false, autoRefreshToken: false } })
  const ids = [randomUUID(), randomUUID(), randomUUID()]
  const sharedId = randomUUID()
  const operation = randomUUID()
  const plan = { name: 'Test transakcji', description: '', workouts: [{ name: 'Dół A', weekday: 1, exercises: [{ exerciseId: '23e82d62-62ed-4f8d-8ef7-f28d130857d9', restSeconds: 120, notes: 'Fixture', sets: [{ setType: 'working', repsMin: 8, repsMax: 12, targetWeightKg: 82.5 }] }] }] }
  for (const [index, client] of clients.entries()) {
    assert.equal((await client.auth.signInWithPassword({ email: localUsers[index].email, password: localPassword })).error, null)
  }
  const [a, b] = clients
  const create = (client, id, payload = plan, op = randomUUID()) => client.rpc('create_training_plan', { p_id: id, p_operation_id: op, p_plan: payload })
  const save = (revision, payload, op = randomUUID()) => a.rpc('save_training_plan', { p_id: ids[0], p_base_revision: revision, p_operation_id: op, p_plan: payload })
  try {
    await context.test('tworzenie całego grafu i idempotentne ponowienie', async () => {
      const first = await create(a, ids[0], plan, operation)
      assert.equal(first.error, null)
      assert.equal(first.data[0].revision, 1)
      const retry = await create(a, ids[0], plan, operation)
      assert.deepEqual(retry.data, first.data)
      assert.equal((await create(a, ids[0], { ...plan, name: 'Zmieniony payload' }, operation)).error?.code, '23514')
      const graph = await a.from('plan_workouts').select('id,plan_exercises(id,plan_sets(target_weight_kg))').eq('plan_id', ids[0])
      assert.equal(graph.data.length, 1)
      assert.equal(graph.data[0].plan_exercises[0].plan_sets[0].target_weight_kg, 82.5)
    })
    await context.test('plany pozostają prywatne, a ćwiczenie dodane przez drugie konto jest wspólne', async () => {
      assert.equal((await create(anonymous, ids[2])).error?.code, '42501')
      assert.equal((await b.rpc('save_training_plan', { p_id: ids[0], p_base_revision: 1, p_operation_id: randomUUID(), p_plan: plan })).error?.code, 'PT409')
      assert.equal((await b.rpc('activate_training_plan', { p_id: ids[0] })).error?.code, '42501')
      assert.equal((await b.from('training_plans').select('id').eq('id', ids[0])).data.length, 0)
      assert.equal((await b.from('exercises').insert({ id: sharedId, name: 'Wspólne testowe', equipment: 'Sztanga', muscle_group: 'Nogi', load_mode: 'external' })).error, null)
      const exercise = await a.from('exercises').select('id,owner_id').eq('id', sharedId).single()
      assert.equal(exercise.error, null)
      assert.equal(exercise.data.owner_id, null)
      const sharedPlan = structuredClone(plan)
      sharedPlan.workouts[0].exercises[0].exerciseId = sharedId
      assert.equal((await create(a, ids[2], sharedPlan)).error, null)
      assert.equal((await b.from('training_plans').select('id').eq('id', ids[2])).data.length, 0)
      assert.equal((await a.from('training_plans').delete().eq('id', ids[2])).error, null)
      const invalid = structuredClone(plan)
      invalid.workouts[0].exercises[0].exerciseId = randomUUID()
      assert.equal((await save(1, invalid)).error?.code, '42501')
    })
    await context.test('błędna ostatnia seria wycofuje graf oraz rewizję', async () => {
      const before = await a.from('plan_workouts').select('id').eq('plan_id', ids[0])
      const invalid = structuredClone(plan)
      invalid.workouts[0].exercises[0].sets.push({ setType: 'working', repsMin: 20, repsMax: 10, targetWeightKg: 100 })
      assert.equal((await save(1, invalid)).error?.code, '23514')
      assert.deepEqual((await a.from('plan_workouts').select('id').eq('plan_id', ids[0])).data, before.data)
      assert.equal((await a.from('training_plans').select('revision').eq('id', ids[0]).single()).data.revision, 1)
      assert.equal((await create(a, ids[2], invalid)).error?.code, '23514')
      assert.equal((await a.from('training_plans').select('id').eq('id', ids[2])).data.length, 0)
    })
    await context.test('serwer odrzuca obce pola, tekstowe liczby, ułamkowe powtórzenia i nadmiar treningów', async () => {
      assert.equal((await save(1, { ...plan, userId: users[1] })).error?.code, '23514')
      assert.equal((await save(1, { ...plan, workouts: Array(8).fill(plan.workouts[0]) })).error?.code, '23514')
      for (const changes of [{ repsMin: '8' }, { repsMin: 8.5 }, { targetWeightKg: 1.234 }, { owner_id: users[1] }]) {
        const invalid = structuredClone(plan)
        Object.assign(invalid.workouts[0].exercises[0].sets[0], changes)
        assert.equal((await save(1, invalid)).error?.code, '23514')
      }
    })
    await context.test('udany zapis zwiększa rewizję raz i blokuje nieaktualne edycje', async () => {
      const op = randomUUID()
      const changed = { ...plan, name: 'Plan po zmianie' }
      const update = await save(1, changed, op)
      assert.equal(update.error, null)
      assert.equal(update.data[0].revision, 2)
      assert.deepEqual((await save(1, changed, op)).data, update.data)
      assert.equal((await save(1, plan)).error?.code, 'PT409')
      assert.equal((await create(a, ids[0])).error?.code, 'PT409')
    })
    await context.test('aktywacja jest atomowa; archiwizacja wyłącza przypisanie, a przywrócenie zachowuje plan', async () => {
      assert.equal((await create(a, ids[1])).error, null)
      assert.equal((await a.rpc('activate_training_plan', { p_id: ids[0] })).error, null)
      assert.equal((await a.rpc('activate_training_plan', { p_id: ids[1] })).error, null)
      const active = await a.from('plan_assignments').select('plan_id').eq('is_active', true)
      assert.deepEqual(active.data, [{ plan_id: ids[1] }])
      assert.equal((await a.rpc('archive_training_plan', { p_id: ids[1], p_base_revision: 1, p_archived: true })).error, null)
      assert.equal((await a.rpc('activate_training_plan', { p_id: ids[1] })).error?.code, '42501')
      assert.equal((await a.from('plan_assignments').select('plan_id').eq('plan_id', ids[1]).eq('is_active', true)).data.length, 0)
      assert.equal((await a.rpc('archive_training_plan', { p_id: ids[1], p_base_revision: 1, p_archived: false })).error?.code, 'PT409')
      assert.equal((await a.rpc('archive_training_plan', { p_id: ids[1], p_base_revision: 2, p_archived: false })).error, null)
    })
  }
  finally {
    await admin.from('training_plans').delete().in('id', ids)
    await admin.from('exercises').delete().eq('id', sharedId)
    await Promise.all(clients.map(client => client.auth.signOut({ scope: 'local' })))
  }
})
