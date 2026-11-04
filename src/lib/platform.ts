// Where the app is running: the GitHub Pages site, the Android app (a thin
// shell around that site), or a claude.ai artifact.

declare const __SHELL_VERSION__: number

/** Functions the Android shell exposes to the page (see android/app/src/main/java/.../MainActivity.java). */
export interface AndroidShell {
  version(): number
  hasJapaneseVoice(): boolean
  speak(text: string): void
  stop(): void
  saveFile(filename: string, content: string): void
}

export function androidShell(): AndroidShell | undefined {
  return (window as unknown as { AndroidShell?: AndroidShell }).AndroidShell
}

export const RELEASES_URL = 'https://github.com/old-man-gibson/JLA/releases/latest'

/** True when the installed Android app is older than the one this site was built for. */
export function shellOutdated(): boolean {
  const shell = androidShell()
  if (!shell) return false
  try {
    return shell.version() < __SHELL_VERSION__
  } catch {
    return false
  }
}

/** Offline support for the deployed site (public/sw.js). Not used in development or the artifact. */
export function registerServiceWorker(): void {
  if (import.meta.env.MODE !== 'production' || !('serviceWorker' in navigator)) return
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {
      // The app still works online without it.
    })
  })
}
