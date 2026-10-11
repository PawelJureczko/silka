import { test } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { aiResponseSchema } from '../../shared/schemas/ai.ts'
import { buildAiPrompt, parseAiResponse, progressionPlan, planChanges } from '../../app/domain/ai.ts'

const exerciseId = randomUUID()
const plan = { name: 'A', description: 'PRIVATE_DESCRIPTION', workouts: [{ name: 'Góra', weekday: null, exercises: [{ exerciseId, restSeconds: 120, notes: 'PRIVATE_NOTE', sets: [{ setType: 'working', repsMin: 8, repsMax: 12, targetWeightKg: 80 }] }] }] }
function request(action = 'create_plan') {
  return { id: randomUUID(), action, planId: randomUUID(), baseRevision: 3, context: { plan, catalog: [{ id: exerciseId, name: 'Wyciskanie', equipment: 'Sztanga', loadMode: 'external', weightConvention: 'total', weightIncrementKg: 2.5 }], history: [], historyLimit: 10, instructions: 'Trzy treningi' }, applied: false, response: null, result: null }
}
function response(req) {
  return { schemaVersion: 1, requestId: req.id, action: req.action, ...(req.action === 'replace_plan' ? { target: { planId: req.planId, baseRevision: req.baseRevision } } : {}), payload: req.action === 'analyze_history' ? { summary: 'Wyniki', observations: [], recommendations: [] } : req.action === 'suggest_progression' ? { suggestions: [{ exerciseId, suggestedWeightKg: 82.5, reason: 'Górny zakres' }] } : { plan } }
}
test('AI: cztery ścisłe warianty v1 i schemat promptu bez prywatnych notatek', () => {
  for (const action of ['create_plan', 'replace_plan', 'analyze_history', 'suggest_progression']) {
    const req = request(action)
    assert.deepEqual(parseAiResponse(JSON.stringify(response(req)), req), response(req))
    const prompt = buildAiPrompt(req)
    assert.ok(prompt.includes(req.id))
    assert.ok(prompt.includes(exerciseId))
    assert.ok(prompt.includes('"additionalProperties":false'))
    assert.ok(!prompt.includes('PRIVATE_DESCRIPTION'))
    assert.ok(!prompt.includes('PRIVATE_NOTE'))
    assert.equal(plan.description, 'PRIVATE_DESCRIPTION')
  }
})
test('AI: nieznana wersja, akcja, pola, liczby i zakresy nie przechodzą', () => {
  const req = request()
  const good = response(req)
  for (const value of [{ ...good, schemaVersion: 2 }, { ...good, userId: randomUUID() }, { ...good, target: {} }, { ...good, action: 'other' }]) assert.equal(aiResponseSchema.safeParse(value).success, false)
  for (const weight of [-1, 1001, 2.555, '82.5']) {
    const value = structuredClone(good)
    value.payload.plan.workouts[0].exercises[0].sets[0].targetWeightKg = weight
    assert.equal(aiResponseSchema.safeParse(value).success, false)
  }
  const bad = structuredClone(good)
  bad.payload.plan.workouts[0].exercises[0].sets[0].repsMin = 13
  assert.equal(aiResponseSchema.safeParse(bad).success, false)
})
test('AI: limit UTF-8 przed parsowaniem, inna konsultacja, niedostępne ID i rewizja', () => {
  const req = request('replace_plan')
  assert.throws(() => parseAiResponse('ą'.repeat(131073), req), /256/)
  assert.throws(() => parseAiResponse('```json\n{}\n```', req), /Markdown/)
  const good = response(req)
  for (const value of [{ ...good, requestId: randomUUID() }, { ...good, target: { ...good.target, baseRevision: 4 } }]) assert.throws(() => parseAiResponse(JSON.stringify(value), req))
  const foreign = structuredClone(good)
  foreign.payload.plan.workouts[0].exercises[0].exerciseId = randomUUID()
  assert.throws(() => parseAiResponse(JSON.stringify(foreign), req), /katalogu/)
  assert.throws(() => parseAiResponse(JSON.stringify(good), { ...req, applied: true }), /zatwierdzona/)
})
test('AI: progresja zmienia wyłącznie wskazany ciężar; odrzuca podwójny i niezgodny wybór', () => {
  const req = request('suggest_progression')
  const value = response(req)
  const choice = { suggestionIndex: 0, workoutIndex: 0, exerciseIndex: 0, setIndex: 0 }
  const next = progressionPlan(req, value, [choice])
  const expected = structuredClone(plan)
  expected.workouts[0].exercises[0].sets[0].targetWeightKg = 82.5
  assert.deepEqual(next, expected)
  assert.equal(plan.workouts[0].exercises[0].sets[0].targetWeightKg, 80)
  assert.throws(() => progressionPlan(req, value, []))
  assert.throws(() => progressionPlan(req, value, [choice, choice]))
  assert.throws(() => progressionPlan(req, value, [{ ...choice, setIndex: 1 }]))
  assert.equal(planChanges(plan, next).length, 1)
  assert.ok(planChanges(plan, next)[0].after.includes('82,5'))
})
test('AI: podgląd ujawnia usunięcia, nazwy, zakresy, notatki i odpoczynek', () => {
  const next = structuredClone(plan)
  next.name = 'B'
  next.description = ''
  next.workouts[0].exercises[0].notes = ''
  next.workouts[0].exercises[0].restSeconds = 90
  next.workouts[0].exercises[0].sets[0].repsMin = 9
  const changes = planChanges(plan, next)
  assert.equal(changes.length, 5)
  assert.ok(changes.some(item => item.before === 'PRIVATE_NOTE' && item.after === ''))
  next.workouts[0].exercises = []
  assert.ok(planChanges(plan, next).some(item => item.after === null))
})
