<script setup lang="ts">
const items = [
  { to: '/', label: 'Start', icon: 'home' },
  { to: '/plans', label: 'Plany', icon: 'plan' },
  { to: '/progress', label: 'Postępy', icon: 'progress' },
  { to: '/profile', label: 'Profil', icon: 'user' },
] as const
</script>

<template>
  <nav
    aria-label="Główna nawigacja"
    class="fixed inset-x-0 bottom-0 z-20 border-t border-white/8 bg-background/95 px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-xl sm:inset-x-auto sm:bottom-5 sm:left-1/2 sm:w-[440px] sm:-translate-x-1/2 sm:rounded-3xl sm:border sm:bg-surface/95 sm:px-3 sm:pb-2"
  >
    <div class="grid grid-cols-4">
      <NuxtLink
        v-for="item in items"
        :key="item.to"
        v-slot="{ isExactActive }"
        :to="item.to"
        class="flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl text-xs font-medium text-secondary transition-colors hover:text-primary"
        exact-active-class="bg-accent/8 text-accent"
      >
        <UiAppIcon
          :name="item.icon"
          :stroke-width="isExactActive ? 2 : 1.7"
        />
        {{ item.label }}
      </NuxtLink>
    </div>
  </nav>
</template>
