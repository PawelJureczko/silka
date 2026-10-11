export function usePwaState() {
  return useState('pwa', () => ({
    offline: false,
    installed: false,
    installable: false,
    readiness: 'checking' as 'checking' | 'ready' | 'error' | 'unsupported' | 'development',
    updateAvailable: false,
    busy: false,
    message: '',
  }))
}
