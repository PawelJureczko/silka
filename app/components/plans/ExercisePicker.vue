<script setup lang="ts">
import type { CatalogExercise } from '~/services/plans'

const props = withDefaults(defineProps<{ browse?: boolean }>(), { browse: false })
const emit = defineEmits<{ select: [exercise: CatalogExercise], close: [] }>()
const { items, groups, muscleGroups, total, search, pending, error, load } = useCatalog()
const creating = ref(false)
const view = ref<'alphabetical' | 'muscles'>('alphabetical')
const selectedGroup = ref('')
const visibleGroups = computed(() => groups.value.filter(group => !selectedGroup.value || group.name === selectedGroup.value))
const resultCount = computed(() => view.value === 'muscles' ? visibleGroups.value.reduce((count, group) => count + group.exercises.length, 0) : items.value.length)
const resultsId = useId()
onMounted(() => load())
function created(exercise: CatalogExercise) {
  creating.value = false
  search.value = ''
  selectedGroup.value = ''
  void load()
  if (!props.browse) emit('select', exercise)
}
</script>

<template>
  <section
    :class="browse ? 'space-y-5' : 'panel space-y-4 p-4 sm:p-6'"
    :aria-label="browse ? 'Przeglądaj ćwiczenia' : 'Wybierz ćwiczenie'"
  >
    <div class="flex items-center justify-between gap-3">
      <h2 class="text-lg font-semibold">
        {{ browse ? 'Znajdź ćwiczenie' : 'Wybierz ćwiczenie' }}
      </h2>
      <button
        v-if="!browse"
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
      <label class="block text-sm">Szukaj w katalogu
        <input
          v-model="search"
          class="field mt-2"
          type="search"
          placeholder="Nazwa, sprzęt lub partia mięśniowa…"
        />
      </label>
      <div
        class="grid grid-cols-2 gap-2"
        role="group"
        aria-label="Układ katalogu"
      >
        <button
          type="button"
          class="min-h-12 rounded-md border px-3 py-3 text-sm font-semibold"
          :class="view === 'alphabetical' ? 'border-accent bg-accent text-background' : 'border-secondary/70 bg-interactive text-primary'"
          :aria-pressed="view === 'alphabetical'"
          :aria-controls="resultsId"
          @click="view = 'alphabetical'"
        >
          Wszystkie A–Z
        </button>
        <button
          type="button"
          class="min-h-12 rounded-md border px-3 py-3 text-sm font-semibold"
          :class="view === 'muscles' ? 'border-accent bg-accent text-background' : 'border-secondary/70 bg-interactive text-primary'"
          :aria-pressed="view === 'muscles'"
          :aria-controls="resultsId"
          @click="view = 'muscles'"
        >
          Partie mięśniowe
        </button>
      </div>
      <label
        v-if="view === 'muscles'"
        class="block text-sm"
      >Partia mięśniowa
        <select
          v-model="selectedGroup"
          class="field mt-2"
        >
          <option value="">Wszystkie partie</option>
          <option
            v-for="name in muscleGroups"
            :key="name"
            :value="name"
          >{{ name }}</option>
        </select>
      </label>
      <p
        v-if="pending"
        role="status"
        class="text-sm text-secondary"
      >
        Pobieranie pełnego katalogu…
      </p>
      <div
        v-if="error"
        role="alert"
        class="space-y-3"
      >
        <p class="text-sm text-red-300">
          {{ error }}
        </p>
        <UiBaseButton
          variant="secondary"
          :busy="pending"
          @click="load()"
        >
          Spróbuj ponownie
        </UiBaseButton>
      </div>
      <template v-if="!pending && !error">
        <p
          role="status"
          class="text-sm text-secondary"
        >
          {{ search.trim() || (view === 'muscles' && selectedGroup) ? `Wyniki: ${resultCount} z ${total}` : `W katalogu: ${total}` }}
        </p>
        <div
          :id="resultsId"
          :class="browse ? '' : 'max-h-96 overflow-y-auto overscroll-contain'"
        >
          <PlansExerciseList
            v-if="view === 'alphabetical'"
            :exercises="items"
            :selectable="!browse"
            @select="emit('select', $event)"
          />
          <div
            v-else
            class="space-y-8"
          >
            <section
              v-for="group in visibleGroups"
              :key="group.name"
            >
              <h3
                class="flex items-baseline justify-between gap-3 border-b border-secondary/70 py-3 text-xl font-bold"
                :aria-label="`${group.name}. Liczba ćwiczeń: ${group.exercises.length}`"
              >
                {{ group.name }}<span class="text-sm font-normal tabular-nums text-secondary">{{ group.exercises.length }}</span>
              </h3>
              <PlansExerciseList
                :exercises="group.exercises"
                :selectable="!browse"
                @select="emit('select', $event)"
              />
            </section>
          </div>
          <p
            v-if="!resultCount"
            class="py-4 text-sm text-secondary"
          >
            Nie znaleziono ćwiczeń. Zmień wyszukiwanie lub dodaj ćwiczenie do wspólnego katalogu.
          </p>
        </div>
      </template>
      <button
        type="button"
        class="min-h-12 text-sm font-semibold text-accent"
        @click="creating = true"
      >
        + Dodaj ćwiczenie
      </button>
    </template>
  </section>
</template>
