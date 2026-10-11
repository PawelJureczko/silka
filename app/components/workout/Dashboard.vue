<script setup lang="ts">
const props = defineProps<{
  timezone: string
}>()
const { data, status, queryError, refresh, resumeId, starting, begin, error, storageError } = await useWorkoutDashboard(() => props.timezone)
const selection = ref('')
const selectedWorkout = computed(() => data.value?.workouts.find(item => item.id === selection.value))
watch(() => data.value?.next?.id, (id) => {
  selection.value = id ?? ''
}, { immediate: true })
function date(value: string) {
  return new Intl.DateTimeFormat('pl-PL', { day: 'numeric', month: 'long', timeZone: props.timezone }).format(new Date(value))
}
</script>

<template>
  <div class="dashboard-layout">
    <section class="dashboard-main panel flex flex-col p-5 sm:p-8">
      <p class="section-label">
        {{ resumeId ? 'W trakcie' : 'Następna sesja' }}
      </p>
      <template v-if="resumeId">
        <h2 class="mt-7 text-4xl font-extrabold tracking-tight">
          Trening czeka.<br />Wróć do serii.
        </h2><p class="mt-4 max-w-sm text-sm text-secondary">
          Otwórz rozpoczętą sesję i kontynuuj od zapisanych wyników.
        </p><NuxtLink
          :to="`/workouts/${resumeId}`"
          class="button-primary mt-8 w-full self-start sm:w-auto"
        >Wznów trening</NuxtLink>
      </template>
      <template v-else-if="data?.plan && data.workouts.length">
        <div class="mt-7 flex items-start gap-5">
          <span
            class="ledger-number text-6xl text-accent sm:text-7xl"
            aria-hidden="true"
          >{{ String(data.workouts.findIndex(item => item.id === selection) + 1).padStart(2, '0') }}</span>
          <div class="min-w-0">
            <p class="text-xs text-secondary">
              {{ data.plan.name }}
            </p><h2 class="mt-2 text-3xl font-bold tracking-tight">
              {{ selectedWorkout?.name }}
            </h2>
          </div>
        </div>
        <label class="mt-7 block text-sm text-secondary">Jednostka treningowa<select
          v-model="selection"
          class="field mt-2"
        ><option
          v-for="workout in data.workouts"
          :key="workout.id"
          :value="workout.id"
        >{{ workout.name }}</option></select></label><UiBaseButton
          class="mt-5 w-full self-start sm:w-auto"
          :busy="starting"
          :disabled="!selection || Boolean(storageError)"
          @click="begin(selection)"
        >
          Rozpocznij trening
        </UiBaseButton>
      </template>
      <template v-else-if="status !== 'pending' && !queryError">
        <h2 class="mt-7 max-w-sm text-4xl font-extrabold tracking-tight">
          Najpierw plan.<br />Potem pierwsza seria.
        </h2><p class="mt-4 max-w-sm text-sm leading-relaxed text-secondary">
          Nie masz aktywnego planu. Wybierz zapisany lub ułóż własny trening.
        </p><NuxtLink
          to="/plans"
          class="button-primary mt-8 w-full self-start sm:w-auto"
        >Wybierz plan</NuxtLink>
      </template>
      <p
        v-if="status === 'pending'"
        class="mt-5 text-secondary"
        role="status"
      >
        Odczytywanie treningów…
      </p>
      <div
        v-if="queryError || error || storageError"
        class="mt-5 space-y-3"
      >
        <p
          role="alert"
          class="text-sm text-red-300"
        >
          {{ storageError || error || 'Nie udało się odczytać treningów.' }}
        </p><UiBaseButton
          variant="secondary"
          :busy="status === 'pending'"
          @click="refresh()"
        >
          Odśwież dane
        </UiBaseButton>
      </div>
    </section>
    <section
      v-if="data"
      class="ledger-section flex items-baseline justify-between gap-4"
    >
      <div>
        <h2 class="section-label">
          Ten tydzień
        </h2><p class="mt-1 text-xs text-secondary">
          Zakończone treningi
        </p>
      </div>
      <p class="ledger-number text-5xl">
        {{ data.weekly }}
      </p>
    </section>
    <section
      v-if="data?.recent.length"
      class="ledger-section"
    >
      <h2 class="section-label">
        Ostatnie sesje
      </h2><ul class="mt-4 divide-y divide-white/10">
        <li
          v-for="session in data.recent"
          :key="session.id"
        >
          <NuxtLink
            :to="`/workouts/${session.id}`"
            class="flex min-h-16 items-center justify-between gap-3 py-3"
          ><span><span class="block font-medium">{{ session.workout_name_snapshot }}</span><span class="mt-1 block text-xs text-secondary">{{ date(session.started_at) }} · {{ session.status === 'completed' ? 'Zakończony' : 'Porzucony' }}</span></span><span
            aria-hidden="true"
            class="text-secondary"
          >→</span></NuxtLink>
        </li>
      </ul>
    </section>
  </div>
</template>
