import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '#shared/types/database.generated'
import { publicSupabaseConfigSchema } from '#shared/schemas/config'
import { readStoredIdentity } from '~/services/auth'

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig().public
  const parsed = publicSupabaseConfigSchema.safeParse({ url: config.supabaseUrl, key: config.supabaseKey })
  const { user, ready } = useAuthState()
  const client: SupabaseClient<Database> | null = parsed.success
    ? createClient<Database>(parsed.data.url, parsed.data.key, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, storageKey: 'silka-auth' },
      })
    : null

  if (client) {
    // Cached identity only opens this device's local journal; API access still requires Auth and RLS.
    user.value = readStoredIdentity()
    client.auth.onAuthStateChange((event, session) => {
      const nextUser = session?.user ?? (event === 'INITIAL_SESSION' ? readStoredIdentity() : null)
      if (user.value?.id !== nextUser?.id) clearNuxtData()
      user.value = nextUser
      if (ready.value && !nextUser && nuxtApp.$router.currentRoute.value.path !== '/login') {
        void nuxtApp.runWithContext(() => navigateTo('/login', { replace: true }))
      }
    })
    void (async () => {
      try {
        const { data, error } = await client.auth.getSession()
        user.value = error ? readStoredIdentity() : data.session?.user ?? readStoredIdentity()
      }
      catch {
        user.value = readStoredIdentity()
      }
    })()
  }
  ready.value = true
  return { provide: { supabase: client } }
})
