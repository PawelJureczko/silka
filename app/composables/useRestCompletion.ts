import type { Ref } from 'vue'

export function useRestCompletion(endsAt: Ref<string | null>, enabled: Ref<boolean>, complete: (end: string) => Promise<boolean>) {
  let timer: ReturnType<typeof setInterval> | undefined
  let attempted: string | null = null
  let running = false
  async function check() {
    const end = endsAt.value
    if (!end || !enabled.value || running || attempted === end || document.visibilityState !== 'visible' || Date.parse(end) > Date.now()) return
    attempted = end
    running = true
    try {
      await complete(end)
    }
    finally {
      running = false
    }
  }
  watch(endsAt, (end, previous) => {
    if (end !== previous) attempted = null
    if (import.meta.client) void check()
  })
  watch(enabled, () => {
    if (import.meta.client) void check()
  })
  onMounted(() => {
    timer = setInterval(() => {
      void check()
    }, 500)
    document.addEventListener('visibilitychange', check)
    void check()
  })
  onBeforeUnmount(() => {
    clearInterval(timer)
    document.removeEventListener('visibilitychange', check)
  })
}
