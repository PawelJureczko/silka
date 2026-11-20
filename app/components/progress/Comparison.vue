<script setup lang="ts">
import { fetchComparisonOptions, fetchSessionComparison } from '~/services/training-stats'
import { compareSessions, recordedStatsSet } from '~/domain/training-stats'

const props = defineProps<{ timezone: string }>()
const client = usePlanClient()
const { user } = useAuthState()
const options = await useAsyncData(() => `stats-options:${user.value?.id}`, () => fetchComparisonOptions(client), { lazy: true })
const selectedId = ref('')
watch(options.data, (rows) => {
  if (!rows?.some(row => row.id === selectedId.value)) selectedId.value = rows?.[0]?.id ?? ''
}, { immediate: true })
const selected = computed(() => options.data.value?.find(row => row.id === selectedId.value))
const sessions = await useAsyncData(() => `stats-comparison:${user.value?.id}`, () => selected.value?.source_workout_id ? fetchSessionComparison(client, selected.value.source_workout_id, selected.value.plan_id) : Promise.resolve([]), { lazy: true, watch: [selectedId] })
const current = computed(() => sessions.data.value?.[0])
const previous = computed(() => sessions.data.value?.[1] ?? null)
const rows = computed(() => current.value ? compareSessions(current.value, previous.value) : [])
const removed = computed(() => previous.value?.workout_exercises.filter(item => !rows.value.some(row => row.matched && row.exercise.exercise_id === item.exercise_id)) ?? [])
const date = (value: string) => new Intl.DateTimeFormat('pl-PL', { day: 'numeric', month: 'short', year: 'numeric', timeZone: props.timezone }).format(new Date(value))
const duration = (start: string, end: string) => Math.max(0, Math.round((Date.parse(end) - Date.parse(start)) / 60000))
</script>

<template>
  <section class="ledger-section min-w-0">
    <h2 class="text-xl font-semibold">
      Trening do treningu
    </h2>
    <p class="mt-2 text-sm text-secondary">
      Dwie ostatnie ukończone sesje tej samej jednostki i planu.
    </p>
    <p
      v-if="options.status.value === 'pending'"
      role="status"
      class="mt-5 text-secondary"
    >
      Odczytywanie jednostek…
    </p>
    <div
      v-else-if="options.error.value"
      class="mt-5 space-y-3"
    >
      <p role="alert">
        Nie udało się pobrać jednostek.
      </p><UiBaseButton
        variant="secondary"
        @click="options.refresh()"
      >
        Spróbuj ponownie
      </UiBaseButton>
    </div>
    <p
      v-else-if="!options.data.value?.length"
      class="mt-5 text-secondary"
    >
      Zakończ trening rozpoczęty z planu. Porównanie pojawi się tutaj; sesje bez przypisanej jednostki pozostają w historii.
    </p>
    <template v-else>
      <label class="mt-5 block text-sm text-secondary">Jednostka<select
        v-model="selectedId"
        class="field mt-2"
      ><option
        v-for="option in options.data.value"
        :key="option.id"
        :value="option.id"
      >{{ option.workout_name_snapshot }} · {{ option.plan_name_snapshot }}</option></select></label>
      <p class="mt-2 text-xs text-secondary">
        Jednostki z ostatnich 60 ukończonych sesji z planu.
      </p>
      <p
        v-if="sessions.status.value === 'pending'"
        role="status"
        class="mt-5 text-secondary"
      >
        Odczytywanie porównania…
      </p>
      <div
        v-else-if="sessions.error.value"
        class="mt-5 space-y-3"
      >
        <p role="alert">
          Nie udało się pobrać porównania.
        </p><UiBaseButton
          variant="secondary"
          @click="sessions.refresh()"
        >
          Spróbuj ponownie
        </UiBaseButton>
      </div>
      <template v-else-if="current">
        <div class="mt-6 grid grid-cols-2 gap-4 border-b border-white/15 pb-5 text-sm">
          <div>
            <p class="text-secondary">
              Poprzednio
            </p><NuxtLink
              v-if="previous"
              :to="`/workouts/${previous.id}`"
              class="inline-flex min-h-11 items-center underline underline-offset-4"
            >{{ date(previous.started_at) }}</NuxtLink><p
              v-else
              class="mt-3"
            >
              Brak wcześniejszej sesji
            </p><p
              v-if="previous"
              class="text-secondary"
            >
              {{ duration(previous.started_at, previous.finished_at) }} min
            </p>
          </div>
          <div>
            <p class="text-secondary">
              Ostatnio
            </p><NuxtLink
              :to="`/workouts/${current.id}`"
              class="inline-flex min-h-11 items-center underline underline-offset-4"
            >{{ date(current.started_at) }}</NuxtLink><p class="text-secondary">
              {{ duration(current.started_at, current.finished_at) }} min
            </p>
          </div>
        </div>
        <p
          v-if="!rows.length"
          class="mt-5 text-secondary"
        >
          Ta sesja nie zawiera ćwiczeń.
        </p>
        <ol class="divide-y divide-white/15">
          <li
            v-for="(row, index) in rows"
            :key="row.exercise.id"
            class="py-5"
          >
            <h3 class="font-semibold">
              <span class="mr-2 text-secondary">{{ String(index + 1).padStart(2, '0') }}</span>{{ row.exercise.exercise_name_snapshot }}
            </h3>
            <p
              v-if="row.ambiguous"
              class="mt-2 text-sm text-secondary"
            >
              Wariant powtarza się w sesji. Nie przypisujemy poprzednich serii automatycznie.
            </p>
            <p
              v-else-if="!row.matched"
              class="mt-2 text-sm text-secondary"
            >
              Brak tego samego wariantu w poprzedniej sesji.
            </p>
            <div
              v-for="(set, setIndex) in row.sets"
              :key="setIndex"
              class="mt-3 text-sm"
            >
              <p class="text-xs text-secondary">
                Seria robocza {{ setIndex + 1 }}
              </p>
              <div class="mt-1 grid grid-cols-2 gap-4">
                <p class="break-words text-secondary">
                  {{ recordedStatsSet(set.previous, row.exercise.weight_convention_snapshot) }}
                </p><p class="break-words">
                  {{ recordedStatsSet(set.current, row.exercise.weight_convention_snapshot) }}
                </p>
              </div>
            </div>
          </li>
        </ol>
        <p
          v-if="removed.length"
          class="text-sm text-secondary"
        >
          Pozycje poprzedniej sesji bez jednoznacznego odpowiednika: {{ removed.map(item => item.exercise_name_snapshot).join(', ') }}.
        </p>
        <p class="mt-4 text-xs leading-relaxed text-secondary">
          Porównujemy serie robocze po kolei, tylko dla tego samego ćwiczenia, sprzętu i konwencji ciężaru. Zmiana zakresów, techniki lub liczby serii wymaga własnej oceny. Mniejsza asysta oznacza mniej wsparcia.
        </p>
      </template>
    </template>
  </section>
</template>
