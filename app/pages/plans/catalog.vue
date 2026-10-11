<script setup lang="ts">
useHead({ title: 'Katalog ćwiczeń — Siłka' })
const message = ref('')
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
      description="Wspólny katalog i własne ćwiczenia. Każde z jasnym sposobem liczenia ciężaru."
    />
    <p
      v-if="message"
      role="status"
      class="mb-4 text-sm text-accent"
    >
      {{ message }}
    </p>
    <PlansExercisePicker
      @select="message = `${$event.name} jest dostępne w katalogu. Dodasz je w edytorze planu.`"
      @close="navigateTo('/plans')"
    />
  </div>
</template>
