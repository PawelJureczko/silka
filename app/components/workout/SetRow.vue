<script setup lang="ts">
import type { WorkoutSet } from '#shared/schemas/workouts'
import { workoutSetSchema } from '#shared/schemas/workouts'

const props = defineProps<{
  set: WorkoutSet
  index: number
  convention: string
  bodyweight: boolean
  disabled: boolean
  busy: boolean
  focused?: boolean
  previous?: {
    reps: number
    weightKg: number | null
  }
}>()
const emit = defineEmits<{
  change: [set: WorkoutSet]
  validity: [invalid: boolean, id: string]
}>()
const reps = ref(props.set.reps)
const weight = ref(props.set.weightKg)
const error = ref('')
watch([() => props.set, () => props.busy], ([value, busy]) => {
  if (!busy && !error.value) {
    reps.value = value.reps
    weight.value = value.weightKg
  }
})
const unit = computed(() => ({ per_hand: 'Kg / rękę', assistance: 'Kg asysty', bodyweight: 'Dodatkowe kg', total: 'Ciężar kg' }[props.convention] ?? 'Ciężar kg'))
function commit(status = props.set.status) {
  const next = { ...props.set, reps: reps.value, weightKg: weight.value, status, completedAt: status === 'completed' ? props.set.completedAt ?? new Date().toISOString() : null }
  const parsed = workoutSetSchema.safeParse(next)
  error.value = !parsed.success ? 'Podaj 1–100 całkowitych powtórzeń i ciężar 0–1000 kg (do 2 miejsc po przecinku).' : status === 'completed' && !props.bodyweight && weight.value === null ? 'Podaj ciężar wykonanej serii.' : ''
  emit('validity', Boolean(error.value), props.set.id)
  if (!error.value && parsed.success)
    emit('change', parsed.data)
}
function skip() {
  reps.value = null
  weight.value = null
  commit('skipped')
}
onBeforeUnmount(() => emit('validity', false, props.set.id))
</script>

<template>
  <fieldset
    class="rounded-lg border p-4"
    :class="focused ? 'border-transparent bg-background px-0' : set.status === 'completed' ? 'border-accent/60 bg-surface' : 'border-secondary/50 bg-surface'"
    :disabled="disabled"
  >
    <legend class="px-1 text-sm font-medium">
      Seria {{ index + 1 }} · {{ set.setType === 'warmup' ? 'Rozgrzewka' : 'Robocza' }}
    </legend>
    <p class="mb-3 text-xs text-secondary">
      Plan: {{ set.plannedRepsMin === null ? 'dodatkowa seria' : `${set.plannedRepsMin}–${set.plannedRepsMax} powt.` }}<span v-if="set.plannedWeightKg !== null"> · {{ String(set.plannedWeightKg).replace('.', ',') }} kg</span>
    </p>
    <p
      v-if="previous"
      class="mb-3 text-sm text-secondary"
    >
      Poprzednio: {{ previous.reps }} powt.<span v-if="previous.weightKg !== null"> × {{ String(previous.weightKg).replace('.', ',') }} kg</span>
    </p>
    <div class="grid grid-cols-2 gap-3">
      <label class="text-xs text-secondary">Powtórzenia<UiDecimalInput
        v-model="reps"
        :label="`Powtórzenia serii ${index + 1}`"
        class="mt-2"
        :class="focused ? 'min-h-20 text-3xl' : ''"
        placeholder="Powt."
        :disabled="disabled || set.status === 'skipped'"
        @update:model-value="commit()"
      /></label>
      <label class="text-xs text-secondary">{{ unit }}<UiDecimalInput
        v-model="weight"
        :label="`Ciężar wykonanej serii ${index + 1}`"
        class="mt-2"
        :class="focused ? 'min-h-20 text-3xl' : ''"
        placeholder="Kg"
        :disabled="disabled || set.status === 'skipped'"
        @update:model-value="commit()"
      /></label>
    </div>
    <p
      v-if="error"
      role="alert"
      class="mt-3 text-xs text-red-300"
    >
      {{ error }}
    </p>
    <div class="mt-3 flex flex-wrap gap-2">
      <button
        v-if="set.status !== 'completed' && set.status !== 'skipped'"
        type="button"
        :class="focused ? 'button-primary w-full text-lg' : 'button-secondary grow text-sm'"
        :disabled="busy"
        @click="commit('completed')"
      >
        {{ focused ? 'Seria zakończona' : 'Oznacz wykonaną' }}
      </button>
      <button
        v-if="set.status === 'pending'"
        type="button"
        class="button-secondary text-sm"
        :disabled="busy"
        @click="skip"
      >
        Pomiń
      </button>
      <button
        v-else
        type="button"
        class="button-secondary grow text-sm"
        :disabled="busy"
        @click="commit('pending')"
      >
        {{ set.status === 'completed' ? '✓ Wykonana · cofnij' : 'Pominięta · przywróć' }}
      </button>
    </div>
  </fieldset>
</template>
