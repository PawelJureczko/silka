import type { WorkoutExercise } from '#shared/schemas/workouts'
import { fetchExerciseProgress } from '~/services/progress'
import { applySuggestedWeight, suggestWeight } from '~/domain/progress'
import { useWorkoutSync } from '~/composables/useWorkoutSync'

export function useWorkoutSuggestion(exercise: MaybeRefOrGetter<WorkoutExercise>, startedAt: string, sessionId: string) {
  const client = usePlanClient()
  const sync = useWorkoutSync()
  const { user } = useAuthState()
  const variant = () => ({ ...toValue(exercise), exerciseId: toValue(exercise).exerciseId })
  const history = useAsyncData(() => `suggestion:${user.value?.id}:${sessionId}:${toValue(exercise).id}`, () => fetchExerciseProgress(client, variant(), startedAt), { lazy: true, immediate: false })
  const suggestion = computed(() => history.data.value ? suggestWeight(toValue(exercise), history.data.value) : null)
  async function apply(weightKg: number, expected: { id: string, weightKg: number | null, reps: number | null }[]) {
    return sync.update((session) => {
      applySuggestedWeight(session, sessionId, toValue(exercise).id, expected, weightKg)
    })
  }
  return { history, suggestion, apply, saving: sync.saving, error: sync.error }
}
