import { fetchExerciseProgress, fetchProgressOverview, fetchWorkoutHistory } from '~/services/progress'
import { exerciseVariantKey, regularity } from '~/domain/progress'
import { preferencesSchema } from '#shared/schemas/profile'
import type { ExerciseProgress } from '#shared/schemas/progress'

export async function useProgress() {
  onMounted(() => {
    void refresh()
  })
  const client = usePlanClient()
  const { user } = useAuthState()
  const profile = useProfile()
  const timezone = computed(() => profile.data.value?.timezone ?? 'Europe/Warsaw')
  const target = computed(() => preferencesSchema.parse(profile.data.value?.preferences ?? {}).weeklyTarget)
  const overview = useAsyncData(() => `progress-overview:${user.value?.id}`, () => fetchProgressOverview(client, timezone.value), { lazy: true, watch: [timezone] })
  const page = ref(0)
  const filter = ref<'all' | 'completed' | 'abandoned'>('all')
  const days = ref(0)
  watch([filter, days], () => {
    page.value = 0
  }, { flush: 'sync' })
  const history = useAsyncData(() => `progress-history:${user.value?.id}`, () => fetchWorkoutHistory(client, page.value, filter.value, days.value), { lazy: true, watch: [page, filter, days] })
  const selection = ref('')
  const selected = computed(() => overview.data.value?.exercises.find(item => exerciseVariantKey(item) === selection.value) ?? null)
  watch(() => overview.data.value?.exercises, (items) => {
    if (!items?.some(item => exerciseVariantKey(item) === selection.value))
      selection.value = items?.[0] ? exerciseVariantKey(items[0]) : ''
  }, { immediate: true })
  const exercise = useAsyncData<ExerciseProgress | null>(() => `progress-exercise:${user.value?.id}`, () => selected.value ? fetchExerciseProgress(client, selected.value) : Promise.resolve(null), { lazy: true, watch: [selection] })
  const consistency = computed(() => overview.data.value ? regularity(overview.data.value.weeks, target.value) : null)
  async function refresh() {
    await Promise.all([profile.refresh(), overview.refresh(), history.refresh(), exercise.refresh()])
  }
  await Promise.all([profile, overview, history, exercise])
  return { overview, history, exercise, selected, selection, page, filter, days, timezone, target, consistency, refresh }
}
