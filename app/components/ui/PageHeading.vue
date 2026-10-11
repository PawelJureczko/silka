<script setup lang="ts">
defineProps<{ eyebrow?: string, title: string, description?: string }>()
</script>

<template>
  <div class="page-heading">
    <p
      v-if="eyebrow"
      class="eyebrow mb-3"
    >
      {{ eyebrow }}
    </p>
    <h1 class="page-title">
      {{ title }}
    </h1>
    <p
      v-if="description"
      class="mt-3 max-w-lg text-sm leading-relaxed text-secondary sm:text-base"
    >
      {{ description }}
    </p>
  </div>
</template>
