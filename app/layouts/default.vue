<script setup lang="ts">
const { user } = useAuth()
const initial = computed(() => user.value?.email?.slice(0, 1).toUpperCase() ?? 'S')
</script>

<template>
  <div class="min-h-dvh pt-[env(safe-area-inset-top)]">
    <a
      href="#main"
      class="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-xl focus:bg-accent focus:p-4 focus:text-background"
    >Przejdź do treści</a>
    <header class="app-header">
      <NuxtLink
        to="/"
        aria-label="Siłka: ekran startowy"
        class="inline-flex min-h-11 items-center"
      ><UiAppBrand /></NuxtLink>
      <NavigationBottomNav />
      <NuxtLink
        to="/profile"
        aria-label="Twoje konto"
        class="flex size-11 shrink-0 items-center justify-center rounded-md border border-secondary/60 text-sm font-semibold"
      >{{ initial }}</NuxtLink>
    </header>
    <main
      id="main"
      class="app-main"
      tabindex="-1"
    >
      <slot />
    </main>
  </div>
</template>
