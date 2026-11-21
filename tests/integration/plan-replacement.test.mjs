import { test } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import { localContext, localPassword } from '../../scripts/local-supabase.mjs'
import { fetchWorkout, fetchPlanReplacementContext } from '../../app/services/workouts.ts'
import { replaceWorkoutExercise } from '../../app/domain/workout-replacement.ts'
import { workoutPayload, finishWorkout } from '../../app/domain/workouts.ts'

test('prywatna podmiana planu: atomowość, pochodzenie pozycji, stare klienty i dwa konta', async (t) => {
  const config = localContext(), options = { auth: { persistSession: false, autoRefreshToken: false } }
  const admin = createClient(config.url, config.serviceRoleKey, options)
  const anon = createClient(config.url, config.anonKey, options)
  const users = [], clients = [], plans = [randomUUID(), randomUUID()]
  const original = '23e82d62-62ed-4f8d-8ef7-f28d130857d9', replacementId = '20000000-0000-4000-8000-000000000040'
  const descriptor = { id: replacementId, name: 'Zamiennik', equipment: 'Hantle', loadMode: 'external', weightConvention: 'per_hand' }
  const planExercise = () => ({ exerciseId: original, restSeconds: 60, notes: 'Wskazówka starego ćwiczenia', sets: [1, 2].map(() => ({ setType: 'working', repsMin: 8, repsMax: 12, targetWeightKg: 40 })) })
  const plan = { name: 'Dwie prywatne kopie', description: '', workouts: ['A', 'B', 'C'].map(name => ({ name, weekday: null, exercises: [planExercise(), planExercise()] })) }
  const templates = []
  let currentId, historyId, proposal, operation, successfulPayload
  async function readPlan(client, id) {
    const result = await client.from('training_plans').select('*,plan_workouts(*,plan_exercises(*,plan_sets(*)))').eq('id', id).single()
    assert.equal(result.error, null)
    return result.data
  }
  const save = (client, session, payload, op = randomUUID()) => client.rpc('save_workout', { p_id: session.id, p_base_revision: session.revision, p_operation_id: op, p_payload: payload })
  async function start(client, template, revision) {
    const id = randomUUID()
    assert.equal((await client.rpc('start_workout', { p_id: id, p_workout_id: template, p_plan_revision: revision })).error, null)
    return id
  }
  function replace(session, context = null, newExercise = descriptor) {
    const value = replaceWorkoutExercise(session, context?.workoutExerciseId ?? session.exercises[0].id, newExercise, randomUUID)
    const target = value.session.exercises.find(e => e.sets.some(set => set.id === value.selectedSetId))
    const payload = workoutPayload(value.session)
    if (context) payload.planReplacement = { planId: context.planId, planRevision: context.planRevision, planExerciseId: context.planExerciseId, workoutExerciseId: context.workoutExerciseId, expectedExerciseId: context.expectedExerciseId, replacementExerciseId: newExercise.id, replacementWorkoutExerciseId: target.id }
    return { session: value.session, payload, targetId: target.id }
  }
  async function close(client, id) {
    const session = await fetchWorkout(client, id)
    assert.equal((await save(client, session, workoutPayload(finishWorkout(session, 'abandoned')))).error, null)
  }
  try {
    for (let i = 0; i < 2; i++) {
      const email = `plan-replacement-${randomUUID()}@silka.test`
      const result = await admin.auth.admin.createUser({ email, password: localPassword, email_confirm: true })
      assert.equal(result.error, null)
      users.push(result.data.user.id)
      const client = createClient(config.url, config.anonKey, options)
      assert.equal((await client.auth.signInWithPassword({ email, password: localPassword })).error, null)
      clients.push(client)
      assert.equal((await client.rpc('create_training_plan', { p_id: plans[i], p_operation_id: randomUUID(), p_plan: plan })).error, null)
      const rows = await client.from('plan_workouts').select('id').eq('plan_id', plans[i]).order('position')
      templates.push(rows.data.map(row => row.id))
    }
    const [a, b] = clients
    historyId = await start(a, templates[0][0], 1)
    const history = await fetchWorkout(a, historyId)
    for (const exercise of history.exercises) for (const set of exercise.sets) Object.assign(set, { reps: 10, weightKg: 40, status: 'completed', completedAt: new Date().toISOString() })
    assert.equal((await save(a, history, workoutPayload(finishWorkout(history, 'completed')))).error, null)
    const savedHistory = await fetchWorkout(a, historyId)
    currentId = await start(a, templates[0][0], 1)
    const otherPlan = await readPlan(b, plans[1])
    await t.test('pochodzenie rozróżnia identyczne ćwiczenia, obce konto i anonim są blokowane', async () => {
      const session = await fetchWorkout(a, currentId)
      const contexts = await Promise.all(session.exercises.map(e => fetchPlanReplacementContext(a, currentId, e.id)))
      assert.notEqual(contexts[0].planExerciseId, contexts[1].planExerciseId)
      assert.equal(contexts[0].planId, plans[0])
      assert.equal((await anon.rpc('workout_plan_replacement_context', { p_session_id: currentId, p_exercise_id: session.exercises[0].id })).error?.code, '42501')
      assert.equal((await b.rpc('workout_plan_replacement_context', { p_session_id: currentId, p_exercise_id: session.exercises[0].id })).error?.code, '42501')
      assert.equal((await a.from('workout_exercises').update({ source_plan_exercise_id: randomUUID() }).eq('id', session.exercises[0].id)).error?.code, '23514')
      const foreignSource = otherPlan.plan_workouts[0].plan_exercises[0].id
      assert.equal((await a.from('workout_exercises').insert({ session_id: currentId, exercise_id: original, source_plan_exercise_id: foreignSource, exercise_name_snapshot: 'Fałszywe źródło', equipment_snapshot: 'Sztanga', load_mode_snapshot: 'external', weight_convention_snapshot: 'total', position: 99 })).error?.code, '42501')
      const foreignSlot = replace(session, contexts[0]).payload
      foreignSlot.planReplacement.planExerciseId = foreignSource
      assert.equal((await save(a, session, foreignSlot)).error?.code, 'PT412')
      const invalid = replace(session, contexts[0]).payload
      invalid.planReplacement.planId = plans[1]
      assert.equal((await save(a, session, invalid)).error?.code, '42501')
      assert.deepEqual(await fetchWorkout(a, currentId), session)
    })
    await t.test('jednorazowa podmiana nie zmienia planu ani jego rewizji', async () => {
      const session = await fetchWorkout(a, currentId)
      const before = await readPlan(a, plans[0])
      assert.equal((await save(a, session, replace(session).payload)).error, null)
      assert.deepEqual(await readPlan(a, plans[0]), before)
      const next = await fetchWorkout(a, currentId)
      const context = await fetchPlanReplacementContext(a, currentId, next.exercises[0].id)
      assert.equal(context.expectedExerciseId, replacementId)
      assert.equal(context.planExerciseName, savedHistory.exercises[0].name)
    })
    await t.test('stała zmiana dotyczy jednego miejsca i tylko własnej kopii; ponowienie nie powtarza zmiany', async () => {
      const session = await fetchWorkout(a, currentId)
      // Choose the second, still-original duplicate to test precise slot identity.
      const context = await fetchPlanReplacementContext(a, currentId, session.exercises[1].id)
      const before = await readPlan(a, plans[0])
      proposal = replace(session, context)
      operation = randomUUID()
      successfulPayload = proposal.payload
      assert.equal((await save(a, session, proposal.payload, operation)).error, null)
      assert.equal((await save(a, session, proposal.payload, operation)).data, session.revision + 1)
      const after = await readPlan(a, plans[0])
      assert.equal(after.revision, before.revision + 1)
      assert.deepEqual(after.plan_workouts.map(w => w.id).sort(), before.plan_workouts.map(w => w.id).sort())
      for (const workout of after.plan_workouts) for (const exercise of workout.plan_exercises) {
        const old = before.plan_workouts.flatMap(w => w.plan_exercises).find(e => e.id === exercise.id)
        if (exercise.id === context.planExerciseId) {
          assert.equal(exercise.exercise_id, replacementId)
          assert.equal(exercise.notes, '')
          assert.equal(exercise.rest_seconds, old.rest_seconds)
          assert.ok(exercise.plan_sets.every(set => set.target_weight_kg === null && set.reps_min === 8 && set.reps_max === 12))
        }
        else assert.deepEqual(exercise, old)
      }
      const tampered = structuredClone(successfulPayload)
      tampered.planReplacement.planRevision++
      assert.equal((await save(a, session, tampered, operation)).error?.code, '23514')
      assert.deepEqual(await readPlan(b, plans[1]), otherPlan)
      assert.deepEqual(await fetchWorkout(a, historyId), savedHistory)
    })
    await t.test('przyszła sesja właściciela używa zamiennika; druga osoba nadal ma swój oryginał', async () => {
      await close(a, currentId)
      currentId = await start(a, templates[0][0], 2)
      const next = await fetchWorkout(a, currentId)
      assert.equal(next.exercises[1].exerciseId, replacementId)
      assert.ok(next.exercises[1].sets.every(set => set.plannedWeightKg === null))
      const other = await start(b, templates[1][0], 1)
      assert.ok((await fetchWorkout(b, other)).exercises.every(e => e.exerciseId === original))
      await close(b, other)
    })
    await t.test('częściowe wykonanie zachowuje wynik i przenosi pochodzenie na nowy wariant', async () => {
      let session = await fetchWorkout(a, currentId)
      Object.assign(session.exercises[0].sets[0], { reps: 9, weightKg: 41, status: 'completed', completedAt: new Date().toISOString() })
      assert.equal((await save(a, session, workoutPayload(session))).error, null)
      session = await fetchWorkout(a, currentId)
      const performed = structuredClone(session.exercises[0].sets[0])
      const context = await fetchPlanReplacementContext(a, currentId, session.exercises[0].id)
      const chosen = replace(session, context)
      const invalid = structuredClone(chosen.payload)
      invalid.exercises.at(-1).sets[0].reps = 1.5
      const before = await readPlan(a, plans[0])
      assert.equal((await save(a, session, invalid)).error?.code, '23514')
      assert.deepEqual(await readPlan(a, plans[0]), before)
      assert.deepEqual(await fetchWorkout(a, currentId), session)
      assert.equal((await save(a, session, chosen.payload)).error, null)
      const after = await fetchWorkout(a, currentId)
      assert.deepEqual(after.exercises[0].sets[0], performed)
      assert.equal(after.exercises[0].sets[1].status, 'skipped')
      assert.equal(after.exercises.at(-1).exerciseId, replacementId)
      const nextContext = await fetchPlanReplacementContext(a, currentId, chosen.targetId)
      assert.equal(nextContext.planExerciseId, context.planExerciseId)
      assert.equal(nextContext.planRevision, 3)
    })
    await t.test('konflikt planu i fałszywe metadane wycofują obie części; stara kolejka nadal działa', async () => {
      const session = await fetchWorkout(a, currentId)
      const last = session.exercises.at(-1)
      const context = await fetchPlanReplacementContext(a, currentId, last.id)
      const otherDescriptor = { id: original, name: 'Oryginał', equipment: 'Sztanga', loadMode: 'external', weightConvention: 'total' }
      const next = replace(session, context, otherDescriptor)
      assert.equal((await a.from('training_plans').update({ description: 'Edycja na drugim urządzeniu' }).eq('id', plans[0])).error, null)
      const before = await readPlan(a, plans[0])
      assert.equal((await save(a, session, next.payload)).error?.code, 'PT412')
      assert.deepEqual(await fetchWorkout(a, currentId), session)
      assert.deepEqual(await readPlan(a, plans[0]), before)
      const fresh = await fetchPlanReplacementContext(a, currentId, last.id)
      for (const patch of [{ planExerciseId: randomUUID() }, { workoutExerciseId: randomUUID() }, { replacementWorkoutExerciseId: session.exercises[1].id }, { userId: users[1] }]) {
        const invalid = replace(session, fresh, otherDescriptor).payload
        Object.assign(invalid.planReplacement, patch)
        assert.ok((await save(a, session, invalid)).error)
        assert.deepEqual(await readPlan(a, plans[0]), before)
        assert.deepEqual(await fetchWorkout(a, currentId), session)
      }
      const legacy = workoutPayload(session)
      legacy.exercises.forEach((e) => {
        delete e.replacesExerciseId
      })
      assert.equal((await save(a, session, legacy)).error, null)
      assert.deepEqual(await readPlan(a, plans[0]), before)
    })
    await t.test('przebudowany plan nie jest dopasowywany na ślepo; zamiana tylko sesji nadal działa', async () => {
      const before = await readPlan(a, plans[0])
      assert.equal((await a.rpc('save_training_plan', { p_id: plans[0], p_base_revision: before.revision, p_operation_id: randomUUID(), p_plan: plan })).error, null)
      const session = await fetchWorkout(a, currentId)
      const last = session.exercises[1]
      assert.equal(await fetchPlanReplacementContext(a, currentId, last.id), null)
      Object.assign(last.sets[0], { reps: 8, weightKg: 12, status: 'completed', completedAt: new Date().toISOString() })
      assert.equal((await save(a, session, workoutPayload(session))).error, null)
      const performed = await fetchWorkout(a, currentId)
      const result = replaceWorkoutExercise(performed, last.id, { id: original, name: 'Oryginał', equipment: 'Sztanga', loadMode: 'external', weightConvention: 'total' }, randomUUID)
      assert.equal((await save(a, performed, workoutPayload(result.session))).error, null)
      assert.equal(await fetchPlanReplacementContext(a, currentId, result.session.exercises.at(-1).id), null)
      assert.deepEqual(await readPlan(b, plans[1]), otherPlan)
      assert.deepEqual(await fetchWorkout(a, historyId), savedHistory)
    })
  }
  finally { for (const id of users) assert.equal((await admin.auth.admin.deleteUser(id)).error, null) }
})
