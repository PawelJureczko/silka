import { test } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import { fetchWorkoutDashboard } from '../../app/services/workouts.ts'
import { localContext, localPassword } from '../../scripts/local-supabase.mjs'

test('dashboard: kolejność ukończonych treningów, niezależnie od kalendarza i krótkiej historii', async (context) => {
  const config = localContext()
  const admin = createClient(config.url, config.serviceRoleKey, { auth: { persistSession: false } })
  const users = []
  const clients = []
  const plans = [randomUUID(), randomUUID()]
  const today = new Date().getUTCDay() || 7
  const plan = {
    name: 'Lokalny test kolejności', description: '',
    workouts: ['A', 'B', 'C'].map(name => ({
      name, weekday: name === 'B' ? today : null,
      exercises: [{ exerciseId: '10000000-0000-4000-8000-000000000011', restSeconds: 120, notes: '', sets: [{ setType: 'working', repsMin: 8, repsMax: 10, targetWeightKg: null }] }],
    })),
  }
  let sequence = 0
  const baseTime = Date.now() - 10000000
  async function session(client, planId, workoutId, status = 'completed') {
    const started = new Date(baseTime + sequence++ * 60000).toISOString()
    const id = randomUUID()
    const result = await client.from('workout_sessions').insert({
      id, plan_id: planId, source_workout_id: workoutId,
      plan_name_snapshot: 'Lokalny test', workout_name_snapshot: 'Jednostka testowa',
      status, started_at: started, finished_at: status === 'active' ? null : new Date(Date.parse(started) + 30000).toISOString(),
    })
    assert.equal(result.error, null)
    return id
  }
  try {
    const workouts = []
    for (let index = 0; index < 2; index++) {
      const email = `sequence-${randomUUID()}@silka.test`
      const user = await admin.auth.admin.createUser({ email, password: localPassword, email_confirm: true })
      assert.equal(user.error, null)
      users.push(user.data.user.id)
      const client = createClient(config.url, config.anonKey, { auth: { persistSession: false, autoRefreshToken: false } })
      clients.push(client)
      assert.equal((await client.auth.signInWithPassword({ email, password: localPassword })).error, null)
      assert.equal((await client.rpc('create_training_plan', { p_id: plans[index], p_operation_id: randomUUID(), p_plan: plan })).error, null)
      assert.equal((await client.rpc('activate_training_plan', { p_id: plans[index] })).error, null)
      const result = await client.from('plan_workouts').select('id').eq('plan_id', plans[index]).order('position')
      assert.equal(result.error, null)
      workouts.push(result.data.map(workout => workout.id))
    }
    const [a, b] = clients
    await context.test('nowy plan zaczyna od A, nawet gdy dzisiaj przypisano B', async () => {
      assert.equal((await fetchWorkoutDashboard(a, 'UTC')).next.id, workouts[0][0])
    })
    await context.test('po A wybiera B mimo 35 nowszych sesji spoza planu i porzuconej C', async () => {
      await session(a, plans[0], workouts[0][0])
      for (let i = 0; i < 35; i++) await session(a, null, null)
      await session(a, plans[0], workouts[0][2], 'abandoned')
      const dashboard = await fetchWorkoutDashboard(a, 'UTC')
      assert.equal(dashboard.next.id, workouts[0][1])
      assert.equal(dashboard.recent.length, 3)
      assert.equal(dashboard.recent[0].status, 'abandoned')
    })
    await context.test('kolejka jest prywatna i niezależna dla dwóch kont', async () => {
      await session(b, plans[1], workouts[1][1])
      assert.equal((await fetchWorkoutDashboard(b, 'UTC')).next.id, workouts[1][2])
      assert.equal((await fetchWorkoutDashboard(a, 'UTC')).next.id, workouts[0][1])
    })
    await context.test('ukończenie B wybiera C, a ukończenie C wraca do A', async () => {
      await session(a, plans[0], workouts[0][1])
      assert.equal((await fetchWorkoutDashboard(a, 'UTC')).next.id, workouts[0][2])
      await session(a, plans[0], workouts[0][2])
      assert.equal((await fetchWorkoutDashboard(a, 'UTC')).next.id, workouts[0][0])
    })
    const activeId = await session(a, plans[0], workouts[0][1], 'active')
    await context.test('rozpoczęty trening pozostaje dostępny do wznowienia', async () => {
      assert.equal((await fetchWorkoutDashboard(a, 'UTC')).activeId, activeId)
    })
    await context.test('po odtworzeniu jednostek przez edycję planu wybiera pierwszą aktualną', async () => {
      assert.equal((await a.rpc('save_training_plan', { p_id: plans[0], p_base_revision: 1, p_operation_id: randomUUID(), p_plan: plan })).error, null)
      const dashboard = await fetchWorkoutDashboard(a, 'UTC')
      assert.equal(dashboard.next.id, dashboard.workouts[0].id)
      assert.ok(!workouts[0].includes(dashboard.next.id))
      assert.equal(dashboard.activeId, activeId)
    })
    await context.test('brak aktywnego planu nie wybiera jednostki i zachowuje wznowienie sesji', async () => {
      assert.equal((await a.rpc('archive_training_plan', { p_id: plans[0], p_base_revision: 2, p_archived: true })).error, null)
      const dashboard = await fetchWorkoutDashboard(a, 'UTC')
      assert.equal(dashboard.plan, null)
      assert.equal(dashboard.next, null)
      assert.equal(dashboard.activeId, activeId)
    })
  }
  finally {
    await Promise.all(clients.map(client => client.auth.signOut({ scope: 'local' })))
    for (const id of users) assert.equal((await admin.auth.admin.deleteUser(id)).error, null)
  }
})
