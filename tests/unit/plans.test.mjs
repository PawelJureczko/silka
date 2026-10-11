import { test } from 'node:test'
import assert from 'node:assert/strict'
import { reactive } from 'vue'
import { exerciseSchema, planSchema } from '../../shared/schemas/plans.ts'
import { newPlan, newSet, moveItem, parseDecimal, parsePlanExport, mapImportedPlan } from '../../app/domain/plans.ts'

const exerciseId = '23e82d62-62ed-4f8d-8ef7-f28d130857d9'
const plan = { name: 'Góra / dół', description: '', workouts: [{ name: 'Dół A', weekday: 1, exercises: [{ exerciseId, restSeconds: 120, notes: '', sets: [newSet()] }] }] }
const descriptor = { id: exerciseId, name: 'Przysiad', equipment: 'Sztanga', muscleGroup: 'Nogi', loadMode: 'external', weightConvention: 'total', weightIncrementKg: 2.5 }
const exported = { format: 'silka-plan', schemaVersion: 1, plan, exercises: [descriptor] }

test('ciężar: polski przecinek, zero i brak wartości pozostają różnymi stanami', () => {
  assert.equal(parseDecimal(' 82,50 '), 82.5)
  assert.equal(parseDecimal('0'), 0)
  assert.equal(parseDecimal(''), null)
  for (const invalid of ['1,2.3', '-5', '1e2', '1 000', '1.234', 'Infinity']) assert.ok(Number.isNaN(parseDecimal(invalid)))
})
test('plan odrzuca obce pola, nieprawidłowe zakresy i limity zagnieżdżeń', () => {
  assert.ok(planSchema.safeParse(plan).success)
  assert.equal(planSchema.safeParse(newPlan()).success, false)
  assert.equal(planSchema.safeParse({ ...plan, userId: exerciseId }).success, false)
  for (const change of [{ repsMin: 13 }, { repsMax: 101 }, { targetWeightKg: -1 }, { targetWeightKg: 2.555 }, { repsMin: '8' }]) {
    const copy = structuredClone(plan)
    Object.assign(copy.workouts[0].exercises[0].sets[0], change)
    assert.equal(planSchema.safeParse(copy).success, false)
  }
  assert.equal(planSchema.safeParse({ ...plan, workouts: Array(8).fill(plan.workouts[0]) }).success, false)
})
test('import wymaga znanej wersji, pełnego katalogu i jawnego mapowania', () => {
  const parsed = parsePlanExport(JSON.stringify(exported))
  assert.throws(() => parsePlanExport(JSON.stringify({ ...exported, schemaVersion: 2 })))
  assert.throws(() => parsePlanExport(JSON.stringify({ ...exported, exercises: [] })))
  assert.throws(() => parsePlanExport(JSON.stringify({ ...exported, exercises: [descriptor, descriptor] })))
  assert.throws(() => parsePlanExport(JSON.stringify({ ...exported, exercises: [descriptor, { ...descriptor, id: '10000000-0000-4000-8000-000000000001' }] })))
  assert.throws(() => parsePlanExport('{'))
  assert.throws(() => parsePlanExport('ą'.repeat(131073)), /256 KiB/)
  assert.throws(() => mapImportedPlan(parsed, {}), /odpowiednik/)
  const ownId = '10000000-0000-4000-8000-000000000001'
  const copy = mapImportedPlan(reactive(parsed), { [exerciseId]: ownId })
  assert.equal(copy.workouts[0].exercises[0].exerciseId, ownId)
  assert.equal(parsed.plan.workouts[0].exercises[0].exerciseId, exerciseId)
  assert.match(copy.name, /kopia$/)
})
test('kolejność i konwencje obciążenia nie zmieniają się niejawnie', () => {
  const items = ['A', 'B', 'C']
  moveItem(items, 1, -1)
  assert.deepEqual(items, ['B', 'A', 'C'])
  moveItem(items, 0, -1)
  assert.deepEqual(items, ['B', 'A', 'C'])
  assert.equal(exerciseSchema.safeParse({ ...descriptor, id: undefined }).success, false)
  const input = structuredClone(descriptor)
  delete input.id
  assert.equal(exerciseSchema.safeParse({ ...input, loadMode: 'assisted', weightConvention: 'total' }).success, false)
  assert.equal(exerciseSchema.safeParse({ ...input, loadMode: 'assisted', weightConvention: 'assistance' }).success, true)
})
