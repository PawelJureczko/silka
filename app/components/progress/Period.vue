<script setup lang="ts">
import { fetchPeriodStats } from '~/services/training-stats'
import { localDateKey, mondayOf, shiftDate, shiftMonth, monthCells } from '~/domain/training-stats'

const props = defineProps<{ timezone: string }>()
const client = usePlanClient()
const { user } = useAuthState()
const today = computed(() => localDateKey(new Date(), props.timezone))
const month = ref(`${today.value.slice(0, 7)}-01`)
const week = ref(mondayOf(today.value))
const selectedDay = ref(today.value)
watch(month, (value) => {
  selectedDay.value = value
})
watch(() => props.timezone, () => {
  month.value = `${today.value.slice(0, 7)}-01`
  week.value = mondayOf(today.value)
  selectedDay.value = today.value
})
const { data, status, error, refresh } = await useAsyncData(() => `period-stats:${user.value?.id}`, () => fetchPeriodStats(client, month.value, week.value, props.timezone), { lazy: true, watch: [month, week, () => props.timezone] })
const calendar = computed(() => data.value?.calendar.slice(0, 200) ?? [])
const daySessions = computed(() => calendar.value.filter(item => item.day === selectedDay.value))
const cells = computed(() => monthCells(month.value))
const counts = computed(() => new Map(calendar.value.map(item => [item.day, calendar.value.filter(other => other.day === item.day).length])))
const maximum = computed(() => Math.max(1, ...data.value?.muscles.map(item => item.sets) ?? []))
const monthLabel = computed(() => new Intl.DateTimeFormat('pl-PL', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${month.value}T12:00:00Z`)))
const date = (day: string) => new Intl.DateTimeFormat('pl-PL', { day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(`${day}T12:00:00Z`))
const number = (value: number) => new Intl.NumberFormat('pl-PL').format(value)
function dayLabel(day: string) {
  const sessions = calendar.value.filter(item => item.day === day)
  if (sessions.length === 1) return sessions[0]?.name.match(/^(?:Trening\s+)?([ABC])(?:\s|[.·:–-]|$)/i)?.[1]?.toUpperCase() ?? '1 tr.'
  return sessions.length ? `${sessions.length} tr.` : ''
}
function sessionCount(count: number) {
  const noun = count === 1 ? 'trening' : count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 12 || count % 100 > 14) ? 'treningi' : 'treningów'
  return `${count} ${noun}`
}
function delta(current: number, previous: number) {
  const change = current - previous
  return `${change > 0 ? '+' : ''}${number(change)} względem poprzedniego miesiąca (${number(previous)})`
}
</script>

<template>
  <div class="period-layout grid items-start gap-8">
    <section class="ledger-section">
      <h2 class="text-xl font-semibold">
        Miesiąc w liczbach
      </h2>
      <div class="mt-4 flex items-center justify-between gap-3">
        <UiBaseButton
          variant="secondary"
          aria-label="Poprzedni miesiąc"
          :disabled="month <= '2000-01-01'"
          @click="month = shiftMonth(month, -1)"
        >
          ←
        </UiBaseButton><p
          class="text-center font-semibold"
          aria-live="polite"
        >
          {{ monthLabel }}
        </p><UiBaseButton
          variant="secondary"
          aria-label="Następny miesiąc"
          :disabled="month >= `${today.slice(0, 7)}-01`"
          @click="month = shiftMonth(month, 1)"
        >
          →
        </UiBaseButton>
      </div>
      <p class="mt-3 text-xs text-secondary">
        Według daty rozpoczęcia w strefie {{ timezone }}. Tylko ukończone sesje, do chwili odczytu. Bieżący miesiąc jest niepełny.
      </p>
      <p
        v-if="status === 'pending'"
        role="status"
        class="mt-5 text-secondary"
      >
        Odczytywanie podsumowania i kalendarza…
      </p>
      <div
        v-else-if="error"
        class="mt-5 space-y-3"
      >
        <p role="alert">
          Nie udało się pobrać podsumowania.
        </p><UiBaseButton
          variant="secondary"
          @click="refresh()"
        >
          Spróbuj ponownie
        </UiBaseButton>
      </div>
      <template v-else-if="data">
        <p
          v-if="!data.summary.sessions"
          class="mt-5 text-secondary"
        >
          W tym miesiącu nie ma ukończonych treningów.
        </p>
        <dl class="mt-6 divide-y divide-white/15">
          <div class="py-4">
            <dt class="text-sm text-secondary">
              Treningi
            </dt><dd class="ledger-number mt-2 text-5xl text-accent">
              {{ number(data.summary.sessions) }}
            </dd><dd class="mt-3 text-xs text-secondary">
              {{ delta(data.summary.sessions, data.summary.previousSessions) }}
            </dd>
          </div>
          <div class="py-4">
            <dt class="text-sm text-secondary">
              Minuty od rozpoczęcia do zakończenia
            </dt><dd class="mt-2 text-3xl font-bold tabular-nums">
              {{ number(data.summary.minutes) }}
            </dd><dd class="mt-2 text-xs text-secondary">
              {{ delta(data.summary.minutes, data.summary.previousMinutes) }}. Czas obejmuje przerwy.
            </dd>
          </div>
          <div class="py-4">
            <dt class="text-sm text-secondary">
              Wykonane serie robocze
            </dt><dd class="mt-2 text-3xl font-bold tabular-nums">
              {{ number(data.summary.sets) }}
            </dd><dd class="mt-2 text-xs text-secondary">
              {{ delta(data.summary.sets, data.summary.previousSets) }} · {{ number(data.summary.reps) }} powtórzeń łącznie.
            </dd>
          </div>
        </dl>
        <section class="ledger-section mt-3">
          <h3 class="font-semibold">
            Wykonanie planu
          </h3><p class="mt-3 text-xl font-bold tabular-nums">
            {{ number(data.summary.completedPlanned) }} / {{ number(data.summary.planned) }} serii
          </p><p class="mt-2 text-sm text-secondary">
            W zakresie powtórzeń: {{ data.summary.inRange }} · poniżej: {{ data.summary.below }} · powyżej: {{ data.summary.above }}.
          </p><p class="mt-2 text-xs leading-relaxed text-secondary">
            Uwzględniamy zakresy zapisane w sesji. Serie bez zakresu nie wchodzą do mianownika. Rozgrzewki i porzucone sesje są pomijane. To opis wykonania, bez oceny techniki.
          </p>
        </section>
      </template>
    </section>
    <section
      v-if="data && status !== 'pending' && !error"
      class="ledger-section"
    >
      <h2 class="text-xl font-semibold">
        Kalendarz treningów
      </h2>
      <p class="mt-2 text-sm text-secondary">
        {{ monthLabel }}. Wybierz dzień, żeby zobaczyć jednostkę i otworzyć sesję.
      </p>
      <p
        v-if="data.calendar.length > 200"
        class="mt-3 text-sm text-secondary"
      >
        Kalendarz pokazuje pierwsze 200 sesji miesiąca. Podsumowanie powyżej obejmuje wszystkie; pozostałe sesje znajdziesz w historii.
      </p>
      <div
        class="-mx-5 mt-5 grid grid-cols-7 gap-px text-center sm:mx-0 sm:gap-1"
        role="group"
        :aria-label="`Dni: ${monthLabel}`"
      >
        <span
          v-for="label in ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd']"
          :key="label"
          class="pb-2 text-xs text-secondary"
        >{{ label }}</span><template
          v-for="(day, index) in cells"
          :key="day ?? `blank-${index}`"
        >
          <button
            v-if="day"
            type="button"
            class="min-h-14 min-w-0 border px-0.5 py-2 text-sm tabular-nums"
            :class="selectedDay === day ? 'border-accent bg-interactive underline underline-offset-4' : 'border-transparent'"
            :aria-pressed="selectedDay === day"
            :aria-label="`${date(day)}: ${sessionCount(counts.get(day) ?? 0)}`"
            @click="selectedDay = day"
          >
            <span>{{ Number(day.slice(8)) }}</span><span
              class="mt-1 block min-h-4 text-[10px] font-semibold"
              :class="counts.has(day) ? 'text-accent' : 'text-secondary'"
            >{{ dayLabel(day) }}</span>
          </button><span
            v-else
            aria-hidden="true"
          />
        </template>
      </div>
      <div
        class="mt-5 border-t border-white/15 pt-4"
        aria-live="polite"
      >
        <h3 class="font-semibold">
          {{ date(selectedDay) }}
        </h3><p
          v-if="!daySessions.length"
          class="mt-3 text-sm text-secondary"
        >
          Brak ukończonego treningu tego dnia.
        </p><ul class="divide-y divide-white/15">
          <li
            v-for="session in daySessions"
            :key="session.id"
          >
            <NuxtLink
              :to="`/workouts/${session.id}`"
              class="block min-h-11 py-4"
            ><span class="font-medium underline underline-offset-4">{{ session.name }}</span><span class="mt-1 block text-xs text-secondary">{{ session.plan }}</span></NuxtLink>
          </li>
        </ul>
      </div>
    </section>
    <section class="ledger-section">
      <h2 class="text-xl font-semibold">
        Serie na partie
      </h2>
      <div class="mt-4 flex items-center justify-between gap-3">
        <UiBaseButton
          variant="secondary"
          aria-label="Poprzedni tydzień"
          :disabled="week <= '2000-01-03'"
          @click="week = shiftDate(week, -7)"
        >
          ←
        </UiBaseButton><p
          class="text-center text-sm"
          aria-live="polite"
        >
          {{ date(week) }} – {{ date(shiftDate(week, 6)) }}<span class="mt-1 block text-xs text-secondary">{{ week.slice(0, 4) }}</span>
        </p><UiBaseButton
          variant="secondary"
          aria-label="Następny tydzień"
          :disabled="week >= mondayOf(today)"
          @click="week = shiftDate(week, 7)"
        >
          →
        </UiBaseButton>
      </div>
      <p
        v-if="status === 'pending'"
        role="status"
        class="mt-4 text-secondary"
      >
        Odczytywanie serii na partie…
      </p>
      <template v-else-if="data && !error">
        <p
          v-if="!data.muscles.length"
          class="mt-5 text-sm text-secondary"
        >
          Brak wykonanych serii roboczych w tym tygodniu.
        </p><ul class="mt-5 space-y-5">
          <li
            v-for="muscle in data.muscles"
            :key="muscle.name"
          >
            <div class="flex items-baseline justify-between gap-3">
              <span class="text-sm">{{ muscle.name }}</span><strong class="tabular-nums">{{ muscle.sets }} <span class="text-xs font-normal text-secondary">serii</span></strong>
            </div><div
              class="mt-2 h-1.5 bg-interactive"
              aria-hidden="true"
            >
              <div
                class="h-full bg-secondary"
                :style="{ width: `${muscle.sets / maximum * 100}%` }"
              />
            </div>
          </li>
        </ul>
      </template>
      <details class="mt-5 text-xs leading-relaxed text-secondary">
        <summary class="flex min-h-11 cursor-pointer items-center text-sm text-primary underline underline-offset-4">
          Jak przypisujemy serie?
        </summary><p>Każda wykonana seria robocza trafia raz do głównej partii ćwiczenia z aktualnego wspólnego katalogu. Wyciskanie na klatkę nie dodaje osobnych serii tricepsa i barków. Nie rozdzielamy udziału mięśni pomocniczych, nie uwzględniamy rozgrzewek ani porzuconych sesji i nie oceniamy intensywności serii. Zmiana partii w katalogu zmieni to zestawienie również dla historii.</p>
      </details>
    </section>
  </div>
</template>
