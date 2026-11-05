import { useMemo, useState } from 'react'
import { WordRuby } from '../components/Sentence'
import type { Word } from '../data/deck'
import { KANJI } from '../data/kanji'
import { useKeys } from '../hooks/useKeys'
import { speak } from '../lib/speech'
import type { AppState } from '../lib/types'
import { findWord } from '../lib/words'

const ROUND = 10
const HAN = /\p{Script=Han}/u

interface KanjiItem {
  /** meaning: what does this kanji mean? reading: how is this word read? */
  mode: 'meaning' | 'reading'
  kanji?: string
  word: Word
  options: string[]
  answer: string
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

/** Started words written with kanji, and the kanji in them. */
export function kanjiMet(state: AppState): { words: Word[]; kanji: string[] } {
  const words = Object.keys(state.words)
    .map((id) => findWord(state, id))
    .filter((w): w is Word => Boolean(w && HAN.test(w.word)))
  const kanji = [...new Set(words.flatMap((w) => [...w.word].filter((ch) => HAN.test(ch) && KANJI[ch])))]
  return { words, kanji }
}

function distinctOthers(answer: string, pool: string[]): string[] {
  return shuffle([...new Set(pool)].filter((x) => x !== answer)).slice(0, 3)
}

export function buildKanjiRound(words: Word[], kanji: string[]): KanjiItem[] {
  const allMeanings = Object.values(KANJI).map((k) => k.meaning)
  const readings = words.map((w) => w.reading)
  const items: KanjiItem[] = []
  const kanjiQueue = shuffle(kanji)
  const wordQueue = shuffle(words)
  for (let i = 0; i < ROUND && (kanjiQueue.length || wordQueue.length); i++) {
    const wantMeaning = i % 2 === 0 ? kanjiQueue.length > 0 : wordQueue.length === 0
    if (wantMeaning) {
      const k = kanjiQueue.shift()!
      const answer = KANJI[k].meaning
      const word = words.find((w) => w.word.includes(k))!
      items.push({ mode: 'meaning', kanji: k, word, answer, options: shuffle([answer, ...distinctOthers(answer, allMeanings)]) })
    } else {
      const word = wordQueue.shift()!
      // Readings of other started words, padded with readings of words sharing a kanji when there are few.
      const others = distinctOthers(word.reading, readings)
      if (others.length < 3) continue
      items.push({ mode: 'reading', word, answer: word.reading, options: shuffle([word.reading, ...others]) })
    }
  }
  return items
}

export function KanjiPractice({ state, onExit }: { state: AppState; onExit: () => void }) {
  const met = useMemo(() => kanjiMet(state), [state])
  const [round, setRound] = useState(() => buildKanjiRound(met.words, met.kanji))
  const [index, setIndex] = useState(0)
  const [choice, setChoice] = useState<string | null>(null)
  const [right, setRight] = useState(0)
  const item = round[index]
  const furigana = state.settings.furigana !== 'never'

  const choose = (option: string) => {
    if (choice || !item) return
    setChoice(option)
    if (option === item.answer) setRight((r) => r + 1)
    if (state.settings.autoplayAudio) speak(item.word.reading)
  }
  const next = () => {
    setChoice(null)
    setIndex((i) => i + 1)
  }
  useKeys(
    !item ? {} : choice ? { Enter: next, ' ': next } : Object.fromEntries(item.options.map((o, i) => [String(i + 1), () => choose(o)])),
  )

  if (met.words.length < 4) {
    return (
      <div className="page">
        <p className="callout">
          Kanji practice uses the kanji in words you’ve started. Start at least 4 words written with kanji first (
          {met.words.length} so far).
        </p>
        <button type="button" className="secondary" onClick={onExit}>
          Back
        </button>
      </div>
    )
  }

  if (!item) {
    return (
      <div className="page">
        <h2>Round complete</h2>
        <div className="stats">
          <div className="stat">
            <span className="stat-label">Correct</span>
            <span className="stat-value">
              {right}/{round.length}
            </span>
          </div>
        </div>
        <div className="button-row">
          <button
            type="button"
            className="primary"
            autoFocus
            onClick={() => {
              setRound(buildKanjiRound(met.words, met.kanji))
              setIndex(0)
              setRight(0)
            }}
          >
            Another round
          </button>
          <button type="button" className="secondary" onClick={onExit}>
            Back
          </button>
        </div>
      </div>
    )
  }

  const info = item.kanji ? KANJI[item.kanji] : undefined
  return (
    <div className="page drill">
      <div className="review-bar">
        <button type="button" className="link-button" onClick={onExit}>
          ← Stop
        </button>
        <span className="progress-text">
          {index + 1} / {round.length}
        </span>
      </div>
      <section className="study-card">
        <p className="card-tag">{item.mode === 'meaning' ? 'What does this kanji mean?' : 'How is this word read?'}</p>
        <p className="kanji-prompt" lang="ja">
          {item.mode === 'meaning' ? item.kanji : item.word.word}
        </p>
        <div className="listen-options" role="group" aria-label="Choose an answer">
          {item.options.map((o, i) => {
            const cls = !choice ? '' : o === item.answer ? 'right' : o === choice ? 'wrong' : 'dim'
            return (
              <button
                key={o}
                type="button"
                className={`choice listen-choice ${cls}`}
                onClick={() => choose(o)}
                disabled={choice !== null}
                lang={item.mode === 'reading' ? 'ja' : undefined}
              >
                <span>{o}</span>
                <kbd>{i + 1}</kbd>
              </button>
            )
          })}
        </div>
        {choice && (
          <div className="result-block">
            <div className={`verdict ${choice === item.answer ? 'right' : 'wrong'}`}>
              {choice === item.answer ? 'Correct' : 'Not quite'}
            </div>
            {info && (
              <p className="muted">
                <span lang="ja">{info.kanji}</span>: {info.meaning}
                {info.on.length > 0 && <> · On <span lang="ja">{info.on.join('、')}</span></>}
                {info.kun.length > 0 && <> · Kun <span lang="ja">{info.kun.join('、')}</span></>}
              </p>
            )}
            <p className="big-word">
              <WordRuby word={item.word} furigana={furigana} />
            </p>
            <p className="muted">{item.word.meaning}</p>
            <button type="button" className="primary wide" onClick={next} autoFocus>
              Next <kbd>Enter</kbd>
            </button>
          </div>
        )}
      </section>
    </div>
  )
}
