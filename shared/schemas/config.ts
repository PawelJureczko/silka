import { z } from 'zod'

function isPublicKey(key: string): boolean {
  if (/^sb_publishable_[A-Za-z0-9_-]{20,}$/.test(key)) return true
  try {
    const payload = key.split('.')[1]
    if (!payload) return false
    const claims: unknown = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
    return z.object({ role: z.literal('anon') }).safeParse(claims).success
  }
  catch {
    return false
  }
}

export const publicSupabaseConfigSchema = z.object({
  url: z.url().refine((value) => {
    if (!URL.canParse(value)) return false
    const url = new URL(value)
    return url.protocol === 'https:' || (url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname))
  }, 'Supabase wymaga HTTPS; HTTP jest dozwolone wyłącznie lokalnie.'),
  key: z.string().refine(isPublicKey, 'Wymagany jest publiczny klucz publishable lub anon.'),
})
