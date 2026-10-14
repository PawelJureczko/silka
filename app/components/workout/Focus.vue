<script setup lang="ts">
import type { Workout, WorkoutSet, PreviousSets } from '#shared/schemas/workouts'
import { nextWorkoutSet } from '~/domain/workout-focus'

const props = defineProps<{ session: Workout, previous: PreviousSets, editable: boolean, busy: boolean }>()
defineEmits<{ change: [exerciseId: string, set: WorkoutSet], validity: [id: string, invalid: boolean], stop: [], extend: [], finish: [], list: [] }>()
const selectedId = ref<string | null>(null)
const selectionOpen = ref(false)
const target = computed(() => nextWorkoutSet(props.session, selectedId.value))
const completed = computed(() => props.session.exercises.reduce((sum, item) => sum + item.sets.filter(set => set.status === 'completed').length, 0))
const total = computed(() => props.session.exercises.reduce((sum, item) => sum + item.sets.length, 0))
const previousSet = computed(() => target.value ? props.previous.find(item => item.workoutExerciseId === target.value?.exercise.id)?.sets.find(set => set.position === target.value?.setIndex && set.setType === target.value?.set.setType) : undefined)
function choose(id: string) {
  selectedId.value = id
  selectionOpen.value = false
}
</script>

<template>
  <div class="flex min-h-[75dvh] flex-col">
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
        class="my-auto py-8"
      >
        <WorkoutRestTimer
          :ends-at="session.restEndsAt"
          :disabled="!editable || busy"
          expanded
          @stop="$emit('stop')"
          @extend="$emit('extend')"
        />
        <p class="mt-4 text-sm text-secondary">
          Następna: {{ target.exercise.name }}, seria {{ target.setIndex + 1 }}.
        </p>
      </div>
      <div
        v-else
        class="mt-auto pt-6"
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
