import { nextLoadDecisionSchema } from '../../shared/schemas/workouts.ts'
import type { NextLoadDecision, Workout } from '../../shared/schemas/workouts.ts'

export const loadDecisionLabels: Record<NextLoadDecision, string> = {
  progress: 'Progres', maintain: 'Zostaw', reduce: 'Lżej',
}

export function changeLoadDecision(session: Workout, sessionId: string, exerciseId: string, decision: NextLoadDecision, expectedCatalogId: string) {
  nextLoadDecisionSchema.parse(decision)
  if (session.id !== sessionId || !['active', 'completed'].includes(session.status))
    throw new Error('Otwórz właściwy aktywny lub zakończony trening.')
  const exercise = session.exercises.find(item => item.id === exerciseId)
  if (!exercise || exercise.exerciseId !== expectedCatalogId) throw new Error('Ćwiczenie zmieniło się. Wybierz decyzję ponownie.')
  if (exercise.nextLoadDecision === decision) return false
  exercise.nextLoadDecision = decision
}
