import { z } from 'zod'
import type { Workout } from '#shared/schemas/workouts'
import { fetchWorkout } from '~/services/workouts'

export function useWorkoutPage(id: string) {
  const sync = useWorkoutSync()
  const client = usePlanClient()
  const remote = ref<Workout | null>(null)
  const loading = ref(true)
  const pageError = ref('')
  const local = computed(() => sync.journal.value?.sessionId === id ? sync.journal.value : null)
  const session = computed(() => local.value?.session ?? remote.value)
  const { user } = useAuthState()
  async function load(discard = false) {
    loading.value = !session.value || discard
    pageError.value = ''
    try {
      if (!z.uuid().safeParse(id).success)
        throw new Error('Nieprawidłowy adres treningu.')
      await sync.loadLocal()
      if (local.value && (local.value.start || local.value.queue.length || local.value.conflict) && !discard) {
        void sync.sync()
        return
      }
      const owner = user.value?.id
      const found = await fetchWorkout(client, id)
      if (user.value?.id !== owner)
        return
      if (found.status === 'active' || local.value)
        await sync.adopt(found, discard)
      else
        remote.value = found
    }
    catch (cause) {
      pageError.value = cause instanceof Error ? cause.message : 'Nie udało się otworzyć treningu.'
    }
    finally {
      loading.value = false
    }
  }
  const resume = () => {
    if (document.visibilityState === 'visible')
      void load()
  }
  onMounted(() => {
    void load()
    window.addEventListener('focus', resume)
    document.addEventListener('visibilitychange', resume)
  })
  onBeforeUnmount(() => {
    window.removeEventListener('focus', resume)
    document.removeEventListener('visibilitychange', resume)
  })
  watch(() => user.value?.id, () => {
    remote.value = null
  })
  return { ...sync, session, local, loading, pageError, load }
}
