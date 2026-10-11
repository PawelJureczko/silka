<script setup lang="ts">
import type { WorkoutExercise } from '#shared/schemas/workouts'
import { weightSchema } from '#shared/schemas/plans'

const props = defineProps<{
  exercise: WorkoutExercise
  startedAt: string
  sessionId: string
  disabled: boolean
}>()
const { history, suggestion, apply, saving, error } = useWorkoutSuggestion(() => props.exercise, props.startedAt, props.sessionId)
const { status, error: queryError, execute } = history
const dialog = ref(false)
const weight = ref<number | null>(null)
const targets = ref<{
  id: string
  weightKg: number | null
  reps: number | null
  position: number
}[]>([])
function preview() {
  weight.value = suggestion.value?.weightKg ?? null
  targets.value = props.exercise.sets.flatMap((set, position) => set.status === 'pending' && set.setType === 'working' && set.plannedRepsMin !== null ? [{ id: set.id, weightKg: set.weightKg, reps: set.reps, position: position + 1 }] : [])
  dialog.value = true
}
async function confirm() {
  const parsed = weightSchema.safeParse(weight.value)
  if (!parsed.success)
    return
  if (await apply(parsed.data, targets.value))
    dialog.value = false
}
</script>

<template>
  <div class="rounded-2xl bg-interactive/50 p-4">
    <UiBaseButton
      variant="secondary"
      :busy="status === 'pending'"
      :disabled="disabled"
      @click="execute()"
    >
      {{ status === 'pending' ? 'Sprawdzanie…' : 'Zaproponuj ciężar' }}
    </UiBaseButton>
    <p
      v-if="queryError"
      role="alert"
      class="mt-3 text-sm text-red-300"
    >
      Nie udało się pobrać historii. Ponów sprawdzenie.
    </p>
    <div
      v-else-if="suggestion && status !== 'pending'"
      class="mt-3 text-sm"
    >
      <p class="leading-relaxed text-secondary">
        {{ suggestion.reason }}
      </p>
      <template v-if="suggestion.weightKg !== null">
        <p class="mt-3 font-semibold text-accent">
          {{ String(suggestion.weightKg).replace('.', ',') }} kg{{ exercise.weightConvention === 'per_hand' ? ' na rękę' : exercise.weightConvention === 'assistance' ? ' asysty' : ' łącznie' }}
        </p>
        <UiBaseButton
          variant="secondary"
          class="mt-3"
          :disabled="disabled || saving > 0"
          @click="preview"
        >
          Zobacz zastosowanie
        </UiBaseButton>
      </template>
    </div>
    <UiDialog
      v-if="dialog"
      title="Uzupełnić ciężar w tej sesji?"
      :busy="saving > 0"
      @close="dialog = false"
    >
      <p class="mb-4 text-sm leading-relaxed text-secondary">
        {{ exercise.name }}. Zmienisz wyłącznie poniższe niewykonane serie robocze bieżącego treningu. Powtórzenia pozostaną bez zmian.
      </p>
      <label class="block text-sm">Ciężar kg{{ exercise.weightConvention === 'per_hand' ? ' na rękę' : exercise.weightConvention === 'assistance' ? ' asysty' : ' łącznie' }}<UiDecimalInput
        v-model="weight"
        label="Proponowany ciężar"
        class="mt-2"
      /></label>
      <ul class="my-4 space-y-2 text-sm text-secondary">
        <li
          v-for="set in targets"
          :key="set.id"
        >
          Seria {{ set.position }}: {{ set.weightKg === null ? 'brak ciężaru' : `${String(set.weightKg).replace('.', ',')} kg` }} → {{ weight === null ? '—' : `${String(weight).replace('.', ',')} kg` }}
        </li>
      </ul>
      <p
        v-if="!targets.length"
        class="my-4 text-secondary"
      >
        Nie ma zaplanowanych serii roboczych do uzupełnienia.
      </p>
      <p
        v-if="error"
        role="alert"
        class="mb-4 text-sm text-red-300"
      >
        {{ error }}
      </p>
      <UiBaseButton
        :busy="saving > 0"
        :disabled="disabled || !targets.length || !weightSchema.safeParse(weight).success"
        @click="confirm"
      >
        Zatwierdź ciężar dla {{ targets.length }} serii
      </UiBaseButton>
    </UiDialog>
  </div>
</template>
