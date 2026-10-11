<script setup lang="ts">
import type { AiAction } from '#shared/schemas/ai'
import { aiActionLabels } from '~/domain/ai'
import { prepareAi, recentAi } from '~/services/ai'
import { fetchPlans, fetchPlan } from '~/services/plans'

useHead({ title: 'Konsultacja AI · Siłka' })
const client = usePlanClient()
const { user } = useAuthState()
const action = ref<AiAction>('create_plan')
const planId = ref(typeof useRoute().query.plan === 'string' ? String(useRoute().query.plan) : '')
if (planId.value) action.value = 'replace_plan'
const historyLimit = ref(10)
const instructions = ref('')
const busy = ref(false)
const error = ref('')
let attempt: { key: string, id: string } | null = null
const { data, status, error: loadError, refresh } = await useAsyncData(() => `ai-start:${user.value?.id}`, async () => {
  const [plans, requests] = await Promise.all([fetchPlans(client, false, 0), recentAi(client)])
  const selected = planId.value && !plans.some(plan => plan.id === planId.value) ? await fetchPlan(client, planId.value) : null
  return { plans: selected ? [{ id: selected.id, name: selected.plan.name }, ...plans] : plans, requests }
}, { lazy: true })
const needsPlan = computed(() => action.value === 'replace_plan' || action.value === 'suggest_progression')
watch(action, () => {
  planId.value = ''
})
async function prepare() {
  if (busy.value) return
  busy.value = true
  error.value = ''
  const selected = needsPlan.value ? planId.value : null
  const key = JSON.stringify([action.value, selected, historyLimit.value, instructions.value])
  if (attempt?.key !== key) attempt = { key, id: crypto.randomUUID() }
  try {
    const result = await prepareAi(client, attempt.id, action.value, selected, historyLimit.value, instructions.value)
    await navigateTo(`/plans/ai/${result.id}`)
  }
  catch (cause) { error.value = cause instanceof Error ? cause.message : 'Nie udało się przygotować konsultacji.' }
  finally { busy.value = false }
}
</script>

<template>
  <div>
    <NuxtLink
      to="/plans"
      class="mb-4 inline-flex min-h-11 items-center text-sm text-secondary"
    >← Plany</NuxtLink>
    <UiPageHeading
      title="Druga perspektywa."
      description="Przygotuj kontekst. Skopiuj prompt. Wróć z odpowiedzią do sprawdzenia."
    />
    <div class="grid items-start gap-8 min-[850px]:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
      <form
        class="space-y-5"
        :aria-busy="busy"
        @submit.prevent="prepare"
      >
        <label class="block text-sm">Cel konsultacji<select
          v-model="action"
          class="field mt-2"
          :disabled="busy"
        ><option
          v-for="(label, value) in aiActionLabels"
          :key="value"
          :value="value"
        >{{ label }}</option></select></label>
        <label
          v-if="needsPlan"
          class="block text-sm"
        >Plan do konsultacji<select
          v-model="planId"
          class="field mt-2"
          required
          :disabled="busy || status === 'pending'"
        ><option
          value=""
          disabled
        >Wybierz zapisany plan</option><option
          v-for="plan in data?.plans"
          :key="plan.id"
          :value="plan.id"
        >{{ plan.name }}</option></select></label>
        <p
          v-if="needsPlan && data?.plans.length === 20"
          class="text-sm text-secondary"
        >
          Lista obejmuje 20 ostatnio edytowanych planów. Starszy plan otwórz w edytorze i wybierz konsultację.
        </p>
        <label class="block text-sm">Historia w prompcie<select
          v-model="historyLimit"
          class="field mt-2"
          :disabled="busy"
        ><option :value="0">Bez historii</option><option :value="10">Do 10 ostatnich zakończonych treningów</option><option :value="20">Do 20 ostatnich zakończonych treningów</option></select></label>
        <label class="block text-sm">Co chcesz ustalić? <span class="text-secondary">Opcjonalnie</span><textarea
          v-model="instructions"
          class="field mt-2 py-3"
          rows="4"
          maxlength="2000"
          :disabled="busy"
          placeholder="Cel, dostępny sprzęt, dni treningowe…"
        /></label>
        <p class="text-sm leading-relaxed text-secondary">
          Prompt zawiera katalog ćwiczeń, wybrany plan i zakres wyników. Pomija e-mail, ID konta, opis planu i prywatne notatki. Zobaczysz cały tekst przed skopiowaniem. Samodzielnie zdecydujesz, któremu AI go przekazać.
        </p>
        <p
          v-if="error || loadError"
          role="alert"
          class="text-sm text-red-300"
        >
          {{ error || 'Nie udało się pobrać planów i konsultacji.' }}
        </p>
        <UiBaseButton
          type="submit"
          :busy="busy"
          :disabled="Boolean(loadError) || (needsPlan && !planId)"
        >
          Przygotuj prompt
        </UiBaseButton>
        <UiBaseButton
          v-if="loadError"
          variant="secondary"
          @click="refresh()"
        >
          Spróbuj ponownie
        </UiBaseButton>
      </form>
      <section class="ledger-section">
        <h2 class="section-label">
          Wróć do konsultacji
        </h2>
        <p
          v-if="status === 'pending'"
          role="status"
          class="mt-5 text-secondary"
        >
          Odczytywanie konsultacji…
        </p>
        <p
          v-else-if="loadError"
          class="mt-5 text-sm text-secondary"
        >
          Lista konsultacji jest chwilowo niedostępna.
        </p>
        <p
          v-else-if="!data?.requests.length"
          class="mt-5 text-sm leading-relaxed text-secondary"
        >
          Tu pojawią się przygotowane prompty. Możesz wrócić z odpowiedzią po odświeżeniu strony.
        </p>
        <ul
          v-else
          class="mt-4 divide-y divide-white/15"
        >
          <li
            v-for="request in data.requests"
            :key="request.id"
          >
            <NuxtLink
              :to="`/plans/ai/${request.id}`"
              class="flex min-h-16 items-center justify-between gap-4 py-4"
            ><span>{{ aiActionLabels[request.action] }}<span class="mt-1 block text-xs text-secondary">{{ new Intl.DateTimeFormat('pl-PL', { day: 'numeric', month: 'short' }).format(new Date(request.created_at)) }}</span></span><span class="text-xs text-secondary">{{ request.applied_hash ? 'Zatwierdzona' : 'Otwarta' }}</span></NuxtLink>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>
