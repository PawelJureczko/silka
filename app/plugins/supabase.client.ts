import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '#shared/types/database.generated'
import { publicSupabaseConfigSchema } from '#shared/schemas/config'

export default defineNuxtPlugin(async (nuxtApp) => {
  const config = useRuntimeConfig().public
  const parsed = publicSupabaseConfigSchema.safeParse({ url: config.supabaseUrl, key: config.supabaseKey })
  const { user, ready } = useAuthState()
  const client: SupabaseClient<Database> | null = parsed.success
    ? createClient<Database>(parsed.data.url, parsed.data.key, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, storageKey: 'silka-auth' },
      })
    : null

  if (client) {
    client.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null
      if (user.value?.id !== nextUser?.id) clearNuxtData()
      user.value = nextUser
      if (ready.value && !nextUser && nuxtApp.$router.currentRoute.value.path !== '/login') {
        void nuxtApp.runWithContext(() => navigateTo('/login', { replace: true }))
      }
    })
    try {
      const { data, error } = await client.auth.getSession()
      user.value = error ? null : data.session?.user ?? null
    }
    catch {
      user.value = null
    }
  }
  ready.value = true
  return { provide: { supabase: client } }
})
