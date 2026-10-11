import type { WorkoutJournal } from '../../shared/schemas/workouts.ts'

export function blocksPwaUpdate(journal: WorkoutJournal | null) {
  return Boolean(journal && (journal.start || journal.queue.length || journal.conflict || journal.session?.status === 'active'))
}
