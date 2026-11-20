<script setup lang="ts">
import type { ExerciseVariant } from '#shared/schemas/progress'
import { exerciseVariantKey } from '~/domain/progress'
import { fetchExerciseInsights } from '~/services/training-stats'
import { loadDecisionLabels } from '~/domain/load-decision'

const props = defineProps<{ variant: ExerciseVariant, timezone: string }>()
const client = usePlanClient()
const { user } = useAuthState()
const page = ref(0)
watch(() => exerciseVariantKey(props.variant), () => {
  page.value = 0
}, { flush: 'sync' })
const { data, status, error, refresh } = await useAsyncData(() => `exercise-insights:${user.value?.id}`, () => fetchExerciseInsights(client, props.variant, page.value), { lazy: true, watch: [() => exerciseVariantKey(props.variant), page] })
const date = (value: string) => new Intl.DateTimeFormat('pl-PL', { day: 'numeric', month: 'short', year: 'numeric', timeZone: props.timezone }).format(new Date(value))
function weight(value: number | null) {
  if (value === null) return 'Ciężar nieznany'
  return `${new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 2 }).format(value)} kg${props.variant.weightConvention === 'per_hand' ? ' / rękę' : props.variant.weightConvention === 'assistance' ? ' asysty' : props.variant.weightConvention === 'bodyweight' ? ' dodatkowo' : ''}`
}
</script>

<template>
  <section class="ledger-section mt-7">
    <h3 class="text-lg font-semibold">
      Rekordy przy tym samym ciężarze
    </h3>
    <p
      v-if="status === 'pending'"
      role="status"
      class="mt-4 text-secondary"
    >
      Odczytywanie rekordów i decyzji…
    </p>
    <div
      v-else-if="error"
      class="mt-4 space-y-3"
    >
      <p role="alert">
        Nie udało się pobrać rekordów i decyzji.
      </p><UiBaseButton
        variant="secondary"
        @click="refresh()"
      >
        Spróbuj ponownie
      </UiBaseButton>
    </div>
    <template v-else-if="data">
      <p class="mt-2 text-xs leading-relaxed text-secondary">
        Najwięcej powtórzeń w jednej serii roboczej przy dokładnie takim samym zapisanym ciężarze. Cała ukończona historia tego wariantu; przy remisie pokazujemy najnowszy wynik. Nieznany ciężar jest osobną grupą, bez porównania obciążenia.
      </p>
      <p
        v-if="!data.records.length"
        class="mt-4 text-secondary"
      >
        Brak wykonanych serii roboczych.
      </p>
      <ul class="mt-3 divide-y divide-white/15">
        <li
          v-for="record in data.records.slice(0, 20)"
          :key="String(record.weightKg)"
          class="py-3"
        >
          <div class="flex flex-wrap items-baseline justify-between gap-2">
            <span class="text-sm">{{ weight(record.weightKg) }}</span><strong class="text-xl tabular-nums">{{ record.reps }} <span class="text-sm font-normal text-secondary">powt.</span></strong>
          </div><NuxtLink
            :to="`/workouts/${record.sessionId}`"
            class="inline-flex min-h-11 items-center text-xs text-secondary underline underline-offset-4"
          >{{ date(record.startedAt) }} · zobacz sesję</NuxtLink>
        </li>
      </ul>
      <div
        v-if="page || data.records.length > 20"
        class="mt-3 flex items-center justify-between gap-2"
      >
        <UiBaseButton
          variant="secondary"
          :disabled="!page"
          @click="page--"
        >
          Wstecz
        </UiBaseButton><span class="text-xs text-secondary">Strona {{ page + 1 }}</span><UiBaseButton
          variant="secondary"
          :disabled="data.records.length <= 20"
          @click="page++"
        >
          Dalej
        </UiBaseButton>
      </div>
      <section class="ledger-section mt-7">
        <h3 class="text-lg font-semibold">
          Twoje decyzje i wyniki
        </h3>
        <p class="mt-2 text-xs leading-relaxed text-secondary">
          Do 12 ostatnich ukończonych sesji tego wariantu. Decyzja dotyczy kolejnego treningu; wyniki opisują sesję, w której ją zapisano. Starsze wpisy domyślnie mają „Zostaw”. To obecnie zapisane wybory, bez dziennika późniejszych zmian decyzji.
        </p>
        <p
          v-if="!data.decisions.length"
          class="mt-4 text-secondary"
        >
          Brak decyzji w ukończonych sesjach.
        </p>
        <ol class="mt-3 divide-y divide-white/15">
          <li
            v-for="decision in data.decisions"
            :key="decision.sessionId"
            class="py-4"
          >
            <div class="flex flex-wrap items-center justify-between gap-2">
              <NuxtLink
                :to="`/workouts/${decision.sessionId}`"
                class="inline-flex min-h-11 items-center text-sm underline underline-offset-4"
              >{{ date(decision.startedAt) }}</NuxtLink><strong class="text-sm">{{ decision.decision ? loadDecisionLabels[decision.decision] : 'Niejednoznaczna decyzja' }}</strong>
            </div><p
              v-if="!decision.sets.length"
              class="text-sm text-secondary"
            >
              Brak wykonanych serii roboczych.
            </p><ul class="space-y-1 text-sm text-secondary">
              <li
                v-for="(set, index) in decision.sets"
                :key="index"
              >
                {{ set.reps }} powt. × {{ weight(set.weightKg) }}
              </li>
            </ul>
          </li>
        </ol>
      </section>
    </template>
  </section>
</template>
