<script setup lang="ts">
defineProps<{ kind: 'plan' | 'progress', title: string, description: string }>()
</script>

<template>
  <section class="border-y border-dashed border-secondary/50 py-8 sm:py-10">
    <p class="mb-3 text-xs text-secondary">
      {{ kind === 'plan' ? 'Twój plan' : 'Twoje wyniki' }}
    </p>
    <h2 class="max-w-sm text-2xl font-bold tracking-tight">
      {{ title }}
    </h2>
    <p class="mt-3 max-w-md text-sm leading-relaxed text-secondary">
      {{ description }}
    </p>
    <slot />
  </section>
</template>
