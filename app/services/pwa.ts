import { hasBlockingWorkoutJournals } from './workout-storage'

export interface PwaStatus {
  offline: boolean
  installed: boolean
  installable: boolean
  readiness: 'checking' | 'ready' | 'error' | 'unsupported' | 'development'
  updateAvailable: boolean
  busy: boolean
  message: string
}
interface InstallPrompt extends Event {
  prompt(): Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function initializePwa(state: PwaStatus, version: string, development: boolean) {
  let registration: ServiceWorkerRegistration | null = null
  let installPrompt: InstallPrompt | null = null
  let lastCheck = Date.now()
  const display = window.matchMedia('(display-mode: standalone)')
  const connectivity = () => {
    state.offline = !navigator.onLine
  }
  const installation = () => {
    state.installed = display.matches
  }
  connectivity()
  installation()
  window.addEventListener('online', connectivity)
  window.addEventListener('offline', connectivity)
  display.addEventListener('change', installation)
  window.addEventListener('beforeinstallprompt', (event) => {
    if (!('prompt' in event) || typeof event.prompt !== 'function') return
    event.preventDefault()
    if (development) return
    installPrompt = event as InstallPrompt
    state.installable = true
  })
  window.addEventListener('appinstalled', () => {
    state.installed = true
    state.installable = false
    installPrompt = null
  })
  const ready = () => navigator.serviceWorker.controller?.postMessage({ type: 'APP_READY', version })
  const inspect = () => {
    state.updateAvailable = Boolean(registration?.waiting && navigator.serviceWorker.controller)
    if (registration?.active) state.readiness = 'ready'
  }
  async function register() {
    if (development) {
      state.readiness = 'development'
      return
    }
    if (!('serviceWorker' in navigator) || !window.isSecureContext) {
      state.readiness = 'unsupported'
      return
    }
    state.readiness = 'checking'
    try {
      registration = await navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' })
      inspect()
      const installing = () => {
        const worker = registration?.installing
        worker?.addEventListener('statechange', () => {
          inspect()
          if (worker.state === 'redundant') {
            state.message = 'Nie udało się pobrać nowej wersji. Spróbuj ponownie przy stabilnym połączeniu.'
            if (!registration?.active) state.readiness = 'error'
          }
        })
      }
      registration.addEventListener('updatefound', installing)
      installing()
      await navigator.serviceWorker.ready
      inspect()
      ready()
      if (navigator.onLine) await registration.update().catch(() => {
        state.message = 'Nie można sprawdzić aktualizacji. Sprawdź połączenie i ponów próbę.'
      })
    }
    catch {
      state.readiness = 'error'
      state.message = 'Nie udało się przygotować aplikacji do otwierania bez sieci.'
    }
  }
  if ('serviceWorker' in navigator) navigator.serviceWorker.addEventListener('controllerchange', () => {
    inspect()
    ready()
  })
  void register()

  async function check() {
    if (state.busy) return
    state.busy = true
    lastCheck = Date.now()
    state.message = ''
    try {
      if (!registration) await register()
      else await registration.update()
      inspect()
      if (!state.updateAvailable && state.readiness === 'ready') state.message = 'Sprawdzono aktualizacje. Pobieranie nowej wersji, jeśli jest dostępna, może chwilę potrwać.'
    }
    catch { state.message = 'Nie można sprawdzić aktualizacji. Sprawdź połączenie i ponów próbę.' }
    finally { state.busy = false }
  }
  if (!development) document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && navigator.onLine && Date.now() - lastCheck > 60000) void check()
  })
  async function update() {
    if (!registration?.waiting || state.busy) return
    state.busy = true
    state.message = ''
    try {
      if (!navigator.locks) throw new Error('Aktualizacja wymaga przeglądarki z bezpieczną blokadą zapisu. Zaktualizuj Safari.')
      await navigator.locks.request('silka:pwa-update', { mode: 'exclusive' }, async () => {
        if (await hasBlockingWorkoutJournals()) throw new Error('Najpierw zakończ trening i zsynchronizuj zmiany. Sprawdź też inne karty oraz konta używane na tym urządzeniu.')
        const worker = registration?.waiting
        if (!worker) throw new Error('Nowa wersja jest już aktywna. Otwórz ponownie aplikację po zapisaniu zmian.')
        // Keep the journal lock until this document unloads; activation must not race a new workout.
        await new Promise<void>((_resolve, reject) => {
          const reload = () => {
            window.location.reload()
          }
          navigator.serviceWorker.addEventListener('controllerchange', reload, { once: true })
          const timeout = window.setTimeout(() => {
            navigator.serviceWorker.removeEventListener('controllerchange', reload)
            reject(new Error('Aktualizacja trwa zbyt długo. Zapis treningu pozostaje na urządzeniu; spróbuj ponownie.'))
          }, 20000)
          window.addEventListener('pagehide', () => window.clearTimeout(timeout), { once: true })
          worker.postMessage({ type: 'ACTIVATE_UPDATE' })
        })
      })
    }
    catch (error) { state.message = error instanceof Error ? error.message : 'Nie udało się uruchomić aktualizacji.' }
    finally { state.busy = false }
  }
  async function install() {
    if (!installPrompt || state.busy) return
    state.busy = true
    try {
      const { outcome } = await installPrompt.prompt()
      state.message = outcome === 'accepted' ? 'Przeglądarka przyjęła instalację.' : 'Instalacja anulowana. Możesz wrócić do niej później.'
      installPrompt = null
      state.installable = false
    }
    catch { state.message = 'Otwórz menu przeglądarki i wybierz instalację aplikacji.' }
    finally { state.busy = false }
  }
  return { check, update, install }
}
