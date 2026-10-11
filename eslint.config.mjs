import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({
  ignores: ['shared/types/database.generated.ts', 'coverage/**', '.nuxt-pwa-test/**'],
}, {
  files: ['app/service-worker.js'],
  languageOptions: { globals: { self: 'readonly', caches: 'readonly', Request: 'readonly' } },
}, {
  rules: {
    'vue/multi-word-component-names': 'off',
    'vue/html-self-closing': ['error', { html: { void: 'always', normal: 'always', component: 'always' } }],
  },
})
