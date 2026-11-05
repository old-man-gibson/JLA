import { useEffect, useRef, useState } from 'react'
import { AudioButton } from '../components/AudioButton'
import { ReadingLines } from '../components/ReadingLines'
import { Ruby, Sentence } from '../components/Sentence'
import { GRAMMAR } from '../data/grammar'
import { STORIES, type Story } from '../data/stories'
import { getCapability, type Sample, type SampleError } from '../lib/cloud'
import { plainText } from '../lib/furigana'
import { buildStoryPrompt, lineText, validateReading, type Reading } from '../lib/reader'
import { speak, stopSpeaking } from '../lib/speech'
import type { AppState } from '../lib/types'
import { findWord } from '../lib/words'

type Update = (fn: (s: AppState) => AppState) => void

const LAST_STORY_KEY = 'nihongo:lastStory'

const THEMES = [
  { id: 'adventure', label: 'Adventure', prompt: 'a fantasy adventure with a guild, monsters or magic' },
  { id: 'daily', label: 'Daily life', prompt: 'everyday life at home or in town' },
  { id: 'school', label: 'School', prompt: 'school life and friends' },
  { id: 'food', label: 'Food', prompt: 'food, cooking or a restaurant' },
  { id: 'mystery', label: 'Mystery', prompt: 'a small, light-hearted mystery' },
]

function readLocal(): Reading | null {
  try {
    const raw = localStorage.getItem(LAST_STORY_KEY)
    return raw ? validateReading(JSON.parse(raw)) : null
  } catch {
    return null
  }
}

function writeLocal(reading: Reading | null) {
  try {
    if (reading) localStorage.setItem(LAST_STORY_KEY, JSON.stringify(reading))
    else localStorage.removeItem(LAST_STORY_KEY)
  } catch {
    // Only a convenience.
  }
}

export function Stories({ state, update }: { state: AppState; update: Update }) {
  const [openId, setOpenId] = useState<string | null>(null)
  const story = STORIES.find((s) => s.id === openId)
  if (story) {
    return (
      <StoryReader
        story={story}
        state={state}
        onDone={() => {
          update((s) => ({ ...s, storiesRead: { ...s.storiesRead, [story.id]: new Date().toISOString() } }))
          setOpenId(null)
        }}
        onBack={() => setOpenId(null)}
      />
    )
  }
  const furigana = state.settings.furigana !== 'never'
  return (
    <div className="stories">
      <p className="lead">
        Short stories at your level. Reading things you mostly understand is how words stick and grammar starts to feel
        natural. Try each line before you open its translation.
      </p>
      <ul className="story-list">
        {STORIES.map((s) => (
          <li key={s.id}>
            <button type="button" className="story-row" onClick={() => setOpenId(s.id)}>
              <span className="story-main">
                <span className="story-title">
                  <Ruby source={s.title} furigana={furigana} />
                </span>
                <span className="muted small">
                  {s.titleEn} · {s.lines.length} lines
                </span>
              </span>
              <span className={`pill ${state.storiesRead[s.id] ? 'known' : s.theme === 'Adventure' ? 'learning' : 'unseen'}`}>
                {state.storiesRead[s.id] ? 'Read ✓' : s.theme}
              </span>
            </button>
          </li>
        ))}
      </ul>
      <StoryWriter state={state} update={update} />
    </div>
  )
}

function StoryReader({
  story,
  state,
  onDone,
  onBack,
}: {
  story: Story
  state: AppState
  onDone: () => void
  onBack: () => void
}) {
  const [furigana, setFurigana] = useState(state.settings.furigana !== 'never')
  const [shown, setShown] = useState<Set<number>>(new Set())
  useEffect(() => stopSpeaking, [])
  const toggle = (i: number) =>
    setShown((prev) => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })
  return (
    <article className="story">
      <button type="button" className="link-button" onClick={onBack}>
        ← All stories
      </button>
      <header className="story-head">
        <h2>
          <Ruby source={story.title} furigana={furigana} />
        </h2>
        <p className="muted">{story.titleEn}</p>
        <div className="button-row">
          <button type="button" className="secondary" onClick={() => speak(...story.lines.map((l) => plainText(l.ja)))}>
            Play the whole story
          </button>
          <label className="toggle small">
            <input type="checkbox" checked={furigana} onChange={(e) => setFurigana(e.target.checked)} />
            Furigana
          </label>
        </div>
      </header>
      <ol className="story-lines">
        {story.lines.map((line, i) => (
          <li key={i}>
            <div className="example">
              <Sentence source={line.ja} furigana={furigana} target="plain" />
              <AudioButton texts={[plainText(line.ja)]} label="Play line" />
            </div>
            {shown.has(i) ? (
              <p className="translation" onClick={() => toggle(i)}>
                {line.en}
              </p>
            ) : (
              <button type="button" className="link-button" onClick={() => toggle(i)}>
                Show translation
              </button>
            )}
          </li>
        ))}
      </ol>
      <button type="button" className="primary wide" onClick={onDone}>
        I’ve read it
      </button>
    </article>
  )
}

