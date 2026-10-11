import { test } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import { localContext, localPassword } from '../../scripts/local-supabase.mjs'
import { aiContextSchema, aiResultSchema } from '../../shared/schemas/ai.ts'

const exerciseId = '23e82d62-62ed-4f8d-8ef7-f28d130857d9'
const plan = { name: 'AI test', description: 'Prywatny opis', workouts: [{ name: 'A', weekday: null, exercises: [{ exerciseId, restSeconds: 120, notes: 'Prywatna notatka', sets: [{ setType: 'working', repsMin: 8, repsMax: 12, targetWeightKg: 80 }] }] }] }
test('AI: własność, transakcje, cztery akcje, rewizje i idempotencja', async (context) => {
  const config = localContext()
  const admin = createClient(config.url, config.serviceRoleKey, { auth: { persistSession: false } })
  const users = []
  const clients = []
  try {
    for (let i = 0; i < 2; i++) {
      const email = `ai-${randomUUID()}@silka.test`
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
    const created = await a.rpc('create_training_plan', { p_id: planId, p_operation_id: randomUUID(), p_plan: plan })
    assert.equal(created.error, null)
    const prepare = (client, action, selected = null, id = randomUUID()) => selected
      ? client.rpc('prepare_ai_consultation', { p_id: id, p_action: action, p_plan_id: selected, p_history_limit: 10, p_instructions: '' })
      : client.rpc('prepare_ai_without_plan', { p_id: id, p_action: action, p_history_limit: 10, p_instructions: '' })
    const apply = (client, req, response, selections = []) => client.rpc('apply_ai_response', { p_request_id: req.id, p_response: JSON.stringify(response), p_selections: selections })
    const response = req => ({ schemaVersion: 1, requestId: req.id, action: req.action, ...(req.action === 'replace_plan' ? { target: { planId: req.plan_id, baseRevision: req.base_revision } } : {}), payload: req.action === 'analyze_history' ? { summary: 'Analiza', observations: ['Regularność'], recommendations: [] } : req.action === 'suggest_progression' ? { suggestions: [{ exerciseId, suggestedWeightKg: 82.5, reason: 'Przykład' }] } : { plan } })
    const revision = async () => (await a.from('training_plans').select('revision').eq('id', planId).single()).data.revision
    const req = (await prepare(a, 'replace_plan', planId)).data
    assert.ok(req)
    aiContextSchema.parse(req.context)
    await context.test('konsultacja i plan nie przechodzą między kontami ani do anonima', async () => {
      assert.equal((await prepare(anon, 'create_plan')).error.code, '42501')
      assert.equal((await prepare(b, 'replace_plan', planId)).error.code, '42501')
      assert.equal((await apply(b, req, response(req))).error.code, '42501')
      assert.equal((await apply(anon, req, response(req))).error.code, '42501')
      assert.deepEqual((await b.from('ai_consultations').select('id').eq('id', req.id)).data, [])
      assert.equal((await b.from('ai_consultations').update({ user_id: users[1] }).eq('id', req.id).select('id')).data.length, 0)
      assert.ok((await a.from('ai_consultations').update({ user_id: users[1] }).eq('id', req.id)).error)
      assert.ok((await b.from('ai_consultations').insert({ id: randomUUID(), action: 'replace_plan', plan_id: planId, base_revision: 1, preparation_hash: 'x', context: {} })).error)
    })
    await context.test('ponowienie przygotowania zwraca ten sam kontekst; bez podglądu plan się nie zmienia', async () => {
      const again = await prepare(a, 'replace_plan', planId, req.id)
      assert.equal(again.error, null)
      assert.deepEqual(again.data.context, req.context)
      assert.equal(await revision(), 1)
      assert.deepEqual(req.context.history, [])
      assert.ok(req.context.catalog.some(item => item.id === exerciseId))
    })
    await context.test('błędny JSON, pola, wersja, target, liczby i niedostępne ćwiczenie wycofują wszystko', async () => {
      const good = response(req)
      const invalid = [{ ...good, schemaVersion: 2 }, { ...good, userId: users[1] }, { ...good, requestId: randomUUID() }, { ...good, target: { ...good.target, baseRevision: 2 } }]
      for (const weight of [-1, 1001, 80.111, '80']) {
        const value = structuredClone(good)
        value.payload.plan.workouts[0].exercises[0].sets[0].targetWeightKg = weight
        invalid.push(value)
      }
      const unknown = structuredClone(good)
      unknown.payload.plan.workouts[0].exercises[0].exerciseId = randomUUID()
      invalid.push(unknown)
      const partial = structuredClone(good)
      partial.payload.plan.workouts.push({ ...plan.workouts[0], name: 'B', exercises: [{ ...plan.workouts[0].exercises[0], sets: [{ ...plan.workouts[0].exercises[0].sets[0], repsMin: 13 }] }] })
      invalid.push(partial)
      for (const value of invalid) assert.ok((await apply(a, req, value)).error)
      assert.equal(await revision(), 1)
      assert.equal((await a.from('ai_consultations').select('applied_hash').eq('id', req.id).single()).data.applied_hash, null)
      assert.equal((await a.from('plan_workouts').select('id').eq('plan_id', planId)).data.length, 1)
      assert.ok((await a.rpc('apply_ai_response', { p_request_id: req.id, p_response: '{', p_selections: [] })).error)
      assert.ok((await a.rpc('apply_ai_response', { p_request_id: req.id, p_response: 'x'.repeat(262145), p_selections: [] })).error)
    })
    await context.test('zamiana zwiększa rewizję raz, ponowienie nie zapisuje drugi raz', async () => {
      const value = response(req)
      value.payload.plan = { ...plan, name: 'Zmieniony' }
      const result = await apply(a, req, value)
      assert.equal(result.error, null)
      assert.deepEqual(aiResultSchema.parse(result.data), { planId, revision: 2 })
      assert.deepEqual((await apply(a, req, value)).data, result.data)
      assert.equal(await revision(), 2)
      assert.ok((await apply(a, req, response(req))).error)
    })
    await context.test('nowy plan ma jedno stabilne ID i nie jest automatycznie aktywny', async () => {
      const request = (await prepare(a, 'create_plan')).data
      const value = response(request)
      const result = await apply(a, request, value)
      assert.equal(result.error, null)
      assert.equal(result.data.planId, request.new_plan_id)
      assert.deepEqual((await apply(a, request, value)).data, result.data)
      assert.equal((await a.from('training_plans').select('id').eq('id', request.new_plan_id)).data.length, 1)
      assert.equal((await a.from('plan_assignments').select('id').eq('plan_id', request.new_plan_id)).data.length, 0)
    })
    await context.test('analiza nie zmienia planu; progresja zmienia wyłącznie wybraną serię', async () => {
      const analysis = (await prepare(a, 'analyze_history')).data
      assert.deepEqual((await apply(a, analysis, response(analysis))).data, { planId: null, revision: null })
      assert.equal(await revision(), 2)
      const request = (await prepare(a, 'suggest_progression', planId)).data
      const value = response(request)
      const choice = { suggestionIndex: 0, workoutIndex: 0, exerciseIndex: 0, setIndex: 0 }
      for (const selections of [[], [choice, choice], [{ ...choice, setIndex: 1 }], [{ ...choice, suggestionIndex: 1 }], [{ ...choice, userId: users[0] }]]) assert.ok((await apply(a, request, value, selections)).error)
      const result = await apply(a, request, value, [choice])
      assert.equal(result.error, null)
      assert.equal(result.data.revision, 3)
      const snapshot = (await a.rpc('read_ai_plan', { p_id: planId })).data
      assert.equal(snapshot.workouts[0].exercises[0].sets[0].targetWeightKg, 82.5)
      assert.equal(snapshot.workouts[0].exercises[0].notes, 'Prywatna notatka')
      assert.equal(snapshot.description, 'Prywatny opis')
      assert.equal(snapshot.name, 'Zmieniony')
      assert.deepEqual((await apply(a, request, value, [choice])).data, result.data)
    })
    await context.test('zmieniona rewizja blokuje stare konsultacje w transakcji', async () => {
      const old = (await prepare(a, 'replace_plan', planId)).data
      assert.equal((await a.rpc('save_training_plan', { p_id: planId, p_base_revision: 3, p_operation_id: randomUUID(), p_plan: plan })).error, null)
      assert.equal((await apply(a, old, response(old))).error.code, 'PT409')
      assert.equal(await revision(), 4)
    })
  }
  finally { for (const id of users) assert.equal((await admin.auth.admin.deleteUser(id)).error, null) }
})
