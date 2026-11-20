import { test } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import { localContext, localPassword } from '../../scripts/local-supabase.mjs'
import { exerciseInsightsSchema, periodStatsSchema } from '../../shared/schemas/training-stats.ts'
import { fetchComparisonOptions, fetchSessionComparison } from '../../app/services/training-stats.ts'

test('nowe statystyki: pełne rekordy, serie, kalendarz, DST, limity i izolacja kont', async (context) => {
  const config = localContext()
  const options = { auth: { persistSession: false, autoRefreshToken: false } }
  const admin = createClient(config.url, config.serviceRoleKey, options)
  const anon = createClient(config.url, config.anonKey, options)
  const clients = [], users = []
  const catalogId = '23e82d62-62ed-4f8d-8ef7-f28d130857d9'
  const source = randomUUID()
  try {
    for (let i = 0; i < 2; i++) {
      const email = `stats-${randomUUID()}@silka.test`
      const result = await admin.auth.admin.createUser({ email, password: localPassword, email_confirm: true })
      assert.equal(result.error, null)
      users.push(result.data.user.id)
      const client = createClient(config.url, config.anonKey, options)
      assert.equal((await client.auth.signInWithPassword({ email, password: localPassword })).error, null)
      clients.push(client)
    }
    const [a, b] = clients
    async function fixture({ client = a, started = '2025-03-30T22:30:00Z', status = 'completed', weight = 20, reps = 10, decision = 'maintain', convention = 'total', mode = 'external', sets, duplicate = false, empty = false } = {}) {
      const id = randomUUID(), exerciseId = randomUUID()
      const finish = new Date(Date.parse(started) + 3600000).toISOString()
      assert.equal((await client.from('workout_sessions').insert({ id, source_workout_id: source, plan_name_snapshot: 'Plan testowy', workout_name_snapshot: 'B test', status, started_at: started, finished_at: status === 'active' ? null : finish })).error, null)
      if (empty) return id
      const exercise = { id: exerciseId, session_id: id, exercise_id: catalogId, exercise_name_snapshot: 'Ćwiczenie testowe', equipment_snapshot: 'Sztanga', load_mode_snapshot: mode, weight_convention_snapshot: convention, position: 0, next_load_decision: decision }
      assert.equal((await client.from('workout_exercises').insert(duplicate ? [exercise, { ...exercise, id: randomUUID(), position: 1, next_load_decision: 'reduce' }] : exercise)).error, null)
      const base = { workout_exercise_id: exerciseId, position: 0, set_type: 'working', status: 'completed', reps, weight_kg: weight, completed_at: finish, planned_reps_min: 8, planned_reps_max: 12 }
      assert.equal((await client.from('workout_sets').insert(sets ? sets.map((patch, position) => ({ ...base, ...patch, position })) : base)).error, null)
      return id
    }
    const args = { p_exercise_id: catalogId, p_equipment: 'Sztanga', p_load_mode: 'external', p_weight_convention: 'total', p_page: 0 }
    const period = { p_month: '2025-03-01', p_week: '2025-03-31', p_timezone: 'Europe/Warsaw' }
    const old = await fixture({ started: '2024-01-01T12:00:00Z', weight: 20, reps: 15 })
    for (let weight = 1; weight <= 22; weight++) await fixture({ started: '2025-02-01T12:00:00Z', weight, reps: 8 })
    const latest = await fixture({ decision: 'progress', sets: [{ reps: 10 }, { reps: 7 }, { reps: 13 }, { reps: null, status: 'skipped', completed_at: null }, { planned_reps_min: null, planned_reps_max: null }, { set_type: 'warmup', reps: 100, weight_kg: 999 }] })
    await fixture({ status: 'abandoned', weight: 999, reps: 99 })
    await fixture({ status: 'active', weight: 999, reps: 98 })
    await fixture({ started: '2025-03-28T12:00:00Z', convention: 'per_hand', reps: 88 })
    await fixture({ started: '2025-03-28T12:00:00Z', mode: 'bodyweight', convention: 'bodyweight', weight: null, reps: 11 })
    await fixture({ started: '2025-03-29T12:00:00Z', mode: 'bodyweight', convention: 'bodyweight', weight: 0, reps: 12 })
    await context.test('rekord stałego ciężaru jest z całej historii i ma stabilną paginację', async () => {
      const response = await a.rpc('exercise_insights', args)
      assert.equal(response.error, null)
      const first = exerciseInsightsSchema.parse(response.data)
      assert.equal(first.records.length, 21)
      assert.equal(first.records.find(item => item.weightKg === 20).sessionId, old)
      assert.equal(first.records.find(item => item.weightKg === 20).reps, 15)
      assert.ok(!first.records.some(item => item.reps === 88 || item.weightKg === 999))
      const next = exerciseInsightsSchema.parse((await a.rpc('exercise_insights', { ...args, p_page: 1 })).data)
      assert.deepEqual(next.records.map(item => item.weightKg), [21, 22])
      const body = exerciseInsightsSchema.parse((await a.rpc('exercise_insights', { ...args, p_load_mode: 'bodyweight', p_weight_convention: 'bodyweight' })).data)
      assert.deepEqual(body.records.map(item => item.weightKg), [0, null])
      assert.equal(body.records.find(item => item.weightKg === null).reps, 11)
      assert.equal((await a.rpc('exercise_insights', { ...args, p_page: -1 })).error?.code, '23514')
    })
    await context.test('decyzje opisują własną sesję, duplikat nie wybiera arbitralnie', async () => {
      const result = exerciseInsightsSchema.parse((await a.rpc('exercise_insights', args)).data)
      assert.equal(result.decisions[0].sessionId, latest)
      assert.equal(result.decisions[0].decision, 'progress')
      assert.equal(result.decisions[0].sets.length, 4)
      await fixture({ started: '2025-04-02T12:00:00Z', duplicate: true })
      const duplicate = exerciseInsightsSchema.parse((await a.rpc('exercise_insights', args)).data)
      assert.equal(duplicate.decisions[0].decision, null)
    })
    await context.test('miesiąc i tydzień używają strefy, liczą zakresy i pomijają rozgrzewki', async () => {
      const response = await a.rpc('training_period_stats', period)
      assert.equal(response.error, null)
      const result = periodStatsSchema.parse(response.data)
      assert.equal(result.summary.sessions, 4)
      assert.equal(result.summary.previousSessions, 22)
      assert.equal(result.summary.minutes, 240)
      assert.equal(result.summary.sets, 7)
      assert.equal(result.summary.planned, 7)
      assert.equal(result.summary.completedPlanned, 6)
      assert.equal(result.summary.inRange, 3)
      assert.equal(result.summary.below, 1)
      assert.equal(result.summary.above, 2)
      assert.equal(result.calendar.find(item => item.id === latest).day, '2025-03-31')
      assert.equal(result.muscles.reduce((sum, item) => sum + item.sets, 0), 5)
      const utc = periodStatsSchema.parse((await a.rpc('training_period_stats', { ...period, p_timezone: 'UTC' })).data)
      assert.equal(utc.calendar.find(item => item.id === latest).day, '2025-03-30')
      assert.equal(utc.muscles.reduce((sum, item) => sum + item.sets, 0), 1)
      for (const patch of [{ p_timezone: 'Nie/Ma' }, { p_month: '2025-03-02' }, { p_week: '2025-03-30' }, { p_month: null }]) assert.equal((await a.rpc('training_period_stats', { ...period, ...patch })).error?.code, '23514')
    })
    await context.test('puste sesje są porównywane; limit kalendarza nie obcina podsumowania', async () => {
      await fixture({ started: '2025-05-01T12:00:00Z', empty: true })
      const options = await fetchComparisonOptions(a)
      assert.equal(options.length, 1)
      const pair = await fetchSessionComparison(a, source, null)
      assert.equal(pair.length, 2)
      assert.equal(pair[0].workout_exercises.length, 0)
      const inserts = Array.from({ length: 202 }, () => ({ source_workout_id: source, plan_name_snapshot: 'Limit test', workout_name_snapshot: 'A test', status: 'completed', started_at: '2025-06-01T12:00:00Z', finished_at: '2025-06-01T13:00:00Z' }))
      assert.equal((await a.from('workout_sessions').insert(inserts)).error, null)
      const limit = periodStatsSchema.parse((await a.rpc('training_period_stats', { ...period, p_month: '2025-06-01' })).data)
      assert.equal(limit.summary.sessions, 202)
      assert.equal(limit.calendar.length, 201)
    })
    await context.test('drugie konto i anonim nie odczytają cudzych nowych statystyk', async () => {
      assert.equal((await anon.rpc('exercise_insights', args)).error?.code, '42501')
      assert.equal((await anon.rpc('training_period_stats', period)).error?.code, '42501')
      assert.deepEqual(exerciseInsightsSchema.parse((await b.rpc('exercise_insights', args)).data), { records: [], decisions: [] })
      assert.equal(periodStatsSchema.parse((await b.rpc('training_period_stats', period)).data).summary.sessions, 0)
      assert.deepEqual(await fetchSessionComparison(b, source, null), [])
      assert.deepEqual(await fetchComparisonOptions(b), [])
      await fixture({ client: b, weight: 25, reps: 9 })
      assert.equal(exerciseInsightsSchema.parse((await b.rpc('exercise_insights', args)).data).records[0].reps, 9)
      assert.equal((await fetchSessionComparison(b, source, null)).length, 1)
      assert.equal((await a.from('workout_sessions').select('id').eq('user_id', users[1])).data.length, 0)
    })
  }
  finally { for (const id of users) assert.equal((await admin.auth.admin.deleteUser(id)).error, null) }
})
