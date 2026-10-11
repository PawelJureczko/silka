<script setup lang="ts">
defineProps<{ eyebrow: string, title: string, description?: string }>()
</script>

<template>
  <div class="mb-8">
    <p class="eyebrow mb-3">
      {{ eyebrow }}
    </p>
    <h1 class="text-3xl font-bold tracking-tight sm:text-4xl">
      {{ title }}
    </h1>
    <p
      v-if="description"
      class="mt-3 max-w-xl leading-relaxed text-secondary"
    >
      {{ description }}
    </p>
  </div>
</template>
