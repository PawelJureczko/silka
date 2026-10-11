<script setup lang="ts">
const route = useRoute()
const items = [
  { to: '/', label: 'Start', icon: 'home' },
  { to: '/plans', label: 'Plany', icon: 'plan' },
  { to: '/progress', label: 'Postępy', icon: 'progress' },
  { to: '/profile', label: 'Profil', icon: 'user' },
] as const
function isActive(to: string) {
  return to === '/' ? route.path === '/' || route.path.startsWith('/workouts/') : route.path === to || route.path.startsWith(`${to}/`)
}
</script>

<template>
  <nav
    aria-label="Główna nawigacja"
    class="fixed inset-x-0 bottom-0 z-20 border-t border-white/15 bg-background px-3 pt-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] min-[1000px]:static min-[1000px]:border-0 min-[1000px]:p-0"
  >
    <div class="mx-auto grid max-w-lg grid-cols-4 gap-2 min-[1000px]:flex min-[1000px]:gap-1">
      <NuxtLink
        v-for="item in items"
        :key="item.to"
        :to="item.to"
        :aria-current="isActive(item.to) ? 'page' : undefined"
        class="flex min-h-14 flex-col items-center justify-center gap-1 border-t-2 text-xs font-medium transition-colors hover:text-primary min-[1000px]:min-h-11 min-[1000px]:flex-row min-[1000px]:gap-2 min-[1000px]:px-4 min-[1000px]:text-sm"
        :class="isActive(item.to) ? 'border-accent text-primary' : 'border-transparent text-secondary'"
      >
        <UiAppIcon
          :name="item.icon"
          :stroke-width="isActive(item.to) ? 2.5 : 1.8"
          class="size-5 min-[1000px]:size-4"
        />
        {{ item.label }}
      </NuxtLink>
    </div>
  </nav>
</template>
