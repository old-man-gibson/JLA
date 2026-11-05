import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { DECKS } from '../data/decks'
import { resolveLayout } from '../lib/keypadLayouts'
import { getCapability, type Downloads } from '../lib/cloud'
import { androidShell } from '../lib/platform'
import { decodeTransfer, encodeTransfer } from '../lib/transfer'
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
    const shell = androidShell()
    if (shell) {
      shell.saveFile(filename, data)
      setMessage('Choose where to save the backup.')
      return
    }
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

  const [code, setCode] = useState<string | null>(null)
  const [pasteOpen, setPasteOpen] = useState(false)
  const [pastedCode, setPastedCode] = useState('')

  const copyCode = async () => {
    const text = await encodeTransfer(state)
    setCode(text)
    try {
      await navigator.clipboard.writeText(text)
      setMessage('Progress code copied. In the other version, open Settings → Paste a progress code.')
    } catch {
      setMessage('Copying isn’t allowed here. Select the code below and copy it.')
    }
  }

  const loadCode = async () => {
    try {
      setPendingImport({ state: await decodeTransfer(pastedCode), name: 'the progress code' })
      setPasteOpen(false)
      setPastedCode('')
      setMessage(null)
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'That code couldn’t be read.')
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
        <span className="setting-label">Decks</span>
        <p className="setting-help">New words are taken from each enabled deck in turn. Words you’ve started keep coming up for review even if you switch their deck off.</p>
        <div className="radio-list">
          {DECKS.map((deck) => {
            const on = settings.decks.includes(deck.id)
            return (
              <label key={deck.id} className={`radio ${on ? 'on' : ''}`}>
                <input
                  type="checkbox"
                  checked={on}
                  onChange={() =>
                    set({ decks: on ? settings.decks.filter((d) => d !== deck.id) : [...settings.decks, deck.id] })
                  }
                />
                <span>
                  <strong>
                    <span lang="ja">{deck.ja}</span> {deck.name}
                  </strong>{' '}
                  <span className="muted">· {deck.words.length} words</span>
                  <span className="setting-help">{deck.description}</span>
                </span>
              </label>
            )
          })}
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
        <span className="setting-label">Typing answers</span>
        <div className="radio-list" role="radiogroup" aria-label="Typing answers">
          {(
            [
              ['auto', 'Automatic', 'On-screen romaji keys on touch screens, your keyboard elsewhere.'],
              ['onscreen', 'On-screen romaji keys', 'Keys laid out in the page, so nothing hides behind a phone keyboard.'],
              ['system', 'My device’s keyboard', 'Use this for a Japanese flick keyboard. On phones it may cover part of the screen.'],
            ] as const
          ).map(([value, label, help]) => (
            <label key={value} className={`radio ${settings.keyboard === value ? 'on' : ''}`}>
              <input
                type="radio"
                name="keyboard"
                value={value}
                checked={settings.keyboard === value}
                onChange={() => set({ keyboard: value })}
              />
              <span>
                <strong>{label}</strong>
                <span className="setting-help">{help}</span>
              </span>
            </label>
          ))}
        </div>
      </section>

      {settings.keyboard !== 'system' && (
        <section className="setting">
          <label htmlFor="keypad-layout" className="setting-label">
            On-screen key layout
          </label>
          <p className="setting-help">Match the keyboard you type on every day.</p>
          <select
            id="keypad-layout"
            className="select"
            value={settings.keypadLayout}
            onChange={(e) => set({ keypadLayout: e.target.value as Settings['keypadLayout'] })}
          >
            <option value="auto">Automatic ({resolveLayout('auto').name}, from your language)</option>
            <option value="qwertz">QWERTZ (German, Swiss, Central European)</option>
            <option value="qwerty">QWERTY (English and most others)</option>
            <option value="azerty">AZERTY (French, Belgian)</option>
          </select>
        </section>
      )}

      <ReminderSetting />

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
        <p className="setting-help">
          To move progress between the Android app and the claude.ai version, copy a progress code in one and paste it
          into the other.
        </p>
        <div className="button-row">
          <button type="button" className="secondary" onClick={() => void copyCode()}>
            Copy progress code
          </button>
          <button type="button" className="secondary" onClick={() => setPasteOpen((v) => !v)}>
            Paste a progress code
          </button>
        </div>
        {code && (
          <textarea
            id="progress-code-out"
            className="code-box"
            readOnly
            value={code}
            rows={3}
            onFocus={(e) => e.currentTarget.select()}
            aria-label="Your progress code"
          />
        )}
        {pasteOpen && (
          <div className="confirm">
            <label className="field">
              <span className="field-label">Paste the code from the other version</span>
              <textarea
                id="progress-code-in"
                className="code-box"
                rows={3}
                value={pastedCode}
                onChange={(e) => setPastedCode(e.target.value)}
                placeholder="JLA1…"
              />
            </label>
            <div className="button-row">
              <button type="button" className="primary" disabled={!pastedCode.trim()} onClick={() => void loadCode()}>
                Load
              </button>
              <button type="button" className="secondary" onClick={() => setPasteOpen(false)}>
                Cancel
              </button>
            </div>
          </div>
        )}
        {pendingImport && (
          <div className="confirm" role="alertdialog" aria-label="Confirm restore">
            <p>
              Replace all current progress with <strong>{pendingImport.name}</strong> (
              {Object.keys(pendingImport.state.words).length}{' '}
              {Object.keys(pendingImport.state.words).length === 1 ? 'word' : 'words'} started)?
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

/** Daily study reminder; only in Android app versions that support notifications. */
function ReminderSetting() {
  const shell = androidShell()
  const [time, setTime] = useState(() => shell?.reminderTime?.() ?? '')
  const [draft, setDraft] = useState(time || '19:00')
  if (!shell?.setReminder || !shell.cancelReminder) return null
  const save = () => {
    const [hour, minute] = draft.split(':').map(Number)
    if (Number.isNaN(hour) || Number.isNaN(minute)) return
    shell.setReminder!(hour, minute)
    setTime(draft)
  }
  return (
    <section className="setting">
      <label htmlFor="reminder-time" className="setting-label">
        Daily reminder
      </label>
      <p className="setting-help">
        {time
          ? `A notification reminds you every day at about ${time}. A little every day beats a lot once a week.`
          : 'Get a notification every day at a time that suits you. A little every day beats a lot once a week.'}
      </p>
      <div className="button-row">
        <input id="reminder-time" type="time" className="select" value={draft} onChange={(e) => setDraft(e.target.value)} />
        <button type="button" className="primary" onClick={save}>
          {time ? 'Change' : 'Turn on'}
        </button>
        {time && (
          <button
            type="button"
            className="secondary"
            onClick={() => {
              shell.cancelReminder!()
              setTime('')
            }}
          >
            Turn off
          </button>
        )}
      </div>
    </section>
  )
}
