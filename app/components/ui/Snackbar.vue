<script setup lang="ts">
const props = defineProps<{ notice: { id: number, message: string } | null }>()
const emit = defineEmits<{ close: [] }>()
let timeout: ReturnType<typeof setTimeout> | undefined
function stop() {
  clearTimeout(timeout)
}
function start() {
  stop()
  if (props.notice) timeout = setTimeout(() => emit('close'), 5000)
}
watch(() => props.notice?.id, start, { immediate: true })
onBeforeUnmount(stop)
</script>

<template>
  <div
    class="pointer-events-none fixed right-5 bottom-[calc(6rem+env(safe-area-inset-bottom))] left-5 z-50 mx-auto max-w-sm"
    role="status"
    aria-live="polite"
    aria-atomic="true"
  >
    <div
      v-if="notice"
      :key="notice.id"
      class="pointer-events-auto flex min-h-14 items-center justify-between gap-4 rounded-lg border border-secondary/70 bg-surface py-1 pl-5 shadow-lg"
      @mouseenter="stop"
      @mouseleave="start"
      @focusin="stop"
      @focusout="start"
    >
      <p class="font-medium">
        {{ notice.message }}
      </p>
      <button
        type="button"
        class="mr-1 flex size-11 shrink-0 items-center justify-center rounded-md text-secondary hover:bg-interactive active:bg-interactive"
        aria-label="Zamknij komunikat"
        @click="emit('close')"
      >
        ×
      </button>
    </div>
  </div>
</template>
