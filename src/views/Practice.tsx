import { useEffect, useMemo, useRef, useState } from 'react'
import { bind, toKatakana, unbind } from 'wanakana'
import { AudioButton } from '../components/AudioButton'
import { Keypad } from '../components/Keypad'
import { WordRuby } from '../components/Sentence'
import type { Word } from '../data/deck'
import { WORD_CLASSES } from '../data/wordClasses'
import { finalizeKanaInput } from '../lib/answer'
import { conjugate, explainForm, FORM_BY_ID, FORMS, type Conjugated, type FormId, type WordClass } from '../lib/conjugate'
import { resolveLayout } from '../lib/keypadLayouts'
import { speak } from '../lib/speech'
import type { AppState, Settings } from '../lib/types'
import { applyKey, useOnscreenKeys, useTypingKeys, type TypedKey } from '../lib/typing'
import { countToday } from '../lib/quests'
import { findWord, studyWords } from '../lib/words'
import { Listening } from './Listening'

type Update = (fn: (s: AppState) => AppState) => void

const ROUND = 10

interface FormItem {
  word: Word
  cls: WordClass
  form: FormId
  answer: Conjugated
}

/** Verbs and adjectives to practise: the ones you've started, or all of them if that's too few. */
function formWords(state: AppState): { words: { word: Word; cls: WordClass }[]; startedOnly: boolean } {
  const started = Object.keys(state.words)
    .filter((id) => WORD_CLASSES[id])
    .flatMap((id) => {
      const word = findWord(state, id)
      return word ? [{ word, cls: WORD_CLASSES[id] }] : []
    })
  if (started.length >= 4) return { words: started, startedOnly: true }
  const all = studyWords(state)
    .filter((w) => WORD_CLASSES[w.id])
    .map((word) => ({ word, cls: WORD_CLASSES[word.id] }))
  return { words: all, startedOnly: false }
}

function pickItems(pool: { word: Word; cls: WordClass }[], forms: FormId[]): FormItem[] {
  const options = pool.flatMap(({ word, cls }) =>
    forms.flatMap((form) => {
      const answer = conjugate(word.word, word.reading, cls, form)
      return answer ? [{ word, cls, form, answer }] : []
    }),
  )
  const items: FormItem[] = []
  const used = new Set<string>()
  while (items.length < ROUND && used.size < options.length) {
    const candidate = options[Math.floor(Math.random() * options.length)]
    const key = `${candidate.word.id}:${candidate.form}`
    if (used.has(key)) continue
    used.add(key)
    // Avoid the same word twice in a row.
    if (items.at(-1)?.word.id === candidate.word.id && used.size < options.length) continue
    items.push(candidate)
  }
  return items
}

export function isFormAnswerCorrect(answer: Conjugated, typed: string): boolean {
  const value = finalizeKanaInput(typed)
  if (!value) return false
  return value === answer.word || toKatakana(value) === toKatakana(answer.reading)
}

