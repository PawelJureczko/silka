import type { User } from '@supabase/supabase-js'

export function useAuthState() {
  return {
    user: useState<User | null>('auth:user', () => null),
    ready: useState('auth:ready', () => false),
    pending: useState('auth:pending', () => false),
  }
}
