// Text-to-speech through the browser's built-in voices, or Android's own
// text-to-speech inside the Android app (its web view has no speech API).
// Quality depends on the device. Swap this for recorded or VOICEVOX audio later.

import { androidShell } from './platform'

function synth(): SpeechSynthesis | undefined {
  return typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : undefined
}

const ANDROID_VOICE = { name: 'Android text-to-speech' } as SpeechSynthesisVoice

export function japaneseVoices(): SpeechSynthesisVoice[] {
  return synth()?.getVoices().filter((v) => v.lang.replace('_', '-').toLowerCase().startsWith('ja')) ?? []
}

/** Voices load asynchronously in some browsers; resolves once the list is known. */
export function whenVoicesReady(): Promise<SpeechSynthesisVoice[]> {
  const shell = androidShell()
  if (shell) {
    // Android's speech engine starts up in the background; give it a moment.
    return new Promise((resolve) => setTimeout(() => resolve(shell.hasJapaneseVoice() ? [ANDROID_VOICE] : []), 800))
  }
  const s = synth()
  if (!s) return Promise.resolve([])
  if (s.getVoices().length > 0) return Promise.resolve(japaneseVoices())
  return new Promise((resolve) => {
    const done = () => resolve(japaneseVoices())
    s.addEventListener('voiceschanged', done, { once: true })
    setTimeout(done, 1500)
  })
}

export function speechSupported(): boolean {
  return androidShell() !== undefined || synth() !== undefined
}

/** Speaks each text in turn, cancelling anything already playing. */
export function speak(...texts: string[]): void {
  const shell = androidShell()
  if (shell) {
    shell.stop()
    for (const text of texts) shell.speak(text)
    return
  }
  const s = synth()
  if (!s) return
  s.cancel()
  const voice = japaneseVoices()[0]
  for (const text of texts) {
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'ja-JP'
    if (voice) utterance.voice = voice
    utterance.rate = 0.9
    s.speak(utterance)
  }
}

export function stopSpeaking(): void {
  const shell = androidShell()
  if (shell) shell.stop()
  else synth()?.cancel()
}
