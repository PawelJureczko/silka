import { test } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import { localContext, localPassword } from '../../scripts/local-supabase.mjs'
import { progressOverviewSchema, exerciseProgressSchema } from '../../shared/schemas/progress.ts'

const globalId = '23e82d62-62ed-4f8d-8ef7-f28d130857d9'
test('postępy: pełne rekordy, ograniczone wykresy, RLS, strefy i profil', async (context) => {
  const config = localContext()
  const admin = createClient(config.url, config.serviceRoleKey, { auth: { persistSession: false } })
  const users = []
  const clients = []
  try {
    for (let i = 0; i < 2; i++) {
      const email = `progress-${randomUUID()}@silka.test`
      const result = await admin.auth.admin.createUser({ email, password: localPassword, email_confirm: true })
      assert.equal(result.error, null)
      users.push(result.data.user.id)
      const client = createClient(config.url, config.anonKey, { auth: { persistSession: false, autoRefreshToken: false } })
      assert.equal((await client.auth.signInWithPassword({ email, password: localPassword })).error, null)
      clients.push(client)
    }
    const [a, b] = clients
    const anon = createClient(config.url, config.anonKey, { auth: { persistSession: false } })
    const overview = (client, timezone = 'UTC') => client.rpc('progress_overview', { p_timezone: timezone })
    const args = { p_exercise_id: globalId, p_equipment: 'Sztanga', p_load_mode: 'external', p_weight_convention: 'total' }
    async function fixture({ days = 1, time, status = 'completed', equipment = 'Sztanga', mode = 'external', convention = 'total', weight = 80, reps = 12, setType = 'working', seriesStatus = 'completed', extra = false } = {}) {
      const id = randomUUID()
      const exerciseId = randomUUID()
      const started = time ?? new Date(Date.now() - days * 86400000).toISOString()
      const finished = new Date(Date.parse(started) + 3600000).toISOString()
      const result = await a.from('workout_sessions').insert({ id, status, started_at: started, finished_at: status === 'active' ? null : finished, plan_name_snapshot: 'Postępy fixture', workout_name_snapshot: 'A' })
      assert.equal(result.error, null)
      assert.equal((await a.from('workout_exercises').insert({ id: exerciseId, session_id: id, exercise_id: globalId, exercise_name_snapshot: 'Test', equipment_snapshot: equipment, load_mode_snapshot: mode, weight_convention_snapshot: convention, position: 0, rest_seconds: 60 })).error, null)
      const set = { workout_exercise_id: exerciseId, position: 0, set_type: setType, planned_reps_min: 8, planned_reps_max: 12, reps, weight_kg: weight, status: seriesStatus, completed_at: seriesStatus === 'completed' ? finished : null }
      assert.equal((await a.from('workout_sets').insert(extra ? [set, { ...set, position: 1, set_type: 'warmup', weight_kg: 999, reps: 100 }] : set)).error, null)
      return id
    }
    const oldest = await fixture({ days: 100, weight: 120, extra: true })
    for (let days = 35; days >= 1; days--) await fixture({ days, weight: 80 + (35 - days) / 2 })
    await fixture({ days: 0.5, status: 'abandoned', weight: 200 })
    await fixture({ days: 0.4, status: 'active', weight: 250 })
    await fixture({ days: 0.3, convention: 'per_hand', weight: 500 })
    await fixture({ days: 0.2, equipment: 'Inny sprzęt', weight: 700 })
    await fixture({ days: 0.1, weight: null, reps: null, seriesStatus: 'skipped' })
    await fixture({ days: 2, mode: 'bodyweight', convention: 'bodyweight', weight: null, reps: 20 })
    await fixture({ days: 1, mode: 'bodyweight', convention: 'bodyweight', weight: 0, reps: 30 })
    await fixture({ days: 2, mode: 'assisted', convention: 'assistance', weight: 50 })
    await fixture({ days: 1, mode: 'assisted', convention: 'assistance', weight: 40 })
    await context.test('rekord uwzględnia całą historię, wykres 30 sesji i tylko zgodne wykonane serie robocze', async () => {
      const response = await a.rpc('exercise_progress', args)
      assert.equal(response.error, null)
      const result = exerciseProgressSchema.parse(response.data)
      assert.equal(result.record.sessionId, oldest)
      assert.equal(result.record.weightKg, 120)
      assert.equal(result.record.reps, 12)
      assert.equal(result.points.length, 30)
      assert.equal(result.points.at(-1).weightKg, 97)
      assert.equal(result.points.at(-1).volumeKg, 1164)
      assert.equal(result.latest.sets[0].status, 'skipped')
      assert.ok(result.points.every((point, index, list) => index === 0 || point.startedAt >= list[index - 1].startedAt))
    })
    await context.test('masa ciała zachowuje brak kilogramów, a mniejsza asysta jest rekordem', async () => {
      const body = exerciseProgressSchema.parse((await a.rpc('exercise_progress', { ...args, p_load_mode: 'bodyweight', p_weight_convention: 'bodyweight' })).data)
      assert.equal(body.record.reps, 30)
      assert.equal(body.record.weightKg, 0)
      assert.equal(body.points[0].weightKg, null)
      assert.equal(body.points[0].volumeKg, null)
      const assisted = exerciseProgressSchema.parse((await a.rpc('exercise_progress', { ...args, p_load_mode: 'assisted', p_weight_convention: 'assistance' })).data)
      assert.equal(assisted.record.weightKg, 40)
      assert.equal(assisted.points[0].volumeKg, null)
    })
    await context.test('powtórzony wariant w ostatniej sesji blokuje niejednoznaczną sugestię', async () => {
      const id = await fixture({ days: 0.01 })
      assert.equal((await a.from('workout_exercises').insert({ session_id: id, exercise_id: globalId, exercise_name_snapshot: 'Test ponownie', equipment_snapshot: 'Sztanga', load_mode_snapshot: 'external', weight_convention_snapshot: 'total', position: 1, rest_seconds: 60 })).error, null)
      const result = exerciseProgressSchema.parse((await a.rpc('exercise_progress', args)).data)
      assert.equal(result.latest.sessionId, id)
      assert.equal(result.latest.sets, null)
      assert.equal(result.record.sessionId, oldest)
    })
    await context.test('drugie konto i anonim nie odczytają cudzej historii ani statystyk', async () => {
      assert.equal((await overview(anon)).error?.code, '42501')
      assert.equal((await anon.rpc('exercise_progress', args)).error?.code, '42501')
      const empty = progressOverviewSchema.parse((await overview(b)).data)
      assert.equal(empty.completedCount, 0)
      assert.equal(empty.exercises.length, 0)
      assert.ok(empty.weeks.every(week => week.count === 0))
      const result = exerciseProgressSchema.parse((await b.rpc('exercise_progress', args)).data)
      assert.equal(result.record, null)
      assert.equal(result.latest, null)
      assert.deepEqual(result.points, [])
      assert.equal((await b.from('workout_sessions').select('id').eq('user_id', users[0])).data.length, 0)
    })
    await context.test('regularność grupuje tygodnie według strefy; aktywne i porzucone nie liczą się', async () => {
      const before = progressOverviewSchema.parse((await overview(a)).data)
      const monday = new Date()
      monday.setUTCHours(0, 0, 0, 0)
      monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7))
      await fixture({ time: new Date(monday.getTime() - 1800000).toISOString() })
      const utc = progressOverviewSchema.parse((await overview(a)).data)
      const warsaw = progressOverviewSchema.parse((await overview(a, 'Europe/Warsaw')).data)
      assert.equal(utc.completedCount, before.completedCount + 1)
      assert.equal(utc.weeks.at(-1).count, before.weeks.at(-1).count)
      assert.equal(warsaw.weeks.at(-1).count, utc.weeks.at(-1).count + 1)
      assert.equal(utc.weeks.length, 12)
      assert.ok(utc.exercises.some(item => item.weightConvention === 'per_hand'))
    })
    await context.test('profil zapisuje tylko bieżące konto, zachowuje inne ustawienia i wycofuje błędne dane', async () => {
      assert.equal((await a.from('profiles').update({ preferences: { extra: 'keep' } }).eq('user_id', users[0])).error, null)
      const input = { p_display_name: ' Lokalnie ', p_training_goal: 'Regularność', p_timezone: 'Europe/Warsaw', p_weekly_target: 4 }
      assert.equal((await anon.rpc('save_profile', input)).error?.code, '42501')
      assert.equal((await a.rpc('save_profile', input)).error, null)
      const saved = (await a.from('profiles').select('*').single()).data
      assert.equal(saved.display_name, 'Lokalnie')
      assert.deepEqual(saved.preferences, { extra: 'keep', weeklyTarget: 4 })
      for (const change of [{ p_weekly_target: 0 }, { p_timezone: 'Nie/Ma' }, { p_display_name: '' }]) assert.ok((await a.rpc('save_profile', { ...input, ...change })).error)
      assert.equal((await a.from('profiles').select('preferences').single()).data.preferences.weeklyTarget, 4)
      assert.notEqual((await b.from('profiles').select('display_name').single()).data.display_name, 'Lokalnie')
    })
  }
  finally { for (const id of users) assert.equal((await admin.auth.admin.deleteUser(id)).error, null) }
})