export function Practice({
  state,
  update,
  onDrilling,
}: {
  state: AppState
  update: Update
  onDrilling: (drilling: boolean) => void
}) {
  const [mode, setMode] = useState<'menu' | 'forms' | 'listening'>('menu')
  const [forms, setForms] = useState<FormId[]>(['masu', 'te', 'nai', 'adj-nai'])
  const [round, setRound] = useState<{ id: number; items: FormItem[] } | null>(null)
  const { words, startedOnly } = useMemo(() => formWords(state), [state])

  useEffect(() => {
    onDrilling(mode !== 'menu')
  }, [mode, onDrilling])

  const start = () => {
    setRound((r) => ({ id: (r?.id ?? 0) + 1, items: pickItems(words, forms) }))
    setMode('forms')
  }

  if (mode === 'forms' && round) {
    return (
      <FormsDrill
        key={round.id}
        items={round.items}
        settings={state.settings}
        update={update}
        onAgain={start}
        onExit={() => setMode('menu')}
      />
    )
  }
  if (mode === 'listening') return <Listening state={state} update={update} onExit={() => setMode('menu')} />

  const toggle = (id: FormId) => setForms((f) => (f.includes(id) ? (f.length > 1 ? f.filter((x) => x !== id) : f) : [...f, id]))
  const stat = (id: FormId) => {
    const s = state.formStats[id]
    return s && s.seen > 0 ? ` · ${Math.round((s.correct / s.seen) * 100)}%` : ''
  }

  return (
    <div className="practice">
      <section className="practice-card">
        <h2>
          <span lang="ja">活用</span> Verb and adjective forms
        </h2>
        <p className="muted small">
          Type the form asked for: 書く → 書いて, 高い → 高くない. The rule shows after each answer.{' '}
          {startedOnly ? `Uses the ${words.length} verbs and adjectives you’ve started.` : 'Uses verbs and adjectives from your decks until you’ve started a few.'}
        </p>
        <p className="practice-label">Verbs</p>
        <div className="chip-row">
          {FORMS.filter((f) => f.for === 'verb').map((f) => (
            <button key={f.id} type="button" className={`chip ${forms.includes(f.id) ? 'on' : ''}`} aria-pressed={forms.includes(f.id)} onClick={() => toggle(f.id)}>
              <span lang="ja">{f.ja}</span> {f.label}
              {stat(f.id)}
            </button>
          ))}
        </div>
        <p className="practice-label">い-adjectives</p>
        <div className="chip-row">
          {FORMS.filter((f) => f.for === 'adjective').map((f) => (
            <button key={f.id} type="button" className={`chip ${forms.includes(f.id) ? 'on' : ''}`} aria-pressed={forms.includes(f.id)} onClick={() => toggle(f.id)}>
              <span lang="ja">{f.ja}</span> {f.label}
              {stat(f.id)}
            </button>
          ))}
        </div>
        <button type="button" className="primary wide" onClick={start} disabled={words.length === 0}>
          Start {ROUND} forms
        </button>
      </section>

      <section className="practice-card">
        <h2>
          <span lang="ja">聞く</span> Listening
        </h2>
        <p className="muted small">Hear a word or sentence you’ve learned and pick what it means. No reading allowed.</p>
        <button type="button" className="primary wide" onClick={() => setMode('listening')}>
          Start listening
        </button>
      </section>
    </div>
  )
}

