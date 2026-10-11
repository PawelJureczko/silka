import { fetchWorkoutDashboard } from '~/services/workouts'

export async function useWorkoutDashboard(timezone: MaybeRefOrGetter<string>) {
  const client = usePlanClient()
  const { user } = useAuthState()
  const workout = useWorkoutSync()
  const result = await useAsyncData(() => `workout-dashboard:${user.value?.id}`, () => fetchWorkoutDashboard(client, toValue(timezone)), { lazy: true, watch: [() => toValue(timezone)] })
  const localPending = computed(() => workout.journal.value && (workout.journal.value.start || workout.journal.value.queue.length || workout.journal.value.conflict || workout.journal.value.session?.status === 'active') ? workout.journal.value.sessionId : null)
  const resumeId = computed(() => localPending.value ?? result.data.value?.activeId ?? null)
  const starting = ref(false)
  async function refresh() {
    await workout.loadLocal()
    await result.refresh()
  }
  async function begin(workoutId: string) {
    if (!result.data.value?.plan || starting.value)
      return
    starting.value = true
    try {
      const id = await workout.begin(workoutId, result.data.value.plan.revision)
      if (id)
        await navigateTo(`/workouts/${id}`)
    }
    finally {
      starting.value = false
    }
  }
  onMounted(() => {
    void refresh()
  })
  return { ...result, ...workout, queryError: result.error, refresh, resumeId, starting, begin }
}
