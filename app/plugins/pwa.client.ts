import { initializePwa } from '~/services/pwa'

export default defineNuxtPlugin(() => {
  const state = usePwaState()
  const actions = initializePwa(state.value, useRuntimeConfig().app.buildId, import.meta.dev)
  return { provide: { pwa: actions } }
})