function FormsDrill({
  items: initial,
  settings,
  update,
  onAgain,
  onExit,
}: {
  items: FormItem[]
  settings: Settings
  update: Update
  onAgain: () => void
  onExit: () => void
}) {
  const [queue, setQueue] = useState(initial)
  const [index, setIndex] = useState(0)
  const [result, setResult] = useState<{ typed: string; correct: boolean } | null>(null)
  const [score, setScore] = useState({ right: 0, total: 0 })
  const [missed, setMissed] = useState<FormItem[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const onscreen = useOnscreenKeys(settings)
  const item = queue[index]
  const finished = index >= queue.length

  useEffect(() => {
    const el = inputRef.current
    if (!el || onscreen) return
    bind(el, { IMEMode: true })
    el.focus()
    return () => unbind(el)
  }, [onscreen, finished])

  const check = () => {
    const el = inputRef.current
    if (!el || !item) return
    if (result) {
      setResult(null)
      setIndex((i) => i + 1)
      el.value = ''
      if (!onscreen) el.focus()
      return
    }
    if (!finalizeKanaInput(el.value)) return
    const correct = isFormAnswerCorrect(item.answer, el.value)
    setResult({ typed: finalizeKanaInput(el.value), correct })
    setScore((s) => ({ right: s.right + (correct ? 1 : 0), total: s.total + 1 }))
    update((s) => {
      const prev = s.formStats[item.form] ?? { seen: 0, correct: 0 }
      const next = { ...s, formStats: { ...s.formStats, [item.form]: { seen: prev.seen + 1, correct: prev.correct + (correct ? 1 : 0) } } }
      return correct ? countToday(next, 'formsCorrect', 1, new Date()) : next
    })
    if (settings.autoplayAudio) speak(item.answer.reading)
    if (!correct) {
      setMissed((m) => (m.includes(item) ? m : [...m, item]))
      if (queue.filter((q) => q === item).length < 2) setQueue((q) => [...q.slice(0, index + 4), item, ...q.slice(index + 4)])
    }
  }

  const pressKey = (key: TypedKey) => {
    const el = inputRef.current
    if (!el) return
    if (key === 'enter') check()
    else if (!result) el.value = applyKey(el.value, key, 'kana')
  }
  useTypingKeys(onscreen && !finished, pressKey)

  if (finished) {
    return (
      <div className="page">
        <h2>Round complete</h2>
        <div className="stats">
          <div className="stat">
            <span className="stat-label">Correct</span>
            <span className="stat-value">
              {score.right}/{score.total}
            </span>
          </div>
        </div>
        {missed.length > 0 && (
          <>
            <h3 className="section-title">Worth another look</h3>
            <ul className="word-list">
              {missed.map((m) => (
                <li key={`${m.word.id}:${m.form}`} className="word-row">
                  <div className="word-main">
                    <span className="word-ja" lang="ja">
                      {m.word.word} → {m.answer.word}
                    </span>
                    <span className="word-meaning">
                      {FORM_BY_ID[m.form].label} · <span lang="ja">{m.answer.reading}</span>
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
        <div className="button-row">
          <button type="button" className="primary" onClick={onAgain} autoFocus>
            Another round
          </button>
          <button type="button" className="secondary" onClick={onExit}>
            Back
          </button>
        </div>
      </div>
    )
  }

  const form = FORM_BY_ID[item.form]
  return (
    <div className="page drill">
      <div className="review-bar">
        <button type="button" className="link-button" onClick={onExit}>
          ← Stop
        </button>
        <span className="progress-text">
          {index + 1} / {queue.length}
        </span>
      </div>
      <section className={`study-card form-card ${result ? (result.correct ? 'right' : 'wrong') : ''}`}>
        <div className="word-head">
          <span className="big-word">
            <WordRuby word={item.word} furigana={settings.furigana !== 'never'} />
          </span>
          <AudioButton texts={[item.word.reading]} label="Play word" />
        </div>
        <p className="muted">{item.word.meaning}</p>
        <p className="form-ask">
          <span lang="ja">{form.ja}</span> {form.label}
        </p>
        {result && (
          <div className="form-result" aria-live="polite">
            <p className={`verdict ${result.correct ? 'right' : 'wrong'}`}>
              {result.correct ? 'Correct' : 'Not quite'}: <span lang="ja">{item.answer.word}</span>{' '}
              <span lang="ja" className="muted">
                ({item.answer.reading})
              </span>
            </p>
            {!result.correct && (
              <p className="you-typed">
                You typed <span lang="ja">{result.typed}</span>
              </p>
            )}
            <p className="why">{explainForm(item.word.reading, item.cls, item.form)}</p>
          </div>
        )}
      </section>
      <form
        className="answer-form"
        onSubmit={(e) => {
          e.preventDefault()
          check()
        }}
      >
        <input
          ref={inputRef}
          lang="ja"
          className="answer-input"
          placeholder={onscreen ? 'Tap the keys below' : 'Type in romaji'}
          aria-label={`${form.label} of ${item.word.word}`}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          readOnly={onscreen || result !== null}
          inputMode={onscreen ? 'none' : undefined}
        />
        {!onscreen && (
          <button type="submit" className="primary">
            {result ? 'Next' : 'Check'}
          </button>
        )}
      </form>
      {onscreen && <Keypad layout={resolveLayout(settings.keypadLayout)} onKey={pressKey} enterLabel={result ? 'Next' : 'Check'} />}
    </div>
  )
}
