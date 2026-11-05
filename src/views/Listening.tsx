import { useEffect, useMemo, useState } from 'react'
import { Sentence, WordRuby } from '../components/Sentence'
import type { Word } from '../data/deck'
import { useKeys } from '../hooks/useKeys'
import { plainText } from '../lib/furigana'
import { speak, speechSupported, stopSpeaking } from '../lib/speech'
import type { AppState } from '../lib/types'
import { countToday } from '../lib/quests'
import { findWord, studyWords } from '../lib/words'

const ROUND = 10

interface ListenItem {
  word: Word
  /** Hear the word alone, or its whole example sentence. */
  mode: 'word' | 'sentence'
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

/** Words whose cards you've reviewed at least once. */
export function heardWords(state: AppState): Word[] {
  return Object.keys(state.words).flatMap((id) => {
    const seen = Object.values(state.cards).some((c) => c.wordId === id && c.fsrs.reps > 0)
    const word = findWord(state, id)
    return seen && word ? [word] : []
  })
}

export function buildListening(learned: Word[], distractors: Word[]): ListenItem[] {
  const others = [...new Map([...learned, ...distractors].map((w) => [w.id, w])).values()]
  return shuffle(learned)
    .slice(0, ROUND)
    .map((word, i) => {
      const mode: ListenItem['mode'] = i % 2 === 0 ? 'word' : 'sentence'
      const answer = mode === 'word' ? word.meaning : word.translation
      const pool = shuffle(others.filter((w) => w.id !== word.id))
        .map((w) => (mode === 'word' ? w.meaning : w.translation))
        .filter((text, j, all) => text !== answer && all.indexOf(text) === j)
      return { word, mode, answer, options: shuffle([answer, ...pool.slice(0, 3)]) }
    })
}

export function Listening({
  state,
  update,
  onExit,
}: {
  state: AppState
  update: (fn: (s: AppState) => AppState) => void
  onExit: () => void
}) {
  const learned = useMemo(() => heardWords(state), [state])
  const [round, setRound] = useState(() => buildListening(learned, studyWords(state)))
  const [index, setIndex] = useState(0)
  const [choice, setChoice] = useState<string | null>(null)
  const [right, setRight] = useState(0)
  const item = round[index]
  const furigana = state.settings.furigana !== 'never'

  const play = () => {
    if (!item) return
    speak(item.mode === 'word' ? item.word.reading : plainText(item.word.sentence))
  }

  // Play each item as it appears.
  useEffect(() => {
    if (item) speak(item.mode === 'word' ? item.word.reading : plainText(item.word.sentence))
  }, [item])
  useEffect(() => stopSpeaking, [])

  const choose = (option: string) => {
    if (choice) return
    setChoice(option)
    if (option === item.answer) {
      setRight((r) => r + 1)
      update((s) => countToday(s, 'listeningCorrect', 1, new Date()))
    }
  }
  const next = () => {
    setChoice(null)
    setIndex((i) => i + 1)
  }
  useKeys(
    !item
      ? {}
      : choice
        ? { Enter: next, ' ': next }
        : { ...Object.fromEntries(item.options.map((o, i) => [String(i + 1), () => choose(o)])), r: play },
  )

  if (!speechSupported()) {
    return (
      <div className="page">
        <p className="callout">This device has no text-to-speech, so listening practice can’t play anything here.</p>
        <button type="button" className="secondary" onClick={onExit}>
          Back
        </button>
      </div>
    )
  }

  if (learned.length < 4) {
    return (
      <div className="page">
        <p className="callout">
          Listening practice uses words you’ve already reviewed. Learn at least 4 words first ({learned.length} so far).
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
            <span className="stat-label">Understood</span>
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
              setRound(buildListening(learned, studyWords(state)))
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
      <section className="study-card listen-card">
        <p className="card-tag">{item.mode === 'word' ? 'What does this word mean?' : 'What does this sentence mean?'}</p>
        <button type="button" className="listen-play" onClick={play} aria-label="Play again">
          <svg viewBox="0 0 24 24" width="40" height="40" aria-hidden="true">
            <path
              fill="currentColor"
              d="M4 9v6h4l5 4V5L8 9H4zm12.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4zM14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6z"
            />
          </svg>
          <span>Play again</span>
        </button>
        <div className="listen-options" role="group" aria-label="Choose the meaning">
          {item.options.map((o, i) => {
            const state = !choice ? '' : o === item.answer ? 'right' : o === choice ? 'wrong' : 'dim'
            return (
              <button key={o} type="button" className={`choice listen-choice ${state}`} onClick={() => choose(o)} disabled={choice !== null}>
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
            {item.mode === 'word' ? (
              <p className="big-word">
                <WordRuby word={item.word} furigana={furigana} />
              </p>
            ) : (
              <Sentence source={item.word.sentence} furigana={furigana} target="highlight" />
            )}
            <button type="button" className="primary wide" onClick={next} autoFocus>
              Next <kbd>Enter</kbd>
            </button>
          </div>
        )}
      </section>
    </div>
  )
}
