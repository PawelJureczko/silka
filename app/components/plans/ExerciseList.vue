<script setup lang="ts">
import type { CatalogExercise } from '~/services/plans'

defineProps<{ exercises: CatalogExercise[], selectable: boolean }>()
const emit = defineEmits<{ select: [exercise: CatalogExercise] }>()
const conventions: Record<string, string> = { total: 'kg łącznie', per_hand: 'kg na rękę', bodyweight: 'masa ciała', assistance: 'kg asysty' }
</script>

<template>
  <ul class="divide-y divide-white/10">
    <li
      v-for="exercise in exercises"
      :key="exercise.id"
    >
      <component
        :is="selectable ? 'button' : 'div'"
        :type="selectable ? 'button' : undefined"
        class="flex min-h-20 w-full items-center justify-between gap-4 py-4 text-left"
        :class="selectable ? 'rounded-md px-3 hover:bg-interactive active:bg-interactive' : ''"
        @click="selectable && emit('select', exercise)"
      >
        <span class="min-w-0 break-words">
          <span class="block font-medium">{{ exercise.name }}</span>
          <span class="mt-1 block text-sm leading-relaxed text-secondary">{{ exercise.equipment }} · {{ exercise.muscle_group }} · {{ conventions[exercise.weight_convention] }}</span>
        </span>
        <span
          v-if="selectable"
          class="text-xl text-accent"
          aria-hidden="true"
        >+</span>
      </component>
    </li>
  </ul>
</template>
