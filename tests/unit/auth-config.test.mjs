import { test } from 'node:test'
import assert from 'node:assert/strict'
import { publicSupabaseConfigSchema } from '../../shared/schemas/config.ts'
import { signInSchema } from '../../shared/schemas/auth.ts'
import { getAuthErrorMessage } from '../../app/services/auth.ts'

const publicKey = 'sb_publishable_abcdefghijklmnopqrstuv'
const legacyKey = role => `header.${Buffer.from(JSON.stringify({ role })).toString('base64url')}.signature`

test('publiczna konfiguracja odrzuca klucze administracyjne i akceptuje anon/publishable', () => {
  for (const key of [publicKey, legacyKey('anon')]) {
    assert.equal(publicSupabaseConfigSchema.safeParse({ url: 'https://example.supabase.co', key }).success, true)
  }
  for (const key of ['sb_secret_abcdefghijklmnopqrstuv', legacyKey('service_role'), 'invalid', 'a.not-json.b']) {
    assert.equal(publicSupabaseConfigSchema.safeParse({ url: 'https://example.supabase.co', key }).success, false)
  }
})

test('HTTP jest dozwolone wyłącznie dla lokalnej konfiguracji', () => {
  for (const url of ['http://127.0.0.1:54321', 'http://localhost:54321', 'https://example.supabase.co']) {
    assert.equal(publicSupabaseConfigSchema.safeParse({ url, key: publicKey }).success, true)
  }
  for (const url of ['http://example.supabase.co', 'ftp://example.com', 'invalid', '']) {
    assert.equal(publicSupabaseConfigSchema.safeParse({ url, key: publicKey }).success, false)
  }
})

test('logowanie usuwa odstępy z e-maila, zachowując dokładne hasło', () => {
  const credentials = signInSchema.parse({ email: '  user@example.com  ', password: ' password ' })
  assert.equal(credentials.email, 'user@example.com')
  assert.equal(credentials.password, ' password ')
  assert.equal(signInSchema.safeParse({ email: 'invalid', password: 'x' }).success, false)
  assert.equal(signInSchema.safeParse({ email: 'user@example.com', password: '' }).success, false)
})

test('błędy Auth nie ujawniają wewnętrznych komunikatów usługi', () => {
  assert.match(getAuthErrorMessage('invalid_credentials'), /nieprawidłowe/)
  assert.match(getAuthErrorMessage('over_request_rate_limit'), /Poczekaj/)
  assert.match(getAuthErrorMessage('unexpected_error'), /połączenie/)
})
