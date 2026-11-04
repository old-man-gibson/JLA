// Text-to-speech through the browser's built-in voices. Quality depends on the
// device: Apple devices, Android and Chrome desktop usually ship a decent
// Japanese voice. Swap this for recorded or VOICEVOX audio later.

function synth(): SpeechSynthesis | undefined {
  return typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : undefined
}

export function japaneseVoices(): SpeechSynthesisVoice[] {
  return synth()?.getVoices().filter((v) => v.lang.replace('_', '-').toLowerCase().startsWith('ja')) ?? []
}

/** Voices load asynchronously in some browsers; resolves once the list is known. */
export function whenVoicesReady(): Promise<SpeechSynthesisVoice[]> {
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
  return synth() !== undefined
}

/** Speaks each text in turn, cancelling anything already playing. */
export function speak(...texts: string[]): void {
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
  synth()?.cancel()
}
