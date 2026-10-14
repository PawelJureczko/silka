<script setup lang="ts">
const route = useRoute()
const manual = computed(() => route.query.mode === 'manual')
useHead({ title: 'Nowy plan · Siłka' })
</script>

<template>
  <PlansEditor v-if="manual" />
  <div
    v-else
    class="max-w-3xl"
  >
    <NuxtLink
      to="/plans"
      class="mb-4 inline-flex min-h-11 items-center text-sm text-secondary"
    >← Plany</NuxtLink>
    <UiPageHeading
      title="Zacznij od siebie."
      description="Wybierz, jak przygotujesz swój nowy plan treningowy."
    />
    <section class="border-b border-white/15 py-6">
      <h2 class="text-2xl font-bold">
        Stwórz nowy plan
      </h2>
      <p class="mt-3 max-w-xl leading-relaxed text-secondary">
        Odpowiedz na pytania o cel, czas, sprzęt i ograniczenia. Skopiuj gotowy prompt do wybranego AI i wróć z propozycją do sprawdzenia. Nie potrzebujesz wcześniejszych treningów.
      </p>
      <NuxtLink
        to="/plans/ai"
        class="button-primary mt-5"
      >Wypełnij ankietę</NuxtLink>
    </section>
    <section class="py-6">
      <h2 class="text-xl font-semibold">
        Ułóż plan samodzielnie
      </h2>
      <p class="mt-3 text-secondary">
        Dodaj jednostki, wybierz ćwiczenia i ustal serie we własnym tempie.
      </p>
      <NuxtLink
        to="/plans/new?mode=manual"
        class="button-secondary mt-5"
      >Otwórz pusty edytor</NuxtLink>
    </section>
  </div>
</template>
