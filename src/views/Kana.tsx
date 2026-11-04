import { useEffect, useRef, useState, type FormEvent } from 'react'
import { GROUP_LABELS, kanaFor, SCRIPT_LABELS, type KanaGroup, type KanaItem, type Script } from '../data/kana'
import { isKanaAnswerCorrect, normalizeRomaji } from '../lib/answer'
import { FLUENT_MS, FLUENT_STREAK, kanaLevel, pickKanaSession, recordKanaAnswer } from '../lib/kanaDrill'
import type { AppState, KanaStat } from '../lib/types'

type Update = (fn: (s: AppState) => AppState) => void

const SESSION_SIZE = 20
const SCRIPTS: Script[] = ['hiragana', 'katakana']
const GROUPS: KanaGroup[] = ['basic', 'dakuten', 'combo']

export function Kana({ state, update }: { state: AppState; update: Update }) {
  const [scripts, setScripts] = useState<Script[]>(['hiragana'])
  const [groups, setGroups] = useState<KanaGroup[]>(['basic'])
  const [session, setSession] = useState<{ id: number; items: KanaItem[] } | null>(null)

  const pool = kanaFor(scripts, groups)
  const start = () =>
    setSession((prev) => ({ id: (prev?.id ?? 0) + 1, items: pickKanaSession(pool, state.kana, SESSION_SIZE) }))

  if (session) {
    return (
      <KanaDrill
        key={session.id}
        items={session.items}
        update={update}
        onAgain={start}
        onExit={() => setSession(null)}
      />
    )
  }

  const toggle = <T,>(list: T[], value: T) =>
    list.includes(value) ? (list.length > 1 ? list.filter((v) => v !== value) : list) : [...list, value]

  const fluentCount = pool.filter((k) => kanaLevel(state.kana[k.kana]) === 'fluent').length

  return (
    <div className="page">
      <h1>
        <span lang="ja">かな</span> Kana
      </h1>
      <p className="lead">
        See a kana, type its romaji. A kana counts as fluent after {FLUENT_STREAK} correct answers in a row, each under{' '}
        {FLUENT_MS / 1000} seconds. Drills favour the ones you miss or hesitate on.
      </p>

      <div className="chooser">
        <div className="chip-row" role="group" aria-label="Scripts">
          {SCRIPTS.map((s) => (
            <button
              key={s}
              type="button"
              className={`chip ${scripts.includes(s) ? 'on' : ''}`}
              aria-pressed={scripts.includes(s)}
              onClick={() => setScripts((v) => toggle(v, s))}
            >
              {SCRIPT_LABELS[s]}
            </button>
          ))}
        </div>
        <div className="chip-row" role="group" aria-label="Groups">
          {GROUPS.map((g) => (
            <button
              key={g}
              type="button"
              className={`chip ${groups.includes(g) ? 'on' : ''}`}
              aria-pressed={groups.includes(g)}
              onClick={() => setGroups((v) => toggle(v, g))}
            >
              {GROUP_LABELS[g]}
            </button>
          ))}
        </div>
        <button type="button" className="primary wide" onClick={start}>
          Start {Math.min(SESSION_SIZE, pool.length)} kana · {fluentCount}/{pool.length} fluent
        </button>
      </div>

      {scripts.map((script) =>
        groups.map((group) => (
          <KanaGrid key={`${script}-${group}`} title={`${SCRIPT_LABELS[script]} · ${GROUP_LABELS[group]}`} items={kanaFor([script], [group])} stats={state.kana} />
        )),
      )}
      <div className="legend">
        <span className="dot unseen" /> Not practised <span className="dot learning" /> Learning{' '}
        <span className="dot fluent" /> Fluent
      </div>
    </div>
  )
}

