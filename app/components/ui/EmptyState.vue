<script setup lang="ts">
defineProps<{ kind: 'plan' | 'progress', title: string, description: string }>()
</script>

<template>
  <section class="panel flex min-h-72 flex-col items-center justify-center px-6 py-12 text-center">
    <span class="mb-6 flex size-16 items-center justify-center rounded-2xl border border-accent/15 bg-accent/8 text-accent">
      <UiAppIcon
        :name="kind"
        class="size-7"
      />
    </span>
    <h2 class="text-xl font-semibold tracking-tight">
      {{ title }}
    </h2>
    <p class="mt-3 max-w-sm leading-relaxed text-secondary">
      {{ description }}
    </p>
    <slot />
  </section>
</template>
