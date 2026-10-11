<script setup lang="ts">
useHead({ title: 'Start — Siłka' })
const { data: profile, status, error, refresh } = await useProfile()
const greeting = computed(() => profile.value?.display_name ? `Cześć, ${profile.value.display_name.split(' ')[0]}.` : 'Twój trening.')
const timezone = computed(() => profile.value?.timezone ?? 'Europe/Warsaw')
const date = computed(() => new Intl.DateTimeFormat('pl-PL', { weekday: 'long', day: 'numeric', month: 'long', timeZone: timezone.value }).format(new Date()))
</script>

<template>
  <div>
    <UiPageHeading
      :eyebrow="date"
      :title="greeting"
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
    <WorkoutDashboard :timezone="timezone" />
  </div>
</template>
