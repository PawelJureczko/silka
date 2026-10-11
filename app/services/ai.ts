import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '#shared/types/database.generated'
import { aiRequestSchema, aiResultSchema, aiResponseSchema, recentAiSchema } from '#shared/schemas/ai'
import type { AiAction, AiResponse, AiSelection } from '#shared/schemas/ai'

type Client = SupabaseClient<Database>
function request(row: Database['public']['Tables']['ai_consultations']['Row']) {
  return aiRequestSchema.parse({ id: row.id, action: row.action, planId: row.plan_id, baseRevision: row.base_revision, context: row.context, applied: row.applied_hash !== null, response: row.applied_response, result: row.result })
}
function failure(error: { code?: string }) {
  if (error.code === 'PT409') return new Error('Plan zmienił się od przygotowania promptu. Rozpocznij nową konsultację na aktualnych danych.')
  if (error.code === '42501') return new Error('Konsultacja, plan lub ćwiczenie są niedostępne dla tego konta. Odśwież dane.')
  if (['23514', '22023', '22P02'].includes(error.code ?? '')) return new Error('Odpowiedź lub wybór serii nie spełnia zasad konsultacji. Sprawdź dane i limity.')
  return new Error('Nie udało się obsłużyć konsultacji. Sprawdź połączenie i spróbuj ponownie.')
}
export async function prepareAi(client: Client, id: string, action: AiAction, planId: string | null, historyLimit: number, instructions: string) {
  const args = { p_id: id, p_action: action, p_history_limit: historyLimit, p_instructions: instructions }
  const query = planId ? client.rpc('prepare_ai_consultation', { ...args, p_plan_id: planId }) : client.rpc('prepare_ai_without_plan', args)
  const { data, error } = await query.abortSignal(AbortSignal.timeout(15000))
  if (error || !data) throw failure(error ?? {})
  return request(data)
}
export async function fetchAi(client: Client, id: string) {
  const { data, error } = await client.from('ai_consultations').select('*').eq('id', id).abortSignal(AbortSignal.timeout(12000)).single()
  if (error || !data) throw failure(error ?? {})
  return request(data)
}
export async function recentAi(client: Client) {
  const { data, error } = await client.from('ai_consultations').select('id,action,created_at,applied_hash').order('created_at', { ascending: false }).order('id').limit(10).abortSignal(AbortSignal.timeout(12000))
  if (error) throw failure(error)
  return recentAiSchema.parse(data)
}
export async function applyAi(client: Client, id: string, response: AiResponse, selections: AiSelection[]) {
  const value = aiResponseSchema.parse(response)
  const { data, error } = await client.rpc('apply_ai_response', { p_request_id: id, p_response: JSON.stringify(value), p_selections: selections }).abortSignal(AbortSignal.timeout(15000))
  if (error) throw failure(error)
  return aiResultSchema.parse(data)
}
