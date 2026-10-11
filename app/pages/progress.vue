<script setup lang="ts">
useHead({ title: 'Postępy — Siłka' })
</script>

<template>
  <div>
    <UiPageHeading
      eyebrow="Każdy krok się liczy"
      title="Twoje postępy"
      description="Małe zmiany z czasem składają się na duży wynik."
    />
    <UiEmptyState
      kind="progress"
      title="Zobaczysz tu swoją drogę"
      description="Historia treningów, rekordy i wykresy pojawią się tutaj, gdy zaczniesz zapisywać swoje sesje."
    />
  </div>
</template>