const ERROR_TEXT: Record<string, string> = {
  rate_limited: 'You’ve reached a usage limit for now. Try again a bit later.',
  refused: 'Claude declined that one. Try another theme.',
  session_expired: 'Your Claude session expired. Sign in again, then retry.',
}
const UNAVAILABLE = new Set(['not_granted', 'sampling_disabled', 'not_declared', 'capability_disabled', 'capability_removed'])

/** In the claude.ai version, Claude writes a new story from the learner's own words. */
function StoryWriter({ state, update }: { state: AppState; update: Update }) {
  const [sample, setSample] = useState<Sample | null | undefined>(undefined)
  const [theme, setTheme] = useState(THEMES[0].id)
  const [reading, setReading] = useState<Reading | null>(readLocal)
  const [readingId, setReadingId] = useState(0)
  const [working, setWorking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const controller = useRef<AbortController | null>(null)

  useEffect(() => {
    let alive = true
    void getCapability<Sample>('sample').then((s) => alive && setSample(s))
    return () => {
      alive = false
      controller.current?.abort()
    }
  }, [])

  const write = async () => {
    if (!sample) return
    const words = Object.keys(state.words).flatMap((id) => {
      const w = findWord(state, id)
      return w ? [{ word: w.word, reading: w.reading, meaning: w.meaning }] : []
    })
    const grammar = GRAMMAR.filter((g) => state.grammar[g.id]).map((g) => `${g.ja} (${g.title})`)
    const prompt = buildStoryPrompt({ theme: THEMES.find((t) => t.id === theme)!.prompt, words, grammar })
    controller.current?.abort()
    const ctl = new AbortController()
    controller.current = ctl
    setWorking(true)
    setError(null)
    try {
      const raw = await sample.json(prompt, { signal: ctl.signal, cache: false })
      const result = validateReading(raw)
      if (result.lines.length === 0) throw { code: 'empty' }
      setReading(result)
      setReadingId((n) => n + 1)
      writeLocal(result)
    } catch (err) {
      const code = (err as SampleError)?.code
      if (code !== 'cancelled') {
        if (UNAVAILABLE.has(code)) setSample(null)
        setError(ERROR_TEXT[code] ?? 'Something went wrong writing the story. Try again.')
      }
    } finally {
      setWorking(false)
    }
  }

  if (sample === null) {
    return (
      <section className="callout">
        <p>
          In the claude.ai version of this app, Claude can write you new stories from the words you’re learning.
        </p>
      </section>
    )
  }

  const title = reading ? lineText(reading.lines[0]) : ''
  const started = Object.keys(state.words).length
  return (
    <section className="story-writer">
      <h2 className="section-title">A new story, just for you</h2>
      <p className="muted small">
        Claude writes a story with the {started} {started === 1 ? 'word' : 'words'} you’ve started and the grammar
        you’re practising. Tap words to add them to your reviews. Uses your Claude usage.
      </p>
      <div className="chip-row" role="group" aria-label="Theme">
        {THEMES.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`chip ${theme === t.id ? 'on' : ''}`}
            aria-pressed={theme === t.id}
            onClick={() => setTheme(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <button type="button" className="primary wide" disabled={working || !sample} onClick={() => void write()}>
        {reading ? 'Write another story' : 'Write a story'}
      </button>
      {working && (
        <div className="working" role="status">
          <span className="spinner" aria-hidden="true" /> Writing… this can take up to a minute.
          <button type="button" className="link-button" onClick={() => controller.current?.abort()}>
            Stop
          </button>
        </div>
      )}
      {error && (
        <p className="error-note" role="alert">
          {error}
        </p>
      )}
      {reading && !working && (
        <div className="reading">
          <ReadingLines key={readingId} reading={reading} state={state} update={update} source={title ? `Story: ${title}` : 'Story'} />
        </div>
      )}
    </section>
  )
}
