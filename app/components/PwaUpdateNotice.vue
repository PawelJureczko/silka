<script setup lang="ts">
const pwa = usePwaState()
const route = useRoute()
const { $pwa } = useNuxtApp()
const dismissed = ref(false)
watch(() => pwa.value.updateAvailable, () => {
  dismissed.value = false
})
function resume() {
  if (document.visibilityState === 'visible') dismissed.value = false
}
onMounted(() => document.addEventListener('visibilitychange', resume))
onBeforeUnmount(() => document.removeEventListener('visibilitychange', resume))
</script>

<template>
  <UiDialog
    v-if="pwa.updateAvailable && !dismissed && route.path === '/'"
    title="Dostępna aktualizacja"
    :busy="pwa.busy"
    @close="dismissed = true"
  >
    <div class="space-y-4">
      <p class="leading-relaxed text-secondary">
        Nowa wersja Siłki jest gotowa. Aktualizacja sprawdzi zapisane serie i otworzy aplikację ponownie. Możesz też wrócić do niej po treningu.
      </p>
      <p
        v-if="pwa.message"
        role="status"
        class="text-sm"
      >
        {{ pwa.message }}
      </p>
      <div class="flex flex-wrap gap-3">
        <UiBaseButton
          :busy="pwa.busy"
          @click="$pwa.update()"
        >
          Aktualizuj
        </UiBaseButton>
        <UiBaseButton
          variant="secondary"
          :disabled="pwa.busy"
          @click="dismissed = true"
        >
          Na później
        </UiBaseButton>
      </div>
    </div>
  </UiDialog>
</template>
