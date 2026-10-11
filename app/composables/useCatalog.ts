import { catalogPageSize, fetchCatalog } from '~/services/plans'
import type { CatalogExercise } from '~/services/plans'

export function useCatalog() {
  const client = usePlanClient()
  const items = ref<CatalogExercise[]>([])
  const search = ref('')
  const pending = ref(false)
  const error = ref('')
  const hasMore = ref(false)
  let page = 0
  let request = 0

  async function load(more = false) {
    const current = ++request
    if (!more) page = 0
    pending.value = true
    error.value = ''
    try {
      const rows = await fetchCatalog(client, search.value, more ? page + 1 : 0)
      if (current !== request) return
      if (more) page++
      items.value = more ? [...items.value, ...rows] : rows
      hasMore.value = rows.length === catalogPageSize
    }
    catch (cause) { if (current === request) error.value = cause instanceof Error ? cause.message : 'Nie udało się pobrać ćwiczeń.' }
    finally { if (current === request) pending.value = false }
  }
  return { items, search, pending, error, hasMore, load }
}
