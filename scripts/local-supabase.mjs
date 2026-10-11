import { execFileSync } from 'node:child_process'
import { createClient } from '@supabase/supabase-js'

export const localUsers = [
  { email: 'pawel@silka.test', displayName: 'Paweł (lokalnie)' },
  { email: 'partnerka@silka.test', displayName: 'Partnerka (lokalnie)' },
]

// Disposable local fixtures. This helper refuses hosted URLs and never logs admin keys.
export const localPassword = 'Silka-local-only-2026!'

export function localContext() {
  let status
  try {
    status = JSON.parse(execFileSync('node_modules/.bin/supabase', ['status', '--output', 'json'], {
      encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
    }))
  }
  catch {
    throw new Error('Uruchom lokalny Supabase: npm run db:start.')
  }
  const url = new URL(status.API_URL)
  if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) {
    throw new Error('Operacje testowe są dozwolone tylko na lokalnym Supabase.')
  }
  if (!status.ANON_KEY || !status.SERVICE_ROLE_KEY) throw new Error('Brak konfiguracji lokalnego Supabase.')
  return { url: url.toString().replace(/\/$/, ''), anonKey: status.ANON_KEY, serviceRoleKey: status.SERVICE_ROLE_KEY }
}

export async function ensureLocalUsers(context) {
  const admin = createClient(context.url, context.serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 })
  if (error) throw new Error('Nie udało się odczytać lokalnych kont testowych.')
  const ids = []
  for (const fixture of localUsers) {
    const existing = data.users.find(user => user.email === fixture.email)
    if (existing) {
      ids.push(existing.id)
      continue
    }
    const result = await admin.auth.admin.createUser({
      email: fixture.email,
      password: localPassword,
      email_confirm: true,
      user_metadata: { display_name: fixture.displayName },
    })
    if (result.error || !result.data.user) throw new Error('Nie udało się utworzyć lokalnego konta testowego.')
    ids.push(result.data.user.id)
  }
  return ids
}
