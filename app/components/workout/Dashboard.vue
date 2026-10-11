<script setup lang="ts">
const props = defineProps<{
  timezone: string
}>()
const { data, status, queryError, refresh, resumeId, starting, begin, error, storageError } = await useWorkoutDashboard(() => props.timezone)
const selection = ref('')
watch(() => data.value?.next?.id, (id) => {
  selection.value = id ?? ''
}, { immediate: true })
function date(value: string) {
  return new Intl.DateTimeFormat('pl-PL', { day: 'numeric', month: 'long', timeZone: props.timezone }).format(new Date(value))
}
</script>

<template>
  <div class="space-y-5">
    <section class="panel p-6 sm:p-9">
      <p class="eyebrow">
        {{ resumeId ? 'Wracamy do treningu' : 'Twoja kolej' }}
      </p>
      <template v-if="resumeId">
        <h2 class="mt-5 text-3xl font-semibold">
          Kontynuuj swoją sesję.
        </h2><p class="mt-3 text-secondary">
          Wróć do zapisanych serii i stanu synchronizacji.
        </p><NuxtLink
          :to="`/workouts/${resumeId}`"
          class="button-primary mt-6"
        >Wznów trening →</NuxtLink>
      </template>
      <template v-else-if="data?.plan && data.workouts.length">
        <h2 class="mt-5 text-3xl font-semibold">
          {{ data.plan.name }}
        </h2><label class="mt-5 block text-sm text-secondary">Najbliższy trening<select
          v-model="selection"
          class="field mt-2"
        ><option
          v-for="workout in data.workouts"
          :key="workout.id"
          :value="workout.id"
        >{{ workout.name }}</option></select></label><UiBaseButton
          class="mt-6 w-full sm:w-auto"
          :busy="starting"
          :disabled="!selection || Boolean(storageError)"
          @click="begin(selection)"
        >
          Rozpocznij trening →
        </UiBaseButton>
      </template>
      <template v-else-if="status !== 'pending' && !queryError">
        <h2 class="mt-5 text-3xl font-semibold">
          Dobry trening zaczyna się od planu.
        </h2><p class="mt-3 text-secondary">
          Utwórz plan i ustaw go jako aktywny.
        </p><NuxtLink
          to="/plans"
          class="button-primary mt-6"
        >Przejdź do planów →</NuxtLink>
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
      class="panel p-6"
    >
      <p class="eyebrow">
        Ten tydzień
      </p><p class="mt-3 text-3xl font-semibold text-accent">
        {{ data.weekly }} <span class="text-base text-primary">zakończonych treningów</span>
      </p>
    </section>
    <section
      v-if="data?.recent.length"
      class="panel p-6"
    >
      <h2 class="text-lg font-semibold">
        Ostatnia aktywność
      </h2><ul class="mt-4 divide-y divide-white/10">
        <li
          v-for="session in data.recent"
          :key="session.id"
        >
          <NuxtLink
            :to="`/workouts/${session.id}`"
            class="flex min-h-16 items-center justify-between gap-3 py-3"
          ><span><span class="block font-medium">{{ session.workout_name_snapshot }}</span><span class="mt-1 block text-xs text-secondary">{{ date(session.started_at) }} · {{ session.status === 'completed' ? 'Zakończony' : 'Porzucony' }}</span></span><span class="text-accent">→</span></NuxtLink>
        </li>
      </ul>
    </section>
  </div>
</template>
