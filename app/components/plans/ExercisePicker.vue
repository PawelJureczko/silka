<script setup lang="ts">
import type { CatalogExercise } from '~/services/plans'

const emit = defineEmits<{
  select: [
        exercise: CatalogExercise,
  ]
  close: [
  ]
}>()
const { items, search, pending, error, hasMore, load } = useCatalog()
const creating = ref(false)
const conventions: Record<string, string> = { total: 'kg łącznie', per_hand: 'kg na rękę', bodyweight: 'masa ciała', assistance: 'kg asysty' }
onMounted(() => load())
function created(exercise: CatalogExercise) {
  creating.value = false
  void load()
  emit('select', exercise)
}
</script>

<template>
  <section
    class="panel space-y-4 p-4 sm:p-6"
    aria-label="Wybierz ćwiczenie"
  >
    <div class="flex items-center justify-between gap-3">
      <h2 class="text-lg font-semibold">
        Wybierz ćwiczenie
      </h2><button
        type="button"
        class="button-secondary min-w-12 px-3"
        aria-label="Zamknij wybór ćwiczenia"
        @click="emit('close')"
      >
        ×
      </button>
    </div>
    <PlansExerciseForm
      v-if="creating"
      @created="created"
      @cancel="creating = false"
    />
    <template v-else>
      <form
        class="flex gap-2"
        @submit.prevent="load()"
      >
        <input
          v-model="search"
          class="field min-w-0"
          type="search"
          aria-label="Szukaj ćwiczenia"
          placeholder="Szukaj ćwiczenia…"
        /><UiBaseButton
          type="submit"
          variant="secondary"
          :busy="pending"
        >
          Szukaj
        </UiBaseButton>
      </form>
      <p
        v-if="error"
        role="alert"
        class="text-sm text-red-300"
      >
        {{ error }}
      </p>
      <p
        v-if="pending && !items.length"
        role="status"
        class="text-secondary"
      >
        Pobieranie ćwiczeń…
      </p>
      <div class="max-h-80 space-y-2 overflow-y-auto overscroll-contain">
        <button
          v-for="exercise in items"
          :key="exercise.id"
          type="button"
          class="flex min-h-16 w-full items-center justify-between gap-3 rounded-2xl bg-interactive p-4 text-left hover:bg-zinc-700"
          @click="emit('select', exercise)"
        >
          <span><span class="block font-medium">{{ exercise.name }}</span><span class="mt-1 block text-xs text-secondary">{{ exercise.equipment }} · {{ exercise.muscle_group }} · {{ conventions[exercise.weight_convention] }}</span></span><span
            class="text-xl text-accent"
            aria-hidden="true"
          >+</span>
        </button>
      </div>
      <p
        v-if="!pending && !error && !items.length"
        class="text-sm text-secondary"
      >
        Nie znaleziono ćwiczenia. Możesz dodać własne.
      </p>
      <UiBaseButton
        v-if="hasMore"
        variant="secondary"
        :busy="pending"
        @click="load(true)"
      >
        Pokaż więcej
      </UiBaseButton>
      <button
        type="button"
        class="min-h-12 text-sm font-semibold text-accent"
        @click="creating = true"
      >
        + Dodaj własne ćwiczenie
      </button>
    </template>
  </section>
</template>
