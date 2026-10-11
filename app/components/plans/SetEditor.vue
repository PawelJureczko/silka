<script setup lang="ts">
import type { PlanSetInput } from '#shared/schemas/plans'

const set = defineModel<PlanSetInput>({ required: true })
defineProps<{
  index: number
  convention: string
  canRemove: boolean
  count: number
}>()
const emit = defineEmits<{
  remove: [
  ]
  move: [
        direction: -1 | 1,
  ]
}>()
</script>

<template>
  <fieldset class="rounded-2xl border border-white/8 p-3">
    <legend class="px-1 text-xs font-semibold text-secondary">
      Seria {{ index + 1 }}
    </legend>
    <div class="mb-3 flex items-center justify-between gap-2">
      <select
        v-model="set.setType"
        class="field max-w-40 px-3 text-sm"
        :aria-label="`Rodzaj serii ${index + 1}`"
      >
        <option value="working">
          Robocza
        </option><option value="warmup">
          Rozgrzewka
        </option>
      </select>
      <div class="flex">
        <button
          type="button"
          class="min-h-11 min-w-11 disabled:opacity-30"
          :aria-label="`Przenieś serię ${index + 1} w górę`"
          :disabled="index === 0"
          @click="emit('move', -1)"
        >
          ↑
        </button><button
          type="button"
          class="min-h-11 min-w-11 disabled:opacity-30"
          :aria-label="`Przenieś serię ${index + 1} w dół`"
          :disabled="index === count - 1"
          @click="emit('move', 1)"
        >
          ↓
        </button><button
          type="button"
          class="min-h-11 min-w-11 text-secondary disabled:opacity-30"
          :aria-label="`Usuń serię ${index + 1}`"
          :disabled="!canRemove"
          @click="emit('remove')"
        >
          ×
        </button>
      </div>
    </div>
    <div class="grid grid-cols-3 gap-2">
      <label class="text-xs text-secondary">Powt. min<input
        v-model.number="set.repsMin"
        class="field mt-2 px-3 tabular-nums"
        type="number"
        inputmode="numeric"
        min="1"
        max="100"
        required
        :aria-label="`Minimum powtórzeń serii ${index + 1}`"
      /></label>
      <label class="text-xs text-secondary">Powt. max<input
        v-model.number="set.repsMax"
        class="field mt-2 px-3 tabular-nums"
        type="number"
        inputmode="numeric"
        min="1"
        max="100"
        required
        :aria-label="`Maksimum powtórzeń serii ${index + 1}`"
      /></label>
      <label class="text-xs text-secondary">{{ convention === 'assistance' ? 'Asysta kg' : convention === 'per_hand' ? 'Kg / rękę' : 'Ciężar kg' }}<UiDecimalInput
        v-model="set.targetWeightKg"
        :label="`Ciężar serii ${index + 1} w kilogramach`"
        class="mt-2 px-3"
      /></label>
    </div>
  </fieldset>
</template>
