type Exercise = { id: string, name: string, equipment: string, muscle_group: string }
const collator = new Intl.Collator('pl', { sensitivity: 'base', numeric: true })

function normalize(value: string) {
  return value.toLocaleLowerCase('pl').normalize('NFD').replace(/\p{M}/gu, '').replaceAll('ł', 'l')
}

export function filterCatalog<T extends Exercise>(items: T[], search: string): T[] {
  const terms = normalize(search).trim().split(/\s+/).filter(Boolean)
  return items.filter((item) => {
    const text = normalize(`${item.name} ${item.equipment} ${item.muscle_group}`)
    return terms.every(term => text.includes(term))
  }).sort((a, b) => collator.compare(a.name, b.name) || a.id.localeCompare(b.id))
}

export function groupCatalog<T extends Exercise>(items: T[]) {
  const groups = new Map<string, T[]>()
  for (const item of filterCatalog(items, '')) {
    const name = item.muscle_group.trim() || 'Pozostałe'
    const group = groups.get(name) ?? []
    group.push(item)
    groups.set(name, group)
  }
  return [...groups].sort(([a], [b]) => collator.compare(a, b)).map(([name, exercises]) => ({ name, exercises }))
}
