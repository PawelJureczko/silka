<script setup lang="ts">
import type { Workout, WorkoutSet, PreviousSets } from '#shared/schemas/workouts'
import { nextWorkoutSet, previousRestSets, recordedSetLabel } from '~/domain/workout-focus'

const props = defineProps<{ session: Workout, previous: PreviousSets, editable: boolean, busy: boolean }>()
defineEmits<{ change: [exerciseId: string, set: WorkoutSet], validity: [id: string, invalid: boolean], stop: [], extend: [], finish: [], list: [], replace: [exerciseId: string] }>()
const selectedId = defineModel<string | null>('selectedId', { default: null })
const selectionOpen = ref(false)
const target = computed(() => nextWorkoutSet(props.session, selectedId.value))
const completed = computed(() => props.session.exercises.reduce((sum, item) => sum + item.sets.filter(set => set.status === 'completed').length, 0))
const total = computed(() => props.session.exercises.reduce((sum, item) => sum + item.sets.length, 0))
const previousSet = computed(() => target.value ? props.previous.find(item => item.workoutExerciseId === target.value?.exercise.id)?.sets.find(set => set.position === target.value?.setIndex && set.setType === target.value?.set.setType) : undefined)
const restHistory = computed(() => target.value ? previousRestSets(target.value.exercise, target.value.setIndex, props.previous) : null)
function choose(id: string) {
  selectedId.value = id
  selectionOpen.value = false
}
</script>

<template>
  <div class="workout-focus">
    <div class="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-white/15 pb-4">
      <p class="text-sm text-secondary">
        {{ completed }} / {{ total }} serii wykonanych
      </p>
      <UiBaseButton
        variant="secondary"
        :disabled="busy"
        @click="$emit('list')"
      >
        Wszystkie serie
      </UiBaseButton>
    </div>
    <template v-if="target">
      <p class="text-sm text-secondary">
        Ćwiczenie {{ target.exerciseIndex + 1 }} z {{ session.exercises.length }} · seria {{ target.setIndex + 1 }} z {{ target.exercise.sets.length }}
      </p>
      <h1 class="mt-3 text-[clamp(2rem,7vw,3.5rem)] leading-[1.08] font-extrabold tracking-tight">
        {{ target.exercise.name }}
      </h1>
      <p class="mt-3 text-sm text-secondary">
        {{ target.exercise.equipment }} · {{ ({ total: 'kg łącznie', per_hand: 'kg na rękę', bodyweight: 'masa ciała + dodatkowe kg', assistance: 'kg asysty' })[target.exercise.weightConvention] }}
      </p>
      <ExercisesGuideLink :name="target.exercise.name" />
      <button
        type="button"
        class="mt-2 min-h-11 text-sm text-secondary underline underline-offset-4"
        :disabled="!editable || busy"
        @click="$emit('replace', target.exercise.id)"
      >
        Podmień ćwiczenie z katalogu
      </button>
      <details
        v-if="target.exercise.notes"
        class="mt-3"
      >
        <summary class="flex min-h-11 cursor-pointer items-center text-sm underline underline-offset-4">
          Wskazówki do ćwiczenia
        </summary>
        <p class="mt-2 text-sm leading-relaxed whitespace-pre-wrap text-secondary">
          {{ target.exercise.notes }}
        </p>
      </details>
      <div
        v-if="session.restEndsAt"
        class="py-6"
      >
        <section
          class="mb-5 space-y-2 border-t border-white/15 pt-4"
          aria-label="Obciążenie do kolejnej serii"
        >
          <template v-if="restHistory?.sets.length">
            <p class="text-sm text-secondary">
              {{ restHistory.exact ? 'Poprzednio w tej serii' : 'Poprzedni trening tego ćwiczenia (brak tej serii)' }}
            </p>
            <ul class="space-y-1">
              <li
                v-for="set in restHistory.sets"
                :key="set.position"
                class="text-2xl leading-snug font-semibold tabular-nums"
              >
                {{ recordedSetLabel(set, target.exercise.weightConvention) }}
              </li>
            </ul>
          </template>
          <p
            v-else
            class="text-sm text-secondary"
          >
            Brak poprzedniego wyniku dla tej serii. Dobierz obciążenie przed jej rozpoczęciem.
          </p>
        </section>
        <WorkoutRestTimer
          :ends-at="session.restEndsAt"
          :disabled="!editable || busy"
          expanded
          @stop="$emit('stop')"
          @extend="$emit('extend')"
        />
      </div>
      <div
        v-else
        class="pt-6"
      >
        <WorkoutSetRow
          :key="target.set.id"
          :set="target.set"
          :index="target.setIndex"
          :convention="target.exercise.weightConvention"
          :bodyweight="target.exercise.loadMode === 'bodyweight'"
          :disabled="!editable"
          :busy="busy"
          :previous="previousSet"
          focused
          @change="$emit('change', target.exercise.id, $event)"
          @validity="(invalid, id) => $emit('validity', id, invalid)"
        />
      </div>
      <UiBaseButton
        variant="secondary"
        class="mt-5 w-full"
        :disabled="busy"
        @click="selectionOpen = true"
      >
        Wybierz inne ćwiczenie
      </UiBaseButton>
    </template>
    <section
      v-else
      class="my-auto space-y-5 py-8"
    >
      <h1 class="text-4xl font-extrabold tracking-tight">
        Serie zapisane.
      </h1>
      <p class="text-secondary">
        Możesz przejrzeć wyniki, dodać serię albo przejść do podsumowania.
      </p>
      <UiBaseButton
        class="w-full"
        :disabled="!editable || busy"
        @click="$emit('finish')"
      >
        Zakończ i podsumuj trening
      </UiBaseButton>
    </section>
    <UiDialog
      v-if="selectionOpen"
      title="Wybierz ćwiczenie"
      @close="selectionOpen = false"
    >
      <div class="space-y-3">
        <UiBaseButton
          v-for="(exercise, index) in session.exercises"
          :key="exercise.id"
          variant="secondary"
          class="w-full justify-start text-left"
          :disabled="!exercise.sets.some(set => set.status === 'pending')"
          @click="choose(exercise.sets.find(set => set.status === 'pending')!.id)"
        >
          {{ index + 1 }}. {{ exercise.name }}<span v-if="!exercise.sets.some(set => set.status === 'pending')"> · ukończone</span>
        </UiBaseButton>
      </div>
    </UiDialog>
  </div>
</template>
