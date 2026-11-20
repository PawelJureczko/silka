<script setup lang="ts">
import type { NextLoadDecision } from '#shared/schemas/workouts'
import { loadDecisionLabels } from '~/domain/load-decision'

defineProps<{ name: string, value: NextLoadDecision, disabled: boolean, bodyweight: boolean, assisted: boolean }>()
defineEmits<{ change: [decision: NextLoadDecision] }>()
const options: NextLoadDecision[] = ['progress', 'maintain', 'reduce']
</script>

<template>
  <fieldset
    class="mt-5 border-t border-white/15 pt-4"
    :disabled="disabled"
    :aria-label="`Decyzja na następny trening: ${name}`"
  >
    <legend class="px-1 text-sm font-medium">
      Następnym razem
    </legend>
    <div class="grid grid-cols-3 gap-2">
      <button
        v-for="option in options"
        :key="option"
        type="button"
        class="min-h-11 min-w-11 rounded-md border px-2 py-2 text-sm font-medium break-words text-primary disabled:opacity-50"
        :class="option === value ? 'border-accent bg-interactive underline underline-offset-4' : 'border-secondary hover:bg-interactive'"
        :aria-pressed="option === value"
        @click="$emit('change', option)"
      >
        {{ loadDecisionLabels[option] }}
      </button>
    </div>
    <p class="mt-2 text-xs leading-relaxed text-secondary">
      {{ assisted ? 'Progres = mniej asysty; lżej = więcej asysty.' : bodyweight ? 'Wybierz kierunek trudności lub liczby powtórzeń.' : 'Wybierz kierunek zmiany ciężaru.' }} Zapiszesz przypomnienie na kolejną sesję.
    </p>
  </fieldset>
</template>
