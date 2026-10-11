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
    <header class="mx-auto flex max-w-5xl items-center justify-between px-5 py-6 sm:px-8 sm:py-8">
      <NuxtLink
        to="/"
        aria-label="Siłka — ekran startowy"
      ><UiAppBrand /></NuxtLink>
      <NuxtLink
        to="/profile"
        aria-label="Twoje konto"
        class="flex size-11 items-center justify-center rounded-full border border-white/10 bg-interactive text-sm font-semibold"
      >{{ initial }}</NuxtLink>
    </header>
    <main
      id="main"
      class="mx-auto max-w-5xl px-5 pt-5 pb-[calc(7rem+env(safe-area-inset-bottom))] sm:px-8 sm:pt-8"
      tabindex="-1"
    >
      <slot />
    </main>
    <NavigationBottomNav />
  </div>
</template>
