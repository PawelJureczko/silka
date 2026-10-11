<script setup lang="ts">
useHead({ title: 'Plany — Siłka' })
</script>

<template>
  <div>
    <UiPageHeading
      eyebrow="Twój rytm tygodnia"
      title="Plany treningowe"
      description="Miejsce na ćwiczenia dopasowane do Ciebie."
    />
    <UiEmptyState
      kind="plan"
      title="Tu zaczyna się Twój plan"
      description="Wkrótce ułożysz tu jednostki treningowe, dodasz ćwiczenia i zaplanujesz serie. Wszystko we własnym tempie."
    />
  </div>
</template>
