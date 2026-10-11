import { workoutChannel } from '~/services/workout-storage'

export default defineNuxtPlugin((nuxtApp) => {
  if (!nuxtApp.$supabase)
    return
  const { user } = useAuthState()
  const workout = useWorkoutSync()
  watch(() => user.value?.id, () => {
    void workout.loadLocal().then(() => workout.sync())
  }, { immediate: true })
  const resume = () => {
    if (document.visibilityState === 'visible')
      void workout.loadLocal().then(() => workout.sync())
  }
  window.addEventListener('online', resume)
  window.addEventListener('focus', resume)
  document.addEventListener('visibilitychange', resume)
  window.addEventListener('beforeunload', (event) => {
    if (workout.saving.value > 0) {
      event.preventDefault()
      event.returnValue = ''
    }
  })
  workoutChannel().addEventListener('message', resume)
  window.setInterval(() => {
    if (document.visibilityState === 'visible')
      void workout.sync()
  }, 15000)
})
