import type { AiRequest, AiResponse, AiSelection } from '#shared/schemas/ai'
import type { PlanInput } from '#shared/schemas/plans'
import { fetchAi, applyAi } from '~/services/ai'
import { fetchPlan } from '~/services/plans'
import { buildAiPrompt, parseAiResponse, progressionPlan, planChanges } from '~/domain/ai'

export function useAiConsultation(id: string) {
  const client = usePlanClient()
  const { user } = useAuthState()
  const request = ref<AiRequest | null>(null)
  const source = ref('')
  const response = ref<AiResponse | null>(null)
  const selections = ref<Record<number, string>>({})
  const proposal = ref<PlanInput | null>(null)
  const busy = ref(false)
  const loading = ref(true)
  const error = ref('')
  const message = ref('')
  const confirm = ref(false)
  const { notice: copyNotice, copyWithNotice } = useCopyNotice()
  const prompt = computed(() => request.value ? buildAiPrompt(request.value) : '')
  const targets = computed(() => request.value?.context.plan?.workouts.flatMap((workout, wi) => workout.exercises.flatMap((exercise, ei) => exercise.sets.map((series, si) => ({
    value: `${wi}:${ei}:${si}`, exerciseId: exercise.exerciseId, workoutIndex: wi, exerciseIndex: ei, setIndex: si,
    label: `${workout.name} · ćw. ${ei + 1} · seria ${si + 1} · ${series.targetWeightKg === null ? 'brak celu' : `${String(series.targetWeightKg).replace('.', ',')} kg`}`,
  })))) ?? [])
  const choices = computed<AiSelection[]>(() => Object.entries(selections.value).flatMap(([index, value]) => {
    const target = targets.value.find(item => item.value === value)
    return target ? [{ suggestionIndex: Number(index), workoutIndex: target.workoutIndex, exerciseIndex: target.exerciseIndex, setIndex: target.setIndex }] : []
  }))
  const changes = computed(() => proposal.value ? planChanges(request.value?.context.plan ?? null, proposal.value) : [])
  async function run(work: () => Promise<void>) {
    if (busy.value) return
    busy.value = true
    error.value = ''
    try {
      await work()
    }
    catch (cause) { error.value = cause instanceof Error ? cause.message : 'Nie udało się obsłużyć konsultacji.' }
    finally { busy.value = false }
  }
  async function load() {
    loading.value = true
    await run(async () => {
      request.value = await fetchAi(client, id)
    })
    loading.value = false
  }
  async function checkCurrent() {
    const current = request.value
    if (!current || !current.planId || !['replace_plan', 'suggest_progression'].includes(current.action)) return
    const plan = await fetchPlan(client, current.planId)
    if (plan.archived || plan.revision !== current.baseRevision) throw new Error('Plan zmienił się od przygotowania promptu. Rozpocznij nową konsultację.')
  }
  function cancelPreview() {
    response.value = null
    proposal.value = null
    selections.value = {}
    confirm.value = false
  }
  async function validate() {
    cancelPreview()
    await run(async () => {
      if (!request.value) return
      const parsed = parseAiResponse(source.value, request.value)
      await checkCurrent()
      response.value = parsed
      proposal.value = 'plan' in parsed.payload ? parsed.payload.plan : null
    })
  }
  function previewProgression() {
    error.value = ''
    try {
      if (request.value && response.value) proposal.value = progressionPlan(request.value, response.value, choices.value)
    }
    catch (cause) { error.value = cause instanceof Error ? cause.message : 'Niepoprawny wybór serii.' }
  }
  watch(selections, () => {
    if (response.value?.action === 'suggest_progression') proposal.value = null
  }, { deep: true })
  watch(source, cancelPreview)
  async function accept() {
    const current = request.value
    const parsed = response.value
    if (!current || !parsed) return
    await run(async () => {
      const result = await applyAi(client, current.id, parsed, choices.value)
      request.value = { ...current, applied: true, result, response: parsed }
      confirm.value = false
      source.value = ''
      message.value = result.planId ? 'Zmiany zapisane na koncie.' : 'Analiza zachowana. Plan i historia pozostają bez zmian.'
    })
  }
  async function copy() {
    message.value = await copyWithNotice(prompt.value) ? 'Prompt skopiowany. Wklej go do wybranego AI.' : 'Schowek jest niedostępny. Zaznacz i skopiuj tekst promptu ręcznie.'
  }
  watch(() => user.value?.id, () => {
    request.value = null
    source.value = ''
    cancelPreview()
  })
  onMounted(() => {
    void load()
  })
  return { request, source, response, selections, proposal, busy, loading, error, message, confirm, prompt, targets, changes, load, validate, cancelPreview, previewProgression, accept, copy, copyNotice }
}
