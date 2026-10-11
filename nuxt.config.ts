import tailwindcss from '@tailwindcss/vite'
import { publicSupabaseConfigSchema } from './shared/schemas/config'

const supabaseUrl = process.env.NUXT_PUBLIC_SUPABASE_URL ?? ''
const supabaseKey = process.env.NUXT_PUBLIC_SUPABASE_KEY ?? ''
if ((supabaseUrl || supabaseKey) && !publicSupabaseConfigSchema.safeParse({ url: supabaseUrl, key: supabaseKey }).success) {
  throw new Error('Ustaw poprawny URL Supabase i publiczny klucz publishable/anon. Klucze administracyjne są niedozwolone.')
}

export default defineNuxtConfig({
  modules: ['@nuxt/eslint'],
  ssr: false,
  devtools: { enabled: false },
  app: {
    head: {
      title: 'Siłka — Twój trening, Twoje tempo',
      htmlAttrs: { lang: 'pl' },
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'theme-color', content: '#09090B' },
        { name: 'description', content: 'Twoje plany treningowe i postępy w jednym miejscu.' },
        { name: 'robots', content: 'noindex, nofollow' },
      ],
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    },
  },
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    public: { supabaseUrl: '', supabaseKey: '' },
  },
  buildDir: process.env.SILKA_TEST_BUILD_DIR || '.nuxt',
  compatibilityDate: '2026-10-11',
  vite: { plugins: [tailwindcss()] },
  typescript: { strict: true, typeCheck: false },
  eslint: {
    config: { stylistic: { semi: false, quotes: 'single', commaDangle: 'always-multiline' } },
  },
})
