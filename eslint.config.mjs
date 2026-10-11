import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({
  ignores: ['shared/types/database.generated.ts', 'coverage/**'],
}, {
  rules: {
    'vue/multi-word-component-names': 'off',
    'vue/html-self-closing': ['error', { html: { void: 'always', normal: 'always', component: 'always' } }],
  },
})
