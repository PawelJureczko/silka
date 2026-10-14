import { fetchCompleteCatalog } from '~/services/plans'
import type { CatalogExercise } from '~/services/plans'
import { filterCatalog, groupCatalog } from '~/domain/catalog'

export function useCatalog() {
  const client = usePlanClient()
  const catalog = ref<CatalogExercise[]>([])
  const search = ref('')
  const pending = ref(false)
  const error = ref('')
  let request = 0
  const items = computed(() => filterCatalog(catalog.value, search.value))
  const groups = computed(() => groupCatalog(items.value))
  const muscleGroups = computed(() => groupCatalog(catalog.value).map(group => group.name))
  const total = computed(() => catalog.value.length)

  async function load() {
    const current = ++request
    pending.value = true
    error.value = ''
    try {
      const rows = await fetchCompleteCatalog(client)
      if (current !== request) return
      catalog.value = rows
    }
    catch (cause) { if (current === request) error.value = cause instanceof Error ? cause.message : 'Nie udało się pobrać ćwiczeń.' }
    finally { if (current === request) pending.value = false }
  }
  return { items, groups, muscleGroups, total, search, pending, error, load }
}