function KanaGrid({ title, items, stats }: { title: string; items: KanaItem[]; stats: Record<string, KanaStat> }) {
  const rows = new Map<number, KanaItem[]>()
  for (const item of items) rows.set(item.row, [...(rows.get(item.row) ?? []), item])
  return (
    <section className="kana-grid-section">
      <h2 className="section-title">{title}</h2>
      <div className="kana-grid">
        {[...rows.values()].map((row, i) => (
          <div className="kana-row" key={i}>
            {row.map((item) => {
              const stat = stats[item.kana]
              const level = kanaLevel(stat)
              const accuracy = stat ? `${stat.correct}/${stat.seen} correct` : 'not practised'
              return (
                <div key={item.kana} className={`kana-cell ${level}`} title={`${item.kana} = ${item.romaji[0]} · ${accuracy}`}>
                  <span lang="ja" className="kana-char">
                    {item.kana}
                  </span>
                  <span className="kana-romaji">{item.romaji[0]}</span>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </section>
  )
}

interface Answer {
  item: KanaItem
  correct: boolean
  ms: number
}

function KanaDrill({
  items,
  update,
  onAgain,
  onExit,
}: {
  items: KanaItem[]
  update: Update
  onAgain: () => void
  onExit: () => void
}) {
  const [queue, setQueue] = useState(items)
  const [index, setIndex] = useState(0)
  const [missed, setMissed] = useState<KanaItem | null>(null)
  const [last, setLast] = useState<Answer | null>(null)
  const [answers, setAnswers] = useState<Answer[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const shownAt = useRef(0)

  const item = queue[index]
  const finished = index >= queue.length

  useEffect(() => {
    shownAt.current = performance.now()
    inputRef.current?.focus()
  }, [index])

  const advance = () => {
    setMissed(null)
    setIndex((i) => i + 1)
    if (inputRef.current) inputRef.current.value = ''
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const el = inputRef.current
    if (!el || !item) return
    if (missed) {
      advance()
      return
    }
    if (!normalizeRomaji(el.value)) return
    const ms = performance.now() - shownAt.current
    const correct = isKanaAnswerCorrect(item, el.value)
    const answer = { item, correct, ms }
    update((s) => ({ ...s, kana: { ...s.kana, [item.kana]: recordKanaAnswer(s.kana[item.kana], correct, ms, new Date()) } }))
    setAnswers((a) => [...a, answer])
    setLast(answer)
    if (correct) {
      advance()
    } else {
      setMissed(item)
      // Bring a missed kana back a few cards later, once per session.
      if (queue.filter((k) => k === item).length < 2) {
        setQueue((q) => [...q.slice(0, index + 4), item, ...q.slice(index + 4)])
      }
    }
  }

  if (finished) return <DrillSummary answers={answers} onAgain={onAgain} onExit={onExit} />

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
      <div className="progress" aria-hidden="true">
        <div className="progress-fill" style={{ width: `${(index / queue.length) * 100}%` }} />
      </div>
      <div className={`drill-kana ${missed ? 'wrong' : ''}`} lang="ja">
        {item.kana}
      </div>
      <form onSubmit={submit} className="answer-form">
        <input
          ref={inputRef}
          className={`answer-input romaji ${missed ? 'wrong' : ''}`}
          placeholder="romaji"
          aria-label={`Romaji for ${item.kana}`}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          inputMode="text"
        />
      </form>
      <div className="drill-feedback" aria-live="polite">
        {missed ? (
          <p className="verdict wrong">
            <span lang="ja">{missed.kana}</span> is <strong>{missed.romaji[0]}</strong>
            {missed.romaji.length > 1 && <span className="muted"> (also {missed.romaji.slice(1).join(', ')})</span>}.
            Press Enter to continue.
          </p>
        ) : last?.correct ? (
          <p className="verdict right">
            <span lang="ja">{last.item.kana}</span> {last.item.romaji[0]} · {(last.ms / 1000).toFixed(1)}s
          </p>
        ) : (
          <p className="muted">Type the romaji and press Enter.</p>
        )}
      </div>
    </div>
  )
}

function DrillSummary({ answers, onAgain, onExit }: { answers: Answer[]; onAgain: () => void; onExit: () => void }) {
  const correct = answers.filter((a) => a.correct)
  const times = correct.map((a) => a.ms).sort((a, b) => a - b)
  const median = times.length ? times[Math.floor(times.length / 2)] : 0
  const missed = [...new Map(answers.filter((a) => !a.correct).map((a) => [a.item.kana, a.item])).values()]
  const slow = [...new Map(correct.filter((a) => a.ms > FLUENT_MS).map((a) => [a.item.kana, a.item])).values()]
  return (
    <div className="page">
      <h1>Round complete</h1>
      <div className="stats">
        <div className="stat">
          <span className="stat-label">Accuracy</span>
          <span className="stat-value">{answers.length ? Math.round((correct.length / answers.length) * 100) : 0}%</span>
          <span className="stat-sub">
            {correct.length} of {answers.length}
          </span>
        </div>
        <div className="stat">
          <span className="stat-label">Typical time</span>
          <span className="stat-value">{(median / 1000).toFixed(1)}s</span>
          <span className="stat-sub">median, correct answers</span>
        </div>
      </div>
      {missed.length > 0 && <KanaList title="Missed" items={missed} />}
      {slow.length > 0 && <KanaList title={`Slower than ${FLUENT_MS / 1000}s`} items={slow} />}
      <div className="button-row">
        <button type="button" className="primary" onClick={onAgain} autoFocus>
          Another round
        </button>
        <button type="button" className="secondary" onClick={onExit}>
          Back to kana
        </button>
      </div>
    </div>
  )
}

function KanaList({ title, items }: { title: string; items: KanaItem[] }) {
  return (
    <section>
      <h2 className="section-title">{title}</h2>
      <div className="kana-row wrap">
        {items.map((k) => (
          <div key={k.kana} className="kana-cell learning">
            <span lang="ja" className="kana-char">
              {k.kana}
            </span>
            <span className="kana-romaji">{k.romaji[0]}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
