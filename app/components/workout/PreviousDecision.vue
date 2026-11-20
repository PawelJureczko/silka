<script setup lang="ts">
import type { PreviousSets } from '#shared/schemas/workouts'
import { loadDecisionLabels } from '~/domain/load-decision'

defineProps<{ previous?: PreviousSets[number] }>()
</script>

<template>
  <p
    class="min-h-12 text-sm leading-relaxed text-secondary"
  >
    <template v-if="previous">
      Twoja decyzja z poprzedniej sesji: <strong class="font-semibold text-primary">{{ loadDecisionLabels[previous.nextLoadDecision] }}</strong>.
    </template>
    <template v-else>
      Poprzednia decyzja niedostępna.
    </template>
  </p>
</template>
