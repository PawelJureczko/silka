import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createClient } from '@supabase/supabase-js'
import { ensureLocalUsers, localContext, localPassword, localUsers } from '../../scripts/local-supabase.mjs'

test('dwa konta logują się, widzą tylko własny profil i mogą się wylogować', async () => {
  const context = localContext()
  const ids = await ensureLocalUsers(context)
  for (const [index, fixture] of localUsers.entries()) {
    const client = createClient(context.url, context.anonKey, { auth: { persistSession: false, autoRefreshToken: false } })
    try {
      const { data, error } = await client.auth.signInWithPassword({ email: fixture.email, password: localPassword })
      assert.equal(error, null)
      assert.equal(data.user.id, ids[index])
      const profiles = await client.from('profiles').select('user_id, display_name')
      assert.equal(profiles.error, null)
      assert.deepEqual(profiles.data, [{ user_id: ids[index], display_name: fixture.displayName }])
      const otherId = ids[(index + 1) % ids.length]
      const update = await client.from('profiles').update({ display_name: 'Nieautoryzowana zmiana' }).eq('user_id', otherId).select('user_id')
      assert.equal(update.error, null)
      assert.deepEqual(update.data, [])
      const insert = await client.from('training_plans').insert({ user_id: otherId, name: 'Obcy plan' })
      assert.equal(insert.error?.code, '42501')
    }
    finally {
      assert.equal((await client.auth.signOut({ scope: 'local' })).error, null)
      assert.equal((await client.auth.getSession()).data.session, null)
    }
  }
})

test('błędne hasło nie daje sesji, a niezalogowany klient nie odczyta profili', async () => {
  const context = localContext()
  const client = createClient(context.url, context.anonKey, { auth: { persistSession: false, autoRefreshToken: false } })
  const login = await client.auth.signInWithPassword({ email: localUsers[0].email, password: 'wrong-password' })
  assert.equal(login.error?.code, 'invalid_credentials')
  assert.equal(login.data.session, null)
  const signup = await client.auth.signUp({ email: 'blocked@silka.test', password: localPassword })
  assert.equal(signup.error?.code, 'signup_disabled')
  const profiles = await client.from('profiles').select('user_id')
  assert.equal(profiles.error?.code, '42501')
})
