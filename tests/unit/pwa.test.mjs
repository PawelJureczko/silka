import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import vm from 'node:vm'
import { randomUUID } from 'node:crypto'
import { blocksPwaUpdate } from '../../app/domain/pwa.ts'
import { readStoredIdentity } from '../../app/services/auth.ts'

test('aktualizacja czeka na aktywny trening, początek, kolejkę i konflikt', () => {
  const clear = { start: null, queue: [], conflict: false, session: { status: 'completed' } }
  assert.equal(blocksPwaUpdate(null), false)
  assert.equal(blocksPwaUpdate(clear), false)
  for (const patch of [{ session: { status: 'active' } }, { start: {} }, { queue: [{}] }, { conflict: true }]) assert.equal(blocksPwaUpdate({ ...clear, ...patch }), true)
})
test('lokalna tożsamość odrzuca uszkodzony magazyn i nie kopiuje tokenów', () => {
  const id = randomUUID()
  const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
  try {
    for (const value of ['null', '{', JSON.stringify({ user: { id: 'other' } }), JSON.stringify({ user: { id, email: 'bad' } })]) {
      Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: () => value } })
      assert.equal(readStoredIdentity(), null)
    }
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: () => JSON.stringify({ access_token: 'private', user: { id, email: 'test@example.com', token: 'private' } }) } })
    assert.deepEqual(readStoredIdentity(), { id, email: 'test@example.com' })
  }
  finally {
    if (original) Object.defineProperty(globalThis, 'localStorage', original)
    else delete globalThis.localStorage
  }
})
const source = await readFile(new URL('../../app/service-worker.js', import.meta.url), 'utf8')
function worker({ clients = [{ id: 'tab' }], failedInstall = false } = {}) {
  const listeners = {}
  const stores = new Map([['silka-shell-old', new Map([['/_nuxt/old.js', 'old chunk']])], ['unrelated', new Map()]])
  const actions = []
  vm.runInNewContext(source.replace(/'__SILKA_BUILD_ID__'/, JSON.stringify('new')).replace('/* SILKA_ASSETS */ []', JSON.stringify(['/index.html', '/_nuxt/new.js'])), {
    self: { location: { origin: 'https://silka.test' }, addEventListener: (name, action) => { listeners[name] = action }, skipWaiting: async () => actions.push('activate'), clients: { claim: async () => actions.push('claim'), matchAll: async () => clients } },
    URL, Request: class { constructor(path) { this.path = path } }, fetch: async () => 'network',
    caches: {
      keys: async () => [...stores.keys()], delete: async key => stores.delete(key),
      open: async (key) => {
        if (!stores.has(key)) stores.set(key, new Map())
        return { match: async path => stores.get(key).get(path), addAll: async (requests) => {
          if (failedInstall) throw new Error('offline')
          for (const request of requests) stores.get(key).set(request.path, 'cached ' + request.path)
        } }
      },
    },
  })
  async function dispatch(name, data = {}) {
    let promise
    const capture = (value) => {
      promise = value
    }
    listeners[name]({ ...data, waitUntil: capture, respondWith: capture })
    return await promise
  }
  const fetch = (path, patch = {}) => dispatch('fetch', { request: { url: 'https://silka.test' + path, method: 'GET', mode: 'cors', ...patch } })
  return { dispatch, fetch, stores, actions }
}
test('worker przechowuje tylko pliki buildu; API/Auth/obce zasoby nie są przechwytywane', async () => {
  const w = worker()
  await w.dispatch('install')
  assert.deepEqual(w.actions, [])
  assert.equal(await w.fetch('/workouts/' + randomUUID(), { mode: 'navigate' }), 'cached /index.html')
  assert.equal(await w.fetch('/_nuxt/new.js'), 'cached /_nuxt/new.js')
  assert.equal(await w.fetch('/_nuxt/old.js'), 'old chunk')
  for (const path of ['/auth/v1/token', '/rest/v1/workout_sessions', '/api/private', '/not-a-route']) assert.equal(await w.fetch(path, { mode: 'navigate' }), undefined)
  assert.equal(await w.fetch('/_nuxt/new.js', { method: 'POST' }), undefined)
  assert.equal(await w.fetch('/_nuxt/new.js', { url: 'https://supabase.test/_nuxt/new.js' }), undefined)
})
test('nieudana instalacja zachowuje poprzedni cache; aktualizacja wymaga jawnego komunikatu', async () => {
  const failed = worker({ failedInstall: true })
  await assert.rejects(failed.dispatch('install'), /offline/)
  assert.equal(failed.stores.has('silka-shell-old'), true)
  assert.equal(failed.stores.has('silka-shell-new'), false)
  const w = worker()
  await w.dispatch('install')
  await w.dispatch('activate')
  assert.deepEqual(w.actions, ['claim'])
  await w.dispatch('message', { data: { type: 'ACTIVATE_UPDATE' } })
  assert.deepEqual(w.actions, ['claim', 'activate'])
})
test('poprzedni build pozostaje dla innych kart i znika dopiero po otwarciu zgodnej wersji', async () => {
  for (const [clients, version, removed] of [[[{ id: 'tab' }, { id: 'other' }], 'new', false], [[{ id: 'tab' }], 'old', false], [[{ id: 'tab' }], 'new', true]]) {
    const w = worker({ clients })
    await w.dispatch('message', { data: { type: 'APP_READY', version }, source: { id: 'tab' } })
    assert.equal(w.stores.has('silka-shell-old'), !removed)
    assert.equal(w.stores.has('unrelated'), true)
  }
})
