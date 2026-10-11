<script setup lang="ts">
useHead({ title: 'Start — Siłka' })
const { data: profile, status, error, refresh } = await useProfile()
const greeting = computed(() => profile.value?.display_name ? `Cześć, ${profile.value.display_name.split(' ')[0]}.` : 'Dobrze Cię widzieć.')
const date = new Intl.DateTimeFormat('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())
</script>

<template>
  <div>
    <UiPageHeading
      :eyebrow="date"
      :title="greeting"
      description="Zrób dziś coś dla siebie. Resztę ogarniemy po drodze."
    />
    <div
      v-if="error"
      role="alert"
      class="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-400/20 bg-red-400/8 p-4 text-sm"
    >
      <p>Nie udało się pobrać profilu.</p><UiBaseButton
        variant="secondary"
        :busy="status === 'pending'"
        @click="refresh()"
      >
        Spróbuj ponownie
      </UiBaseButton>
    </div>
    <section
      class="panel relative overflow-hidden p-6 sm:p-9"
      aria-labelledby="next-title"
    >
      <div
        class="absolute top-0 right-0 h-44 w-44 rounded-full bg-accent/5 blur-3xl"
        aria-hidden="true"
      />
      <div class="relative">
        <div class="mb-8 flex items-center justify-between">
          <p class="eyebrow">
            Twoja kolej
          </p><span class="flex size-11 items-center justify-center rounded-2xl bg-accent/10 text-accent"><UiAppIcon
            name="dumbbell"
            class="size-6"
          /></span>
        </div>
        <h2
          id="next-title"
          class="max-w-md text-3xl leading-tight font-semibold tracking-tight sm:text-4xl"
        >
          Dobry trening zaczyna się od planu.
        </h2>
        <p class="mt-4 max-w-md leading-relaxed text-secondary">
          Twoje ćwiczenia, Twój rytm tygodnia. Wszystko w jednym miejscu, zawsze pod ręką.
        </p>
        <NuxtLink
          to="/plans"
          class="button-primary mt-7"
        >Przejdź do planów<UiAppIcon name="arrow" /></NuxtLink>
      </div>
    </section>
    <div class="mt-5 grid gap-5 sm:grid-cols-2">
      <NuxtLink
        to="/progress"
        class="panel group p-6 transition-colors hover:border-accent/30"
      ><div class="mb-5 flex items-center justify-between"><UiAppIcon
        name="progress"
        class="size-6 text-accent"
      /><UiAppIcon
        name="arrow"
        class="text-secondary transition-transform group-hover:translate-x-1"
      /></div><h2 class="text-lg font-semibold">Zobacz, jak rośniesz</h2><p class="mt-2 text-sm leading-relaxed text-secondary">Historia i postępy pomogą Ci zauważyć każdy mały krok.</p></NuxtLink>
      <section class="panel p-6">
        <UiAppIcon
          name="clock"
          class="mb-5 size-6 text-secondary"
        /><h2 class="text-lg font-semibold">
          Regularność robi różnicę
        </h2><p class="mt-2 text-sm leading-relaxed text-secondary">
          Nie musisz robić wszystkiego naraz. Znajdź tempo, do którego chce się wracać.
        </p>
      </section>
    </div>
  </div>
</template>
