import { test } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import { localContext, localPassword } from '../../scripts/local-supabase.mjs'

test('podmiana ćwiczenia: zgodność starych zapisów, snapshoty, RLS, atomowość i konflikt', async (context) => {
  const config = localContext()
  const options = { auth: { persistSession: false, autoRefreshToken: false } }
  const admin = createClient(config.url, config.serviceRoleKey, options)
  const clients = [createClient(config.url, config.anonKey, options), createClient(config.url, config.anonKey, options)]
  const anon = createClient(config.url, config.anonKey, options)
  const users = []
  const planId = randomUUID()
  const sessionId = randomUUID()
  const originalExercise = '23e82d62-62ed-4f8d-8ef7-f28d130857d9'
  const replacement = '20000000-0000-4000-8000-000000000040'
  const archivedId = randomUUID()
  try {
    for (const client of clients) {
      const email = `replacement-${randomUUID()}@silka.test`
      const result = await admin.auth.admin.createUser({ email, password: localPassword, email_confirm: true })
      assert.equal(result.error, null)
      users.push(result.data.user.id)
      assert.equal((await client.auth.signInWithPassword({ email, password: localPassword })).error, null)
    }
    const [a, b] = clients
    const plan = { name: 'Podmiana lokalnie', description: '', workouts: [{ name: 'FBW', weekday: null, exercises: [{ exerciseId: originalExercise, restSeconds: 1, notes: 'Wskazówki starego ćwiczenia', sets: [1, 2, 3].map(() => ({ setType: 'working', repsMin: 8, repsMax: 12, targetWeightKg: 40 })) }] }] }
    assert.equal((await a.rpc('create_training_plan', { p_id: planId, p_operation_id: randomUUID(), p_plan: plan })).error, null)
    const template = await a.from('plan_workouts').select('id').eq('plan_id', planId).single()
    assert.equal((await a.rpc('start_workout', { p_id: sessionId, p_workout_id: template.data.id, p_plan_revision: 1 })).error, null)
    const graph = async () => {
      const result = await a.from('workout_sessions').select('*,workout_exercises(*,workout_sets(*))').eq('id', sessionId).single()
      assert.equal(result.error, null)
      result.data.workout_exercises.sort((x, y) => x.position - y.position)
      result.data.workout_exercises.forEach(exercise => exercise.workout_sets.sort((x, y) => x.position - y.position))
      return result.data
    }
    const payload = value => ({ status: 'active', finishedAt: null, restEndsAt: null, exercises: value.workout_exercises.map(exercise => ({ id: exercise.id, exerciseId: exercise.exercise_id, restSeconds: exercise.rest_seconds, sets: exercise.workout_sets.sort((x, y) => x.position - y.position).map(set => ({ id: set.id, reps: set.reps, weightKg: set.weight_kg, status: set.status, completedAt: set.completed_at, setType: set.set_type, plannedRepsMin: set.planned_reps_min, plannedRepsMax: set.planned_reps_max, plannedWeightKg: set.planned_weight_kg })) })) })
    const save = (revision, value, operation = randomUUID(), client = a) => client.rpc('save_workout', { p_id: sessionId, p_base_revision: revision, p_operation_id: operation, p_payload: value })
    await context.test('starsza kolejka bez metadanych nadal działa', async () => {
      const old = payload(await graph())
      old.exercises.forEach((exercise) => {
        delete exercise.exerciseId
        delete exercise.restSeconds
        exercise.sets.forEach((set) => {
          delete set.setType
          delete set.plannedRepsMin
          delete set.plannedRepsMax
          delete set.plannedWeightKg
        })
      })
      assert.equal((await save(1, old)).data, 2)
    })
    await context.test('podmiana jest idempotentna, a metadane pochodzą z katalogu', async () => {
      const next = payload(await graph())
      next.exercises[0].exerciseId = replacement
      next.exercises[0].sets.forEach((set) => {
        set.plannedWeightKg = null
      })
      const operation = randomUUID()
      assert.equal((await save(2, next, operation)).error, null)
      assert.equal((await save(2, next, operation)).data, 3)
      const value = await graph()
      assert.equal(value.workout_exercises[0].exercise_id, replacement)
      assert.equal(value.workout_exercises[0].weight_convention_snapshot, 'per_hand')
      assert.equal(value.workout_exercises[0].notes, '')
      assert.ok(value.workout_exercises[0].workout_sets.every(set => set.planned_weight_kg === null))
      assert.equal((await a.from('plan_exercises').select('exercise_id').eq('user_id', users[0]).single()).data.exercise_id, originalExercise)
      assert.equal((await save(2, next)).error?.code, 'PT409')
      assert.equal((await save(3, next, randomUUID(), b)).error?.code, '42501')
      assert.equal((await save(3, next, randomUUID(), anon)).error?.code, '42501')
    })
    await context.test('nieznane lub archiwalne ćwiczenia i obce pola wycofują transakcję', async () => {
      assert.equal((await admin.from('exercises').insert({ id: archivedId, name: 'Archiwalne testowe', equipment: 'Maszyna', muscle_group: 'Nogi', load_mode: 'external', archived_at: new Date().toISOString() })).error, null)
      const before = await graph()
      for (const id of [randomUUID(), archivedId]) {
        const invalid = payload(before)
        invalid.exercises[0].exerciseId = id
        assert.equal((await save(3, invalid)).error?.code, '42501')
      }
      const invalid = payload(before)
      invalid.exercises[0].userId = users[1]
      assert.equal((await save(3, invalid)).error?.code, '23514')
      assert.deepEqual(await graph(), before)
    })
    let performed
    await context.test('wykonanej serii nie można przenieść przez zmianę tożsamości ćwiczenia', async () => {
      const next = payload(await graph())
      Object.assign(next.exercises[0].sets[0], { reps: 10, weightKg: 8, status: 'completed', completedAt: new Date().toISOString() })
      assert.equal((await save(3, next)).data, 4)
      performed = (await graph()).workout_exercises[0].workout_sets[0]
      next.exercises[0].exerciseId = originalExercise
      assert.equal((await save(4, next)).error?.code, '23514')
      assert.equal((await graph()).revision, 4)
    })
    await context.test('zamiennik pozostałych serii jest atomowy i zachowuje wykonany wynik', async () => {
      const next = payload(await graph())
      const old = next.exercises[0]
      const remaining = old.sets.filter(set => set.status === 'pending')
      const newExercise = { id: randomUUID(), exerciseId: originalExercise, restSeconds: 1, sets: remaining.map(set => ({ ...set, id: randomUUID(), plannedWeightKg: null })) }
      remaining.forEach((set) => {
        set.status = 'skipped'
      })
      next.exercises.push(newExercise)
      const invalid = structuredClone(next)
      invalid.exercises[1].sets[1].reps = 1.5
      assert.equal((await save(4, invalid)).error?.code, '23514')
      assert.equal((await graph()).workout_exercises.length, 1)
      const operation = randomUUID()
      assert.equal((await save(4, next, operation)).data, 5)
      assert.equal((await save(4, next, operation)).data, 5)
      const value = await graph()
      assert.equal(value.workout_exercises.length, 2)
      const actual = value.workout_exercises[0].workout_sets.find(set => set.id === performed.id)
      assert.deepEqual({ ...actual, updated_at: null }, { ...performed, updated_at: null })
      assert.equal(value.workout_exercises[1].workout_sets.length, 2)
      assert.equal(value.workout_exercises[1].workout_sets[0].planned_reps_min, 8)
      const foreign = payload(value)
      foreign.exercises[1].sets[0].id = value.workout_exercises[0].workout_sets[0].id
      assert.ok((await save(5, foreign)).error)
      assert.equal((await graph()).revision, 5)
    })
  }
  finally {
    for (const id of users) await admin.auth.admin.deleteUser(id)
    await admin.from('exercises').delete().eq('id', archivedId)
  }
})
