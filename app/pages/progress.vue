<script setup lang="ts">
import { exerciseVariantKey } from '~/domain/progress'

useHead({ title: 'Postępy — Siłka' })
const progress = await useProgress()
const { selected, selection, page, filter, days, timezone, target, refresh } = progress
const { data: overview, status: overviewStatus, error: overviewError } = progress.overview
const { data: history, status: historyStatus, error: historyError, refresh: refreshHistory } = progress.history
const { data: exercise, status: exerciseStatus, error: exerciseError, refresh: refreshExercise } = progress.exercise
const metric = ref<'weight' | 'volume' | 'reps'>('weight')
watch(selected, (value) => {
  metric.value = value?.loadMode === 'bodyweight' ? 'reps' : 'weight'
})
const unit = computed(() => metric.value === 'reps' ? 'powt.' : metric.value === 'volume' ? selected.value?.weightConvention === 'per_hand' ? 'kg × powt. / rękę' : 'kg × powt.' : selected.value?.weightConvention === 'per_hand' ? 'kg / rękę' : selected.value?.weightConvention === 'assistance' ? 'kg asysty' : 'kg')
function date(value: string) {
  return new Intl.DateTimeFormat('pl-PL', { day: 'numeric', month: 'long', year: 'numeric', timeZone: timezone.value }).format(new Date(value))
}
function number(value: number) {
  return new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 2 }).format(value)
}
function minutes(start: string, end: string) {
  return Math.max(0, Math.round((Date.parse(end) - Date.parse(start)) / 60000))
}
</script>

