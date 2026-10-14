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
const createMode = ref<'intake' | 'history'>('intake')
const isIntake = computed(() => action.value === 'create_plan' && createMode.value === 'intake')
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
async function prepare(text = instructions.value, limit = historyLimit.value) {
  if (busy.value) return
  busy.value = true
  error.value = ''
  const selected = needsPlan.value ? planId.value : null
  const owner = user.value?.id
  const key = JSON.stringify([owner, action.value, selected, limit, text])
  if (attempt?.key !== key) attempt = { key, id: crypto.randomUUID() }
  try {
    const result = await prepareAi(client, attempt.id, action.value, selected, limit, text)
    if (user.value?.id !== owner) return
    await navigateTo(`/plans/ai/${result.id}`)
  }
  catch (cause) { error.value = cause instanceof Error ? cause.message : 'Nie udało się przygotować konsultacji.' }
  finally { busy.value = false }
}
watch(() => user.value?.id, () => {
  instructions.value = ''
  planId.value = ''
  attempt = null
})
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
      <div class="min-w-0 space-y-5">
        <label class="block text-sm">Cel konsultacji<select
          v-model="action"
          class="field mt-2"
          :disabled="busy"
        ><option
          v-for="(label, value) in aiActionLabels"
          :key="value"
          :value="value"
        >{{ label }}</option></select></label>
        <fieldset
          v-if="action === 'create_plan'"
          :disabled="busy"
          class="space-y-2"
        >
          <legend class="mb-2 text-sm">
            Jak chcesz zacząć?
          </legend>
          <label class="flex min-h-12 cursor-pointer items-center gap-3 rounded-md border border-secondary/70 px-3 py-3 has-checked:bg-interactive"><input
            v-model="createMode"
            type="radio"
            value="intake"
            class="size-4 shrink-0 accent-accent"
          /><span>Stwórz nowy plan<span class="mt-1 block text-sm text-secondary">Ankieta o Tobie, bez historii treningów</span></span></label>
          <label class="flex min-h-12 cursor-pointer items-center gap-3 rounded-md border border-secondary/70 px-3 py-3 has-checked:bg-interactive"><input
            v-model="createMode"
            type="radio"
            value="history"
            class="size-4 shrink-0 accent-accent"
          /><span>Ułóż na bazie historii<span class="mt-1 block text-sm text-secondary">Wybierz zakres dotychczasowych wyników</span></span></label>
        </fieldset>
        <PlansIntake
          v-if="isIntake"
          :key="user?.id"
          :busy="busy"
          :unavailable="Boolean(loadError)"
          @prepare="prepare($event, 0)"
        />
        <form
          v-else
          class="space-y-5"
          :aria-busy="busy"
          @submit.prevent="prepare()"
        >
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
          <UiBaseButton
            type="submit"
            :busy="busy"
            :disabled="Boolean(loadError) || (needsPlan && !planId)"
          >
            Przygotuj prompt
          </UiBaseButton>
        </form>
        <p
          v-if="error || loadError"
          role="alert"
          class="text-sm text-red-300"
        >
          {{ error || 'Nie udało się pobrać planów i konsultacji.' }}
        </p>
        <UiBaseButton
          v-if="loadError"
          variant="secondary"
          @click="refresh()"
        >
          Spróbuj ponownie
        </UiBaseButton>
      </div>
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
