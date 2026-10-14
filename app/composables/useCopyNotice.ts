import { copyPlanExport } from '~/services/plan-transfer'

export function useCopyNotice() {
  const notice = ref<{ id: number, message: string } | null>(null)
  let sequence = 0
  async function copyWithNotice(text: string) {
    const copied = await copyPlanExport(text)
    notice.value = { id: ++sequence, message: copied ? 'Skopiowano' : 'Nie udało się skopiować.' }
    return copied
  }
  return { notice, copyWithNotice }
}
