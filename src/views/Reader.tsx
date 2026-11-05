import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { ReadingLines } from '../components/ReadingLines'
import { getCapability, type ImageLimits, type Sample, type SampleError } from '../lib/cloud'
import { buildReaderPrompt, validateReading, type Reading } from '../lib/reader'
import type { AppState } from '../lib/types'

type Update = (fn: (s: AppState) => AppState) => void

const LAST_KEY = 'nihongo:lastReading'
const SOURCE_KEY = 'nihongo:readerSource'

function readLocal<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function writeLocal(key: string, value: unknown) {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Only a convenience; the reading is still on screen.
  }
}

const ERROR_TEXT: Record<string, string> = {
  rate_limited: 'You’ve reached a usage limit for now. Try again a bit later.',
  image_rejected: 'That image couldn’t be used. Try a JPEG or PNG screenshot under 20 MB.',
  refused: 'Claude declined to read this one. Try a different page.',
  prompt_too_large: 'That’s too much text at once. Paste a page or less.',
  session_expired: 'Your Claude session expired. Sign in again, then retry.',
}
const UNAVAILABLE = new Set(['not_granted', 'sampling_disabled', 'not_declared', 'capability_disabled', 'capability_removed'])

/** Converts photos the platform may not accept (HEIC, huge files) into a JPEG. */
async function prepareImage(file: File, limits: ImageLimits): Promise<Blob> {
  if (limits.mediaTypes.includes(file.type) && file.size <= limits.maxInputBytes) return file
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, 2400 / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('encode'))), 'image/jpeg', 0.9),
  )
}

type Status = { kind: 'idle' } | { kind: 'working' } | { kind: 'error'; message: string }

export function Reader({ state, update }: { state: AppState; update: Update }) {
  const [sample, setSample] = useState<Sample | null | undefined>(undefined)
  const [imageLimits, setImageLimits] = useState<ImageLimits | null>(null)
  const [pasted, setPasted] = useState('')
  const [source, setSource] = useState(() => readLocal<string>(SOURCE_KEY) ?? '')
  const [reading, setReading] = useState<Reading | null>(() => readLocal<Reading>(LAST_KEY))
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [status, setStatus] = useState<Status>({ kind: 'idle' })
  const [readingId, setReadingId] = useState(0)
  const controller = useRef<AbortController | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let alive = true
    void getCapability<Sample>('sample').then(async (s) => {
      if (!alive) return
      setSample(s)
      const limits = s ? await s.limits().catch(() => null) : null
      if (alive) setImageLimits(limits?.images ?? null)
    })
    return () => {
      alive = false
      controller.current?.abort()
    }
  }, [])

  useEffect(() => () => {
    if (photoUrl) URL.revokeObjectURL(photoUrl)
  }, [photoUrl])

  const read = async (input: { text?: string; image?: Blob }) => {
    if (!sample) return
    controller.current?.abort()
    const ctl = new AbortController()
    controller.current = ctl
    setStatus({ kind: 'working' })
    try {
      const raw = await sample.json(buildReaderPrompt(input.text), {
        signal: ctl.signal,
        ...(input.image ? { images: [input.image] } : {}),
      })
      const result = validateReading(raw)
      setReading(result)
      setReadingId((n) => n + 1)
      writeLocal(LAST_KEY, result)
      setStatus(
        result.lines.length === 0
          ? { kind: 'error', message: 'No Japanese text found. Try a closer, sharper photo of the panel.' }
          : { kind: 'idle' },
      )
    } catch (err) {
      const code = (err as SampleError)?.code
      if (code === 'cancelled') return setStatus({ kind: 'idle' })
      if (UNAVAILABLE.has(code)) setSample(null)
      if (code === 'images_unavailable') setImageLimits(null)
      setStatus({ kind: 'error', message: ERROR_TEXT[code] ?? 'Something went wrong reading that. Try again.' })
    }
  }

  const onPhoto = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !imageLimits) return
    try {
      const image = await prepareImage(file, imageLimits)
      setPhotoUrl(URL.createObjectURL(image))
      void read({ image })
    } catch {
      setStatus({ kind: 'error', message: 'That image couldn’t be opened. Try a screenshot or a JPEG.' })
    }
  }

  const saveSource = (value: string) => {
    setSource(value)
    writeLocal(SOURCE_KEY, value)
  }

  const working = status.kind === 'working'

  return (
    <div className="page">
      <h1>
        <span lang="ja">読む</span> Read
      </h1>
      <p className="lead">
        Photograph a manga page or panel, or paste Japanese text. Claude transcribes it with readings and explains each
        line. Tap a word to see its meaning and add it to your reviews, with that line as its example sentence.
      </p>

      {sample === null ? (
        <section className="callout">
          <p>
            Reading manga needs Claude, so it works in the version of this app published on claude.ai, where it runs on
            your own Claude account.
          </p>
        </section>
      ) : (
        <section className="chooser">
          <label className="field">
            <span className="field-label">Manga title (optional)</span>
            <input
              id="reader-source"
              value={source}
              onChange={(e) => saveSource(e.target.value)}
              placeholder="e.g. よつばと!"
              autoComplete="off"
            />
          </label>
          {imageLimits && (
            <>
              <button
                type="button"
                className="primary wide"
                disabled={working || !sample}
                onClick={() => fileRef.current?.click()}
              >
                Choose a photo of a page
              </button>
              <input
                ref={fileRef}
                type="file"
                accept={['image/*', ...imageLimits.mediaTypes].join(',')}
                hidden
                onChange={onPhoto}
              />
            </>
          )}
          <label className="field">
            <span className="field-label">{imageLimits ? 'Or paste text' : 'Paste Japanese text'}</span>
            <textarea
              id="reader-text"
              lang="ja"
              rows={3}
              value={pasted}
              onChange={(e) => setPasted(e.target.value)}
              placeholder="俺は腹が減った！"
            />
          </label>
          <button
            type="button"
            className="secondary"
            disabled={working || !sample || !pasted.trim()}
            onClick={() => void read({ text: pasted.trim() })}
          >
            Read this text
          </button>
          {sample === undefined && <p className="muted small">Checking whether Claude is available…</p>}
        </section>
      )}

      {working && (
        <div className="working" role="status">
          <span className="spinner" aria-hidden="true" /> Reading the page… this can take up to a minute.
          <button type="button" className="link-button" onClick={() => controller.current?.abort()}>
            Stop
          </button>
        </div>
      )}
      {status.kind === 'error' && (
        <p className="error-note" role="alert">
          {status.message}
        </p>
      )}

      {reading && reading.lines.length > 0 && !working && (
        <section className="reading">
          <ReadingLines key={readingId} reading={reading} state={state} update={update} source={source}>
            {photoUrl && <img className="reading-photo" src={photoUrl} alt="The page you photographed" />}
          </ReadingLines>
          <button
            type="button"
            className="secondary"
            onClick={() => {
              setReading(null)
              writeLocal(LAST_KEY, null)
              setPhotoUrl(null)
              setPasted('')
            }}
          >
            Clear and read another page
          </button>
        </section>
      )}
    </div>
  )
}
