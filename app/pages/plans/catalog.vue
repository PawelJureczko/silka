<script setup lang="ts">
useHead({ title: 'Katalog ćwiczeń — Siłka' })
</script>

<template>
  <div>
    <NuxtLink
      to="/plans"
      class="mb-5 inline-flex min-h-11 items-center text-sm text-secondary"
    >← Wszystkie plany</NuxtLink>
    <UiPageHeading
      eyebrow="Twoje narzędzia"
      title="Katalog ćwiczeń"
      description="Wspólna baza ćwiczeń dla wszystkich użytkowników Siłki. Każde z jasnym sposobem liczenia ciężaru."
    />
    <PlansExercisePicker browse />
  </div>
</template>
