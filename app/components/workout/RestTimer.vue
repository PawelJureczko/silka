<script setup lang="ts">
import { restRemaining } from '~/domain/workouts'

const props = defineProps<{
  endsAt: string | null
  disabled?: boolean
}>()
defineEmits<{
  stop: []
  extend: []
}>()
const now = ref(Date.now())
const remaining = computed(() => restRemaining(props.endsAt, now.value))
const label = computed(() => `${Math.floor(remaining.value / 60)}:${String(remaining.value % 60).padStart(2, '0')}`)
let timer: ReturnType<typeof setInterval> | undefined
const tick = () => {
  now.value = Date.now()
}
watch(() => props.endsAt, tick)
onMounted(() => {
  timer = setInterval(tick, 1000)
  document.addEventListener('visibilitychange', tick)
})
onBeforeUnmount(() => {
  clearInterval(timer)
  document.removeEventListener('visibilitychange', tick)
})
</script>

<template>
  <section
    v-if="endsAt"
    class="sticky top-3 z-10 mb-5 flex items-center justify-between gap-3 rounded-2xl border border-accent/20 bg-surface p-4 shadow-lg"
    aria-label="Minutnik odpoczynku"
  >
    <div>
      <p class="text-xs text-secondary">
        {{ remaining ? 'Odpoczynek' : 'Możesz zacząć serię' }}
      </p><p
        class="mt-1 text-3xl font-semibold tabular-nums text-accent"
        role="timer"
        aria-label="Pozostały odpoczynek"
      >
        {{ label }}
      </p>
    </div>
    <div class="flex gap-2">
      <button
        class="button-secondary px-3 text-sm"
        :disabled="disabled"
        @click="$emit('extend')"
      >
        +30 s
      </button><button
        class="button-secondary px-3 text-sm"
        :disabled="disabled"
        @click="$emit('stop')"
      >
        Zakończ
      </button>
    </div>
  </section>
</template>
