import { workoutJournalSchema } from '#shared/schemas/workouts'
import type { WorkoutJournal } from '#shared/schemas/workouts'

let channel: BroadcastChannel | null = null
export function workoutChannel() {
  channel ??= new BroadcastChannel('silka-workouts')
  return channel
}
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('silka-workouts', 1)
    request.onupgradeneeded = () => request.result.createObjectStore('journals', { keyPath: 'userId' })
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(new Error('Nie można otworzyć lokalnego zapisu treningu.'))
    request.onblocked = () => reject(new Error('Zamknij inne karty Siłki i ponów otwarcie treningu.'))
  })
}
export async function readWorkoutJournal(userId: string): Promise<WorkoutJournal | null> {
  const db = await openDatabase()
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction('journals', 'readonly')
      const request = tx.objectStore('journals').get(userId)
      let value: unknown
      request.onsuccess = () => {
        value = request.result
      }
      tx.oncomplete = () => {
        if (value === undefined)
          return resolve(null)
        const result = workoutJournalSchema.safeParse(value)
        if (!result.success || result.data.userId !== userId)
          return reject(new Error('Nie można odczytać lokalnego szkicu. Nie został usunięty.'))
        resolve(result.data)
      }
      tx.onerror = tx.onabort = () => reject(new Error('Nie udało się odczytać lokalnego szkicu.'))
    })
  }
  finally {
    db.close()
  }
}
export async function writeWorkoutJournal(journal: WorkoutJournal): Promise<void> {
  const value = workoutJournalSchema.parse(journal)
  const db = await openDatabase()
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('journals', 'readwrite', { durability: 'strict' })
      tx.objectStore('journals').put(value)
      tx.oncomplete = () => resolve()
      tx.onerror = tx.onabort = () => reject(new Error('Brak lokalnego zapisu. Sprawdź wolne miejsce; zmiana nie została wysłana.'))
    })
    workoutChannel().postMessage({ userId: value.userId })
  }
  finally {
    db.close()
  }
}
export async function withWorkoutLock<T>(userId: string, kind: 'journal' | 'sync', action: () => Promise<T>): Promise<T> {
  if (!navigator.locks)
    throw new Error('Ta przeglądarka nie obsługuje bezpiecznego zapisu treningu. Zaktualizuj Safari lub użyj nowszej przeglądarki.')
  return navigator.locks.request(`silka:${kind}:${userId}`, action)
}
export async function removeWorkoutJournal(userId: string): Promise<void> {
  const db = await openDatabase()
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('journals', 'readwrite', { durability: 'strict' })
      tx.objectStore('journals').delete(userId)
      tx.oncomplete = () => resolve()
      tx.onerror = tx.onabort = () => reject(new Error('Nie udało się anulować lokalnej próby rozpoczęcia.'))
    })
    workoutChannel().postMessage({ userId })
  }
  finally {
    db.close()
  }
}
