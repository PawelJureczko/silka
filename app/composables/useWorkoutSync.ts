import { workoutSchema } from '#shared/schemas/workouts'
import type { Workout, WorkoutJournal } from '#shared/schemas/workouts'
import { acknowledgeWorkout, queueWorkout } from '~/domain/workouts'
import { readWorkoutJournal, removeWorkoutJournal, withWorkoutLock, writeWorkoutJournal } from '~/services/workout-storage'
import { fetchPreviousSets, fetchWorkout, saveWorkout, startWorkout, WorkoutConflict } from '~/services/workouts'

export function useWorkoutSync() {
  const { user } = useAuthState()
  const client = usePlanClient()
  const journal = useState<WorkoutJournal | null>('workout:journal', () => null)
  const error = useState('workout:error', () => '')
  const storageError = useState('workout:storage-error', () => '')
  const syncing = useState('workout:syncing', () => false)
  const saving = useState('workout:saving', () => 0)
  const loadedOwner = useState<string | null>('workout:owner', () => null)
  const owned = computed(() => journal.value?.userId === user.value?.id ? journal.value : null)
  function show(next: WorkoutJournal | null, owner: string) {
    if (user.value?.id === owner)
      journal.value = next
  }
  async function store(next: WorkoutJournal) {
    if (user.value?.id !== next.userId)
      throw new Error('Konto zostało zmienione. Zaloguj się ponownie, aby kontynuować szkic.')
    await writeWorkoutJournal(next)
    show(next, next.userId)
  }
  async function loadLocal() {
    const owner = user.value?.id
    if (!owner) {
      journal.value = null
      loadedOwner.value = null
      error.value = storageError.value = ''
      return
    }
    try {
      await withWorkoutLock(owner, 'journal', async () => {
        const value = await readWorkoutJournal(owner)
        show(value, owner)
        return value
      })
      if (user.value?.id !== owner)
        return
      loadedOwner.value = owner
      storageError.value = ''
    }
    catch (cause) {
      if (user.value?.id === owner)
        storageError.value = cause instanceof Error ? cause.message : 'Lokalny zapis jest niedostępny.'
    }
  }
  async function update(action: (session: Workout) => void) {
    const owner = user.value?.id
    if (!owner)
      return false
    saving.value++
    try {
      await withWorkoutLock(owner, 'journal', async () => {
        const current = await readWorkoutJournal(owner)
        if (!current?.session || current.conflict || current.session.status !== 'active')
          throw new Error('Trening nie jest dostępny do edycji.')
        const session = workoutSchema.parse(current.session)
        action(session)
        await store(queueWorkout(current, session, crypto.randomUUID()))
      })
      storageError.value = ''
      error.value = ''
      void sync()
      return true
    }
    catch (cause) {
      error.value = cause instanceof Error ? cause.message : 'Nie udało się zabezpieczyć zmiany lokalnie.'
      return false
    }
    finally {
      saving.value--
    }
  }
  async function sync() {
    const owner = user.value?.id
    if (!owner || syncing.value || storageError.value || !navigator.onLine)
      return
    syncing.value = true
    try {
      await withWorkoutLock(owner, 'sync', async () => {
        while (user.value?.id === owner) {
          let current = await withWorkoutLock(owner, 'journal', async () => {
            const value = await readWorkoutJournal(owner)
            show(value, owner)
            return value
          })
          if (!current || current.conflict)
            break
          if (current.start) {
            await startWorkout(client, current.sessionId, current.start.workoutId, current.start.planRevision)
            const session = await fetchWorkout(client, current.sessionId)
            const previous = await fetchPreviousSets(client, current.sessionId).catch(() => [])
            await withWorkoutLock(owner, 'journal', async () => {
              const latest = await readWorkoutJournal(owner)
              if (latest && latest.sessionId === current?.sessionId && latest.start)
                await store({ ...latest, start: null, session, serverRevision: session.revision, previous })
            })
            continue
          }
          if (!current.queue.length)
            break
          current = await withWorkoutLock(owner, 'journal', async () => {
            const latest = await readWorkoutJournal(owner)
            if (!latest?.queue[0] || latest.conflict || latest.start || latest.serverRevision === null)
              throw new Error('Nie można przygotować zapisu.')
            latest.queue[0].baseRevision ??= latest.serverRevision
            await store(latest)
            return latest
          })
          const head = current.queue[0]!
          if (user.value?.id !== owner || head.baseRevision === null)
            break
          const revision = await saveWorkout(client, current.sessionId, head.baseRevision, head.operationId, head.payload)
          await withWorkoutLock(owner, 'journal', async () => {
            const latest = await readWorkoutJournal(owner)
            if (latest?.sessionId === current?.sessionId)
              await store(acknowledgeWorkout(latest, head.operationId, revision))
          })
        }
      })
      if (user.value?.id === owner)
        error.value = ''
    }
    catch (cause) {
      if (user.value?.id !== owner)
        return
      error.value = cause instanceof Error ? cause.message : 'Synchronizacja nie powiodła się. Szkic pozostaje lokalnie.'
      if (cause instanceof WorkoutConflict) {
        await withWorkoutLock(owner, 'journal', async () => {
          const latest = await readWorkoutJournal(owner)
          if (latest)
            await store({ ...latest, conflict: true })
        }).catch(() => {
          storageError.value = 'Nie można zapisać stanu konfliktu. Zachowaj otwartą kartę.'
        })
      }
    }
    finally {
      syncing.value = false
    }
  }
  async function begin(workoutId: string, planRevision: number): Promise<string | null> {
    const owner = user.value?.id
    if (!owner)
      return null
    const id = crypto.randomUUID()
    try {
      await withWorkoutLock(owner, 'journal', async () => {
        const existing = await readWorkoutJournal(owner)
        if (existing && (existing.start || existing.queue.length || existing.session?.status === 'active'))
          throw new Error('Najpierw wznów poprzedni trening lub dokończ jego synchronizację.')
        await store({ schemaVersion: 1, userId: owner, sessionId: id, start: { workoutId, planRevision }, session: null, previous: [], serverRevision: null, queue: [], conflict: false })
      })
      void sync()
      return id
    }
    catch (cause) {
      error.value = cause instanceof Error ? cause.message : 'Nie można rozpocząć treningu.'
      return null
    }
  }
  async function adopt(session: Workout, discard = false) {
    const owner = user.value?.id
    if (!owner || session.userId !== owner)
      throw new Error('Trening należy do innego konta.')
    await withWorkoutLock(owner, 'journal', async () => {
      const current = await readWorkoutJournal(owner)
      if (!discard && current?.sessionId === session.id && (current.queue.length || current.conflict || (current.serverRevision ?? 0) > session.revision))
        return
      if (!discard && current && (current.start || current.queue.length || current.conflict || (current.session?.status === 'active' && current.sessionId !== session.id)))
        throw new Error('Najpierw rozstrzygnij lokalny szkic treningu.')
      await store({ schemaVersion: 1, userId: owner, sessionId: session.id, session, serverRevision: session.revision, previous: [], queue: [], start: null, conflict: false })
    })
    error.value = ''
    const previous = await fetchPreviousSets(client, session.id).catch(() => [])
    await withWorkoutLock(owner, 'journal', async () => {
      const latest = await readWorkoutJournal(owner)
      if (latest?.sessionId === session.id)
        await store({ ...latest, previous })
    })
  }
  async function cancelStart() {
    const owner = user.value?.id
    if (!owner || syncing.value)
      return
    await withWorkoutLock(owner, 'journal', async () => {
      const current = await readWorkoutJournal(owner)
      // A definite RPC rejection rolls back start; an uncertain timeout is not cancellable.
      if (!current?.conflict || !current.start || current.session)
        return
      await removeWorkoutJournal(owner)
      show(null, owner)
      error.value = ''
    })
  }
  return { journal: owned, error, storageError, syncing, saving, loadedOwner, loadLocal, sync, update, begin, adopt, cancelStart }
}
