<script setup lang="ts">
useHead({ title: 'Import planu — Siłka' })
</script>

<template>
  <div>
    <NuxtLink
      to="/plans"
      class="mb-5 inline-flex min-h-11 items-center text-sm text-secondary"
    >← Wszystkie plany</NuxtLink><UiPageHeading
      eyebrow="Własna kopia"
      title="Importuj plan"
      description="Sprawdź zawartość i dopasuj ćwiczenia. Zapis nastąpi dopiero po zatwierdzeniu."
    /><PlansImport />
  </div>
</template>
