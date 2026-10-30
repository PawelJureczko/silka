import type { Workout, WorkoutExercise } from '../../shared/schemas/workouts.ts'
import { workoutSchema } from '../../shared/schemas/workouts.ts'

type Replacement = { id: string, name: string, equipment: string, loadMode: WorkoutExercise['loadMode'], weightConvention: WorkoutExercise['weightConvention'] }

export function replaceWorkoutExercise(value: Workout, id: string, replacement: Replacement, newId: () => string): { session: Workout, selectedSetId: string } {
  const session = workoutSchema.parse(value)
  const exercise = session.exercises.find(item => item.id === id)
  if (session.status !== 'active' || !exercise) throw new Error('Ćwiczenie nie jest dostępne do podmiany.')
  if (exercise.exerciseId === replacement.id) throw new Error('Wybierz inne ćwiczenie.')
  const pending = exercise.sets.filter(set => set.status === 'pending')
  if (!pending.length) throw new Error('To ćwiczenie nie ma już oczekujących serii.')
  const preserve = exercise.sets.some(set => set.status !== 'pending')
  if (preserve && session.exercises.length >= 20) throw new Error('Trening ma już 20 ćwiczeń. Nie można dodać zamiennika z zachowaniem wykonanych serii.')
  const next: WorkoutExercise = {
    id: preserve ? newId() : exercise.id, exerciseId: replacement.id, name: replacement.name, equipment: replacement.equipment,
    loadMode: replacement.loadMode, weightConvention: replacement.weightConvention, restSeconds: exercise.restSeconds, notes: '',
    sets: pending.map(set => ({ ...set, id: preserve ? newId() : set.id, plannedWeightKg: null, reps: null, weightKg: null, completedAt: null })),
  }
  if (preserve) {
    for (const set of pending) Object.assign(set, { status: 'skipped', reps: null, weightKg: null })
    session.exercises.push(next)
  }
  else session.exercises[session.exercises.indexOf(exercise)] = next
  return { session: workoutSchema.parse(session), selectedSetId: next.sets[0]!.id }
}
