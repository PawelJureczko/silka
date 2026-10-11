import { planExportSchema } from '#shared/schemas/plans'
import type { PlanExport } from '#shared/schemas/plans'
import { maxPlanBytes } from '~/domain/plans'

export function serializePlanExport(value: PlanExport) {
  const parsed = planExportSchema.parse(value)
  const pretty = JSON.stringify(parsed, null, 2)
  if (new TextEncoder().encode(pretty).byteLength <= maxPlanBytes)
    return pretty
  const compact = JSON.stringify(parsed)
  if (new TextEncoder().encode(compact).byteLength > maxPlanBytes)
    throw new Error('Plan przekracza limit eksportu 256 KiB. Podziel go na mniejsze plany.')
  return compact
}
export function downloadPlanExport(text: string, filename = 'silka-plan.json') {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
export async function copyPlanExport(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  }
  catch {
    return false
  }
}
