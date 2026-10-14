import { test } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { planIntakeSchema } from '../../shared/schemas/plan-intake.ts'
import { buildPlanIntakeInstructions, emptyPlanIntake } from '../../app/domain/plan-intake.ts'
import { buildAiPrompt, parseAiResponse } from '../../app/domain/ai.ts'

function intake() {
  return { ...emptyPlanIntake(), equipment: ['dumbbells', 'bench'], limitations: 'yes', limitationDetails: 'Bez martwego ciągu', preferred: 'Rozpiętki', weekdays: [2, 5, 7] }
}

test('ankieta: wymaga sprzętu, spójnych dni i opisu wskazanych ograniczeń', () => {
  assert.ok(planIntakeSchema.safeParse(intake()).success)
  for (const change of [{ equipment: [] }, { weekdays: [2, 2, 7] }, { weekdays: [2, 5] }, { limitationDetails: '' }, { minutes: 0 }, { daysPerWeek: 8 }, { age: '30' }, { unexpected: true }])
    assert.equal(planIntakeSchema.safeParse({ ...intake(), ...change }).success, false)
  assert.ok(planIntakeSchema.safeParse({ ...intake(), weekdays: [] }).success)
})

test('ankieta: zachowuje odpowiedzi i mieści maksymalne długości w istniejącym limicie konsultacji', () => {
  const value = { ...intake(), goal: 'fat_loss', breakLength: 'ą'.repeat(80), limitationDetails: 'ó'.repeat(240), preferred: 'ę'.repeat(180), avoided: 'ć'.repeat(180), notes: 'ż'.repeat(200), equipment: ['dumbbells', 'barbell', 'machines', 'cables', 'bodyweight', 'pullup_bar', 'bands', 'bench'] }
  const text = buildPlanIntakeInstructions(value)
  assert.ok(text.length <= 2000)
  for (const answer of [value.limitationDetails, value.preferred, value.avoided, value.notes, '2, 5, 7', '60 min', '3']) assert.ok(text.includes(answer))
  assert.ok(!buildPlanIntakeInstructions({ ...value, limitations: 'none' }).includes(value.limitationDetails))
})

test('ankieta: prompt bez historii ma kontrakt v1 i pozwala sprawdzić odpowiedź z pustym ciężarem', () => {
  const exerciseId = randomUUID()
  const request = { id: randomUUID(), action: 'create_plan', planId: null, baseRevision: null, applied: false, response: null, result: null, context: { instructions: buildPlanIntakeInstructions(intake()), plan: null, historyLimit: 0, history: [], catalog: [{ id: exerciseId, name: 'Rozpiętki', equipment: 'Hantle', loadMode: 'external', weightConvention: 'per_hand', weightIncrementKg: 1 }] } }
  const prompt = buildAiPrompt(request)
  assert.ok(prompt.includes('Historia (limit 0): []'))
  assert.ok(prompt.includes('targetWeightKg: null'))
  assert.ok(prompt.includes(request.id))
  assert.ok(prompt.includes('Bez martwego ciągu'))
  assert.ok(prompt.includes('"additionalProperties":false'))
  const response = { schemaVersion: 1, requestId: request.id, action: 'create_plan', payload: { plan: { name: 'Plan testowy', description: '', workouts: [{ name: 'A', weekday: null, exercises: [{ exerciseId, notes: '', restSeconds: 120, sets: [{ setType: 'working', repsMin: 10, repsMax: 12, targetWeightKg: null }] }] }] } } }
  assert.deepEqual(parseAiResponse(JSON.stringify(response), request), response)
})
