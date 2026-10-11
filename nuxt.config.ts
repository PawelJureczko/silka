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
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-title', content: 'Siłka' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'manifest', href: '/manifest.webmanifest' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/icons/apple-touch-icon.png' },
      ],
    },
  },
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    public: { supabaseUrl: '', supabaseKey: '' },
  },
  buildDir: process.env.SILKA_TEST_BUILD_DIR || '.nuxt',
  experimental: { checkOutdatedBuildInterval: false, emitRouteChunkError: 'manual' },
  compatibilityDate: '2026-10-11',
  nitro: { preset: 'static' },
  vite: { plugins: [tailwindcss()] },
  typescript: { strict: true, typeCheck: false },
  eslint: {
    config: { stylistic: { semi: false, quotes: 'single', commaDangle: 'always-multiline' } },
  },
})
