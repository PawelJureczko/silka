export function usePlanClient() {
  const { $supabase } = useNuxtApp()
  if (!$supabase) throw new Error('Połączenie z kontem jest chwilowo niedostępne.')
  return $supabase
}
