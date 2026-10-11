import { writeFileSync } from 'node:fs'
import { ensureLocalUsers, localContext } from './local-supabase.mjs'

try {
  const context = localContext()
  await ensureLocalUsers(context)
  writeFileSync('.env.local', `NUXT_PUBLIC_SUPABASE_URL=${context.url}\nNUXT_PUBLIC_SUPABASE_KEY=${context.anonKey}\n`, { flag: 'wx', mode: 0o600 })
  console.log('Lokalne konta są gotowe. Zapisano .env.local z publiczną konfiguracją.')
}
catch (error) {
  if (error.code === 'EEXIST') {
    console.log('Lokalne konta są gotowe. Istniejący .env.local pozostawiono bez zmian.')
  }
  else {
    console.error(error.message)
    process.exitCode = 1
  }
}