<template>
  <div>
    <UiPageHeading
      title="Zapis siły."
      description="Porównaj sesje. Zobacz, co zmienia się pod sztangą."
    />
    <div class="progress-layout">
      <p
        v-if="overviewStatus === 'pending'"
        role="status"
        class="text-secondary"
      >
        Odczytywanie statystyk…
      </p>
      <div
        v-if="overviewError"
        class="panel space-y-3 p-5"
      >
        <p
          role="alert"
          class="text-sm text-red-300"
        >
          Nie udało się pobrać statystyk.
        </p><UiBaseButton
          variant="secondary"
          @click="refresh"
        >
          Spróbuj ponownie
        </UiBaseButton>
      </div>
      <section
        v-if="overview?.exercises.length"
        class="min-w-0"
      >
        <h2 class="section-label">
          Wynik ćwiczenia
        </h2>
        <label class="mt-5 block text-sm text-secondary">Ćwiczenie i sposób obciążenia<select
          v-model="selection"
          class="field mt-2"
        ><option
          v-for="variant in overview.exercises"
          :key="exerciseVariantKey(variant)"
          :value="exerciseVariantKey(variant)"
        >{{ variant.name }} · {{ variant.equipment }} · {{ ({ total: 'łącznie', per_hand: 'na rękę', bodyweight: 'masa ciała', assistance: 'asysta' })[variant.weightConvention] }}</option></select></label>
        <p
          v-if="overview.exercises.length === 200"
          class="mt-2 text-xs text-secondary"
        >
          Lista obejmuje 200 ostatnio używanych wariantów ćwiczeń.
        </p>
        <p
          v-if="exerciseStatus === 'pending'"
          role="status"
          class="mt-5 text-secondary"
        >
          Odczytywanie wyników…
        </p>
        <div
          v-else-if="exerciseError"
          class="mt-5 space-y-3"
        >
          <p
            role="alert"
            class="text-sm text-red-300"
          >
            Nie udało się pobrać wyników.
          </p><UiBaseButton
            variant="secondary"
            @click="refreshExercise()"
          >
            Spróbuj ponownie
          </UiBaseButton>
        </div>
        <template v-else-if="exercise && selected">
          <div
            v-if="exercise.record"
            class="mt-6 border-b border-white/15 pb-4"
          >
            <p class="eyebrow">
              {{ selected.loadMode === 'bodyweight' ? 'Najwięcej powtórzeń' : selected.loadMode === 'assisted' ? 'Najmniejsza asysta' : 'Największy ciężar' }} · rekord
            </p>
            <p class="ledger-number mt-3 text-[clamp(2.75rem,6vw,4.5rem)] text-accent">
              {{ selected.loadMode === 'bodyweight' ? `${exercise.record.reps} powt.` : `${number(exercise.record.weightKg ?? 0)} ${selected.weightConvention === 'per_hand' ? 'kg / rękę' : selected.loadMode === 'assisted' ? 'kg asysty' : 'kg'}` }}
            </p>
            <p class="mt-2 text-sm text-secondary">
              {{ selected.loadMode === 'bodyweight' ? exercise.record.weightKg === null ? 'Dodatkowy ciężar nie został zapisany.' : `Dodatkowo ${number(exercise.record.weightKg)} kg.` : `${exercise.record.reps} powtórzeń.` }}
            </p>
            <NuxtLink
              :to="`/workouts/${exercise.record.sessionId}`"
              class="mt-2 inline-flex min-h-11 items-center text-sm text-secondary underline underline-offset-4"
            >Sesja z {{ date(exercise.record.startedAt) }}</NuxtLink>
          </div>
          <label class="mt-5 block text-sm text-secondary">Wykres<select
            v-model="metric"
            class="field mt-2"
          ><option
            v-if="selected.loadMode !== 'bodyweight'"
            value="weight"
          >{{ selected.loadMode === 'assisted' ? 'Najmniejsza asysta w sesji' : 'Największy ciężar w sesji' }}</option><option value="reps">Najwięcej powtórzeń w serii</option><option
            v-if="selected.loadMode === 'external'"
            value="volume"
          >Objętość wg zapisanego ciężaru</option></select></label>
          <LazyProgressChart
            :points="exercise.points"
            :metric="metric"
            :unit="unit"
            :timezone="timezone"
          />
          <details class="mt-4 text-xs leading-relaxed text-secondary">
            <summary class="flex min-h-11 cursor-pointer items-center text-sm text-primary underline decoration-secondary underline-offset-4">
              Jak liczymy wyniki?
            </summary><p>
              Do 30 ostatnich sesji z wykonanymi seriami roboczymi. Rekord obejmuje całą historię zgodnego ćwiczenia, sprzętu i sposobu zapisu. Rozgrzewki i porzucone sesje są pomijane. {{ selected.loadMode === 'assisted' ? 'Mniejsza asysta oznacza mniejsze wsparcie.' : selected.loadMode === 'bodyweight' || metric === 'reps' ? 'Powtórzenia mogą pochodzić z serii o różnym obciążeniu; sprawdź szczegóły sesji.' : metric === 'volume' ? 'Objętość to suma kg × powtórzenia; dla hantli liczymy wg zapisu na jedną rękę.' : '' }}
            </p>
          </details>
        </template>
      </section>
      <UiEmptyState
        v-else-if="overview && !overview.exercises.length"
        kind="progress"
        title="Pierwszy wynik przed Tobą"
        description="Zakończ trening z wykonaną serią roboczą. Tutaj pojawi się wykres i Twój rekord."
      >
        <NuxtLink
          to="/"
          class="button-secondary mt-5"
        >Wybierz trening</NuxtLink>
      </UiEmptyState>
      <ProgressOverview
        v-if="overview"
        :overview="overview"
        :target="target"
      />
      <section class="progress-history ledger-section min-w-0">
        <h2 class="text-lg font-semibold">
          Historia treningów
        </h2>
        <div class="mt-5 grid grid-cols-2 gap-3">
          <label class="text-sm text-secondary">Status<select
            v-model="filter"
            class="field mt-2"
          ><option value="all">Wszystkie</option><option value="completed">Zakończone</option><option value="abandoned">Porzucone</option></select></label><label class="text-sm text-secondary">Okres<select
            v-model="days"
            class="field mt-2"
          ><option :value="0">Cała historia</option><option :value="30">Ostatnie 30 dni</option><option :value="90">Ostatnie 90 dni</option></select></label>
        </div>
        <p
          v-if="historyStatus === 'pending'"
          role="status"
          class="mt-5 text-secondary"
        >
          Odczytywanie historii…
        </p>
        <div
          v-else-if="historyError"
          class="mt-5 space-y-3"
        >
          <p
            role="alert"
            class="text-sm text-red-300"
          >
            Nie udało się pobrać historii.
          </p><UiBaseButton
            variant="secondary"
            @click="refreshHistory()"
          >
            Spróbuj ponownie
          </UiBaseButton>
        </div>
        <template v-else-if="history">
          <p
            v-if="!history.rows.length"
            class="mt-5 text-sm text-secondary"
          >
            Brak treningów w wybranym zakresie.
          </p>
          <ul class="mt-4 divide-y divide-white/10">
            <li
              v-for="session in history.rows"
              :key="session.id"
            >
              <NuxtLink
                :to="`/workouts/${session.id}`"
                class="flex min-h-20 items-center justify-between gap-3 py-4"
              ><span class="min-w-0"><span class="block font-medium">{{ session.workout_name_snapshot }}</span><span class="mt-1 block truncate text-xs text-secondary">{{ session.plan_name_snapshot }}</span><span class="mt-2 block text-xs text-secondary">{{ date(session.started_at) }} · {{ minutes(session.started_at, session.finished_at) }} min · {{ session.status === 'completed' ? 'Zakończony' : 'Porzucony' }}</span></span><span class="text-accent">→</span></NuxtLink>
            </li>
          </ul>
          <div class="mt-4 flex items-center justify-between gap-2">
            <UiBaseButton
              variant="secondary"
              :disabled="!page"
              @click="page--"
            >
              ← Wstecz
            </UiBaseButton><span class="text-xs text-secondary">Strona {{ page + 1 }}</span><UiBaseButton
              variant="secondary"
              :disabled="!history.hasMore"
              @click="page++"
            >
              Dalej →
            </UiBaseButton>
          </div>
        </template>
      </section>
    </div>
  </div>
</template>
