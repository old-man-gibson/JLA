import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { getCapability, type Downloads } from '../lib/cloud'
import { defaultState, exportState, importState } from '../lib/store'
import { speak, speechSupported, whenVoicesReady } from '../lib/speech'
import type { AppState, FuriganaMode, Settings } from '../lib/types'

type Update = (fn: (s: AppState) => AppState) => void

export type SyncStatus = 'connecting' | 'local' | 'synced' | 'error'

const SYNC_TEXT: Record<SyncStatus, string> = {
  connecting: 'Checking where progress is saved…',
  local:
    'Progress is saved in this browser only. Clearing site data or switching devices loses it, so download a backup now and then.',
  synced: 'Progress is saved privately to your Claude account, so it follows you across devices. Only you can see it.',
  error:
    'Your Claude account storage can’t be reached right now, so progress is saved in this browser only for the moment.',
}

const FURIGANA_OPTIONS: { value: FuriganaMode; label: string; help: string }[] = [
  { value: 'auto', label: 'Fade out', help: 'Shown on the question until a card is mature, then only on the answer.' },
  { value: 'always', label: 'Always', help: 'Always shown above kanji.' },
  { value: 'never', label: 'Never', help: 'Never shown. Readings still appear on the answer.' },
]

export function SettingsView({ state, update, sync }: { state: AppState; update: Update; sync: SyncStatus }) {
  const settings = state.settings
  const set = (patch: Partial<Settings>) => update((s) => ({ ...s, settings: { ...s.settings, ...patch } }))
  const [voices, setVoices] = useState<string[] | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [pendingImport, setPendingImport] = useState<{ state: AppState; name: string } | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let alive = true
    void whenVoicesReady().then((v) => alive && setVoices(v.map((voice) => voice.name)))
    return () => {
      alive = false
    }
  }, [])

  const download = async () => {
    const filename = `nihongo-backup-${new Date().toISOString().slice(0, 10)}.json`
    const data = exportState(state)
    // Inside claude.ai the page can't start downloads itself; the platform asks the viewer instead.
    const downloads = await getCapability<Downloads>('downloads')
    if (downloads) {
      try {
        await downloads.save({ filename, data })
        setMessage('Backup saved.')
      } catch (err) {
        const code = (err as { code?: string })?.code
        setMessage(code === 'declined' ? 'Backup not saved.' : 'Saving files isn’t available here.')
      }
      return
    }
    const url = URL.createObjectURL(new Blob([data], { type: 'application/json' }))
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
    setMessage('Backup downloaded.')
  }

  const chooseBackup = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      setPendingImport({ state: importState(await file.text()), name: file.name })
      setMessage(null)
    } catch (err) {
      setMessage(`Could not read that file: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  const restore = () => {
    if (!pendingImport) return
    update(() => pendingImport.state)
    setMessage(`Restored ${Object.keys(pendingImport.state.words).length} words from ${pendingImport.name}.`)
    setPendingImport(null)
  }

  const reset = () => {
    update((s) => ({ ...defaultState(), settings: s.settings }))
    setConfirmReset(false)
    setMessage('Progress deleted.')
  }

  return (
    <div className="page">
      <h1>
        <span lang="ja">設定</span> Settings
      </h1>

      <section className="setting">
        <label htmlFor="new-per-day" className="setting-label">
          New words per day
        </label>
        <p className="setting-help">
          Each new word adds two cards and roughly 10 reviews over the next week. 5–10 is a sustainable pace.
        </p>
        <div className="stepper">
          <button type="button" className="secondary" onClick={() => set({ newWordsPerDay: Math.max(0, settings.newWordsPerDay - 1) })} aria-label="Fewer">
            −
          </button>
          <input
            id="new-per-day"
            type="number"
            min={0}
            max={50}
            value={settings.newWordsPerDay}
            onChange={(e) => set({ newWordsPerDay: Math.max(0, Math.min(50, Number(e.target.value) || 0)) })}
          />
          <button type="button" className="secondary" onClick={() => set({ newWordsPerDay: Math.min(50, settings.newWordsPerDay + 1) })} aria-label="More">
            +
          </button>
        </div>
      </section>

      <section className="setting">
        <span className="setting-label">Furigana</span>
        <div className="radio-list" role="radiogroup" aria-label="Furigana">
          {FURIGANA_OPTIONS.map((o) => (
            <label key={o.value} className={`radio ${settings.furigana === o.value ? 'on' : ''}`}>
              <input
                type="radio"
                name="furigana"
                value={o.value}
                checked={settings.furigana === o.value}
                onChange={() => set({ furigana: o.value })}
              />
              <span>
                <strong>{o.label}</strong>
                <span className="setting-help">{o.help}</span>
              </span>
            </label>
          ))}
        </div>
      </section>

      <section className="setting">
        <label className="toggle">
          <input type="checkbox" checked={settings.autoplayAudio} onChange={(e) => set({ autoplayAudio: e.target.checked })} />
          <span className="setting-label">Play audio automatically</span>
        </label>
        <p className="setting-help">
          {!speechSupported()
            ? 'This browser has no text-to-speech.'
            : voices === null
              ? 'Checking for a Japanese voice…'
              : voices.length > 0
                ? `Using ${voices[0]}.`
                : 'No Japanese voice found on this device. Audio may be silent or use the wrong accent; on desktop, Chrome and Edge include one.'}
        </p>
        {speechSupported() && (
          <button type="button" className="secondary" onClick={() => speak('こんにちは。日本語を勉強しています。')}>
            Test voice
          </button>
        )}
      </section>

      <section className="setting">
        <span className="setting-label">Saving and backup</span>
        <p className={`setting-help sync-${sync}`}>{SYNC_TEXT[sync]}</p>
        <div className="button-row">
          <button type="button" className="secondary" onClick={() => void download()}>
            Download backup
          </button>
          <button type="button" className="secondary" onClick={() => fileRef.current?.click()}>
            Restore from file
          </button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={chooseBackup} />
        </div>
        {pendingImport && (
          <div className="confirm" role="alertdialog" aria-label="Confirm restore">
            <p>
              Replace all current progress with <strong>{pendingImport.name}</strong> (
              {Object.keys(pendingImport.state.words).length} words started)?
            </p>
            <div className="button-row">
              <button type="button" className="primary" onClick={restore}>
                Replace progress
              </button>
              <button type="button" className="secondary" onClick={() => setPendingImport(null)}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="setting danger">
        <span className="setting-label">Start over</span>
        {confirmReset ? (
          <div className="confirm" role="alertdialog" aria-label="Confirm delete">
            <p>Delete all words, reviews and kana stats? Settings are kept. This can’t be undone.</p>
            <div className="button-row">
              <button type="button" className="danger-button" onClick={reset}>
                Delete everything
              </button>
              <button type="button" className="secondary" onClick={() => setConfirmReset(false)}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button type="button" className="danger-button" onClick={() => setConfirmReset(true)}>
            Delete all progress
          </button>
        )}
      </section>

      {message && (
        <p className="toast" role="status">
          {message}
        </p>
      )}

      <footer className="credits">
        Scheduling by <a href="https://github.com/open-spaced-repetition/ts-fsrs">FSRS</a>. Romaji input by{' '}
        <a href="https://wanakana.com">WanaKana</a>.
      </footer>
    </div>
  )
}
