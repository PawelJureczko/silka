export function signalNextSet() {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') navigator.vibrate([150, 80, 150])
  }
  catch { /* The next set remains usable when the browser blocks vibration. */ }
}
