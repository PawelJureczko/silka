import { activatePlan, archivePlan, fetchPlans, fetchActivePlan, planPageSize } from '~/services/plans'

export async function usePlans() {
  const client = usePlanClient()
  const { user } = useAuthState()
  const archived = ref(false)
  const page = ref(0)
  const busy = ref(false)
  const actionError = ref('')
  watch(archived, () => {
    page.value = 0
  })
  const result = await useAsyncData(() => `plans:${user.value?.id}:${archived.value}:${page.value}`, async () => {
    const [plans, activeId] = await Promise.all([fetchPlans(client, archived.value, page.value), fetchActivePlan(client)])
    return { plans, activeId }
  })
  async function mutate(action: () => Promise<void>) {
    if (busy.value)
      return
    busy.value = true
    actionError.value = ''
    try {
      await action()
      await result.refresh()
    }
    catch (cause) {
      actionError.value = cause instanceof Error ? cause.message : 'Nie udało się zapisać zmiany.'
    }
    finally {
      busy.value = false
    }
  }
  return { ...result, archived, page, busy, actionError, planPageSize,
    activate: (id: string) => mutate(() => activatePlan(client, id)),
    archive: (id: string, revision: number, value: boolean) => mutate(() => archivePlan(client, id, revision, value)),
  }
}
