<script setup lang="ts">
import { exerciseGuide } from '~/domain/exercise-guides'

const props = defineProps<{ name: string }>()
const guide = computed(() => exerciseGuide(props.name))
</script>

<template>
  <div>
    <a
      :href="guide.url"
      target="_blank"
      rel="noopener noreferrer"
      class="inline-flex min-h-11 items-center py-2 text-sm text-primary underline decoration-secondary underline-offset-4 hover:decoration-primary"
      :aria-label="`${guide.direct ? 'Instrukcja' : 'Biblioteka'} ${guide.source}: ${name}. Otwiera nową kartę.`"
    >
      {{ guide.direct ? 'Jak wykonać?' : 'Biblioteka ćwiczeń' }} · {{ guide.source }}
      <span class="sr-only"> (nowa karta)</span>
    </a>
    <p
      v-if="guide.note"
      class="max-w-prose pb-2 text-xs leading-relaxed text-secondary"
    >
      {{ guide.note }}
    </p>
  </div>
</template>
