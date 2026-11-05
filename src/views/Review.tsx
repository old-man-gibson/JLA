import { useEffect, useMemo, useRef, useState } from 'react'
import { Rating, type Grade } from 'ts-fsrs'
import { bind, unbind } from 'wanakana'
import { AudioButton } from '../components/AudioButton'
import { Keypad } from '../components/Keypad'
import { resolveLayout } from '../lib/keypadLayouts'
import { Ruby, Sentence } from '../components/Sentence'
import { EXERCISE_BY_ID, GRAMMAR_BY_ID, type GrammarExercise } from '../data/grammar'
import type { Word } from '../data/deck'
import { useKeys } from '../hooks/useKeys'
import { finalizeKanaInput, isReadingCorrect } from '../lib/answer'
import { plainText } from '../lib/furigana'
import { speak, stopSpeaking } from '../lib/speech'
import {
  formatInterval,
  gradeCard,
  introduceWord,
  isMature,
  nextItem,
  previewDue,
  queueCounts,
} from '../lib/srs'
import type { AppState, Settings, StudyCard } from '../lib/types'
import { applyKey, useOnscreenKeys, useTypingKeys, type TypedKey } from '../lib/typing'
import { findWord, studyWords } from '../lib/words'

type Update = (fn: (s: AppState) => AppState) => void

interface Props {
  state: AppState
  update: Update
  onExit: () => void
}

export function Review({ state, update, onExit }: Props) {
  const [now, setNow] = useState(() => new Date())
  const words = useMemo(() => studyWords(state), [state])
  const item = useMemo(() => nextItem(state, words, now), [state, words, now])
  const counts = useMemo(() => queueCounts(state, words, now), [state, words, now])

  // Only re-check the clock while waiting, so the card never changes under you mid-answer.
  useEffect(() => {
    if (item.type !== 'done') return
    const timer = setInterval(() => setNow(new Date()), 15000)
    return () => clearInterval(timer)
  }, [item.type])

  useEffect(() => stopSpeaking, [])

  const apply = (fn: (s: AppState, at: Date) => AppState) => {
    const at = new Date()
    update((s) => fn(s, at))
    setNow(at)
  }

  // The card as it was before the last grade, so a mistaken tap can be taken back.
  const [lastGraded, setLastGraded] = useState<StudyCard | null>(null)
  const gradeAndRemember = (card: StudyCard, rating: Grade) => {
    setLastGraded(card)
    apply((s, at) => gradeCard(s, card.id, rating, at))
  }
  const undo = () => {
    const previous = lastGraded
    if (!previous) return
    setLastGraded(null)
    apply((s) => {
      const last = s.log.at(-1)
      return {
        ...s,
        cards: { ...s.cards, [previous.id]: previous },
        log: last?.cardId === previous.id ? s.log.slice(0, -1) : s.log,
      }
    })
  }

  let body
  if (item.type === 'new') {
    body = (
      <NewWord
        key={`new:${item.word.id}`}
        word={item.word}
        settings={state.settings}
        onStart={() => apply((s, at) => introduceWord(s, item.word.id, at))}
      />
    )
  } else if (item.type === 'card' && item.card.kind === 'grammar') {
    const card = item.card
    const onGrade = (rating: Grade) => gradeAndRemember(card, rating)
    body = (
      <GrammarCard
        key={`${card.id}:${card.fsrs.reps}:${card.fsrs.due}`}
        card={card}
        exercise={EXERCISE_BY_ID[card.wordId]}
        settings={state.settings}
        onGrade={onGrade}
      />
    )
  } else if (item.type === 'card') {
    const card = item.card
    // nextItem only returns cards of words in the study list, so the word exists.
    const word = findWord(state, card.wordId)!
    const onGrade = (rating: Grade) => gradeAndRemember(card, rating)
    const key = `${card.id}:${card.fsrs.reps}:${card.fsrs.due}`
    body =
      card.kind === 'recognize' ? (
        <RecognizeCard key={key} card={card} word={word} settings={state.settings} onGrade={onGrade} />
      ) : (
        <ProduceCard key={key} card={card} word={word} settings={state.settings} onGrade={onGrade} />
      )
  } else {
    body = <Done nextDue={item.nextDue} now={now} onExit={onExit} />
  }

  return (
    <div className="review">
      <div className="review-bar">
        <div className="review-actions">
          <button type="button" className="link-button" onClick={onExit}>
            ← Done
          </button>
          {lastGraded && (
            <button type="button" className="link-button undo" onClick={undo} title="Undo the last answer">
              ↶ Undo
            </button>
          )}
        </div>
        <div className="counts" aria-label="Remaining">
          <span className="count new" title="New words and grammar exercises">
            {counts.newWords + counts.newGrammar} new
          </span>
          <span className="count learning" title="Cards in learning">{counts.learning} learning</span>
          <span className="count review-count" title="Reviews due">{counts.review} due</span>
        </div>
      </div>
      {body}
    </div>
  )
}

function useFurigana(settings: Settings, card?: StudyCard) {
  const back = settings.furigana !== 'never'
  const front = settings.furigana === 'always' || (settings.furigana === 'auto' && !(card && isMature(card)))
  return { front, back }
}

function WordExtras({ word }: { word: Word }) {
  if (!word.lemma && !word.source) return null
  return (
    <p className="word-extras">
      {word.lemma && word.lemma !== word.word && (
        <span>
          Dictionary form: <span lang="ja">{word.lemma}</span>
          {word.lemmaReading && word.lemmaReading !== word.lemma && <span lang="ja"> ({word.lemmaReading})</span>}
        </span>
      )}
      {word.source && <span className="source-tag">From {word.source}</span>}
    </p>
  )
}

function speakWord(word: Word) {
  speak(word.reading, plainText(word.sentence))
}

function NewWord({ word, settings, onStart }: { word: Word; settings: Settings; onStart: () => void }) {
  useEffect(() => {
    if (settings.autoplayAudio) speakWord(word)
  }, [word, settings.autoplayAudio])
  const started = useRef(false)
  const start = () => {
    if (started.current) return
    started.current = true
    onStart()
  }
  useKeys({ Enter: start, ' ': start })
  const showReading = word.word !== word.reading
  return (
    <section className="study-card">
      <p className="card-tag new">New word</p>
      <div className="word-head">
        <span className="big-word" lang="ja">
          {word.word}
        </span>
        <AudioButton texts={[word.reading]} label="Play word" />
      </div>
      {showReading && (
        <p className="reading" lang="ja">
          {word.reading}
        </p>
      )}
      <p className="meaning">{word.meaning}</p>
      <WordExtras word={word} />
      <div className="example">
        <Sentence source={word.sentence} furigana={settings.furigana !== 'never'} />
        <AudioButton texts={[plainText(word.sentence)]} label="Play sentence" />
      </div>
      <p className="translation">{word.translation}</p>
      <p className="hint">You’ll practise reading it and typing it from memory.</p>
      <button type="button" className="primary wide" onClick={start} autoFocus>
        Start learning <kbd>Enter</kbd>
      </button>
    </section>
  )
}

interface CardProps {
  card: StudyCard
  word: Word
  settings: Settings
  onGrade: (rating: Grade) => void
}

/** Grades a card at most once, even if a key and a click land together. */
function useOnce(onGrade: (rating: Grade) => void) {
  const done = useRef(false)
  return (rating: Grade) => {
    if (done.current) return
    done.current = true
    onGrade(rating)
  }
}

function RecognizeCard({ card, word, settings, onGrade }: CardProps) {
  const [revealed, setRevealed] = useState(false)
  const furigana = useFurigana(settings, card)
  const grade = useOnce(onGrade)
  const reveal = () => {
    if (revealed) return
    setRevealed(true)
    if (settings.autoplayAudio) speakWord(word)
  }
  useKeys(
    revealed
      ? {
          '1': () => grade(Rating.Again),
          '2': () => grade(Rating.Hard),
          '3': () => grade(Rating.Good),
          '4': () => grade(Rating.Easy),
          ' ': () => grade(Rating.Good),
          Enter: () => grade(Rating.Good),
        }
      : { ' ': reveal, Enter: reveal },
  )
  return (
    <section className="study-card">
      <p className="card-tag">Read it. What does it say, and what does it mean?</p>
      <Sentence
        source={word.sentence}
        furigana={revealed ? furigana.back : furigana.front}
        target="highlight"
        targetFurigana={revealed && furigana.back}
        className="front-sentence"
      />
      {revealed ? (
        <>
          <div className="answer">
            <div className="word-head">
              <span className="big-word" lang="ja">
                {word.word}
              </span>
              <AudioButton texts={[word.reading]} label="Play word" />
            </div>
            {word.word !== word.reading && (
              <p className="reading" lang="ja">
                {word.reading}
              </p>
            )}
            <p className="meaning">{word.meaning}</p>
            <WordExtras word={word} />
            <div className="example-translation">
              <p className="translation">{word.translation}</p>
              <AudioButton texts={[plainText(word.sentence)]} label="Play sentence" />
            </div>
          </div>
          <GradeButtons card={card} onGrade={grade} />
        </>
      ) : (
        <button type="button" className="primary wide" onClick={reveal}>
          Show answer <kbd>Space</kbd>
        </button>
      )}
    </section>
  )
}

function ProduceCard({ card, word, settings, onGrade }: CardProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [result, setResult] = useState<{ typed: string; correct: boolean } | null>(null)
  const furigana = useFurigana(settings, card)
  const grade = useOnce(onGrade)
  const onscreen = useOnscreenKeys(settings)
  const resultRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = inputRef.current
    if (!el || onscreen) return
    bind(el, { IMEMode: true })
    el.focus()
    return () => unbind(el)
  }, [onscreen])

  const check = () => {
    if (result) return
    const typed = finalizeKanaInput(inputRef.current?.value ?? '')
    if (!typed) return
    if (inputRef.current) {
      inputRef.current.value = typed
      // Closes a phone keyboard so the answer and grade buttons aren't hidden behind it.
      inputRef.current.blur()
    }
    setResult({ typed, correct: isReadingCorrect(word, typed) })
    if (settings.autoplayAudio) speakWord(word)
    requestAnimationFrame(() => resultRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }))
  }

  const pressKey = (key: TypedKey) => {
    const el = inputRef.current
    if (!el || result) return
    if (key === 'enter') check()
    else el.value = applyKey(el.value, key, 'kana')
  }
  useTypingKeys(onscreen && result === null, pressKey)

  useKeys(
    result?.correct
      ? {
          '2': () => grade(Rating.Hard),
          '3': () => grade(Rating.Good),
          '4': () => grade(Rating.Easy),
          Enter: () => grade(Rating.Good),
        }
      : { Enter: () => grade(Rating.Again) },
    result !== null,
  )

  return (
    <section className="study-card">
      <p className="card-tag">Type the Japanese for the gap</p>
      <p className="prompt-meaning">{word.meaning}</p>
      <Sentence
        source={word.sentence}
        furigana={result ? furigana.back : furigana.front}
        target={result ? 'highlight' : 'blank'}
        className="front-sentence"
      />
      <p className="translation">{word.translation}</p>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          check()
        }}
        className="answer-form"
      >
        <input
          ref={inputRef}
          lang="ja"
          className={`answer-input ${result ? (result.correct ? 'right' : 'wrong') : ''}`}
          placeholder={onscreen ? 'Tap the keys below' : 'Type in romaji'}
          aria-label="Your answer"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          readOnly={result !== null || onscreen}
          inputMode={onscreen ? 'none' : undefined}
        />
        {!result && !onscreen && (
          <button type="submit" className="primary">
            Check
          </button>
        )}
      </form>
      {!result && onscreen && <Keypad layout={resolveLayout(settings.keypadLayout)} onKey={pressKey} enterLabel="Check" />}
      {result && (
        <div className="result-block" ref={resultRef}>
          <div className={`verdict ${result.correct ? 'right' : 'wrong'}`}>
            {result.correct ? 'Correct' : 'Not quite'}
          </div>
          <div className="answer">
            <div className="word-head">
              <span className="big-word" lang="ja">
                {word.word}
              </span>
              <AudioButton texts={[word.reading]} label="Play word" />
            </div>
            {word.word !== word.reading && (
              <p className="reading" lang="ja">
                {word.reading}
              </p>
            )}
            <WordExtras word={word} />
            {!result.correct && (
              <p className="you-typed">
                You typed <span lang="ja">{result.typed}</span>
              </p>
            )}
          </div>
          {result.correct ? (
            <GradeButtons card={card} onGrade={grade} hideAgain />
          ) : (
            <div className="grade-row">
              <button type="button" className="primary wide" onClick={() => grade(Rating.Again)}>
                Continue <kbd>Enter</kbd>
              </button>
              <button type="button" className="link-button" onClick={() => grade(Rating.Good)}>
                I was right (typo or alternative answer)
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  )
}

function shuffled<T>(items: T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

/** A fill-the-gap grammar exercise: pick the form that completes the sentence. */
function GrammarCard({
  card,
  exercise,
  settings,
  onGrade,
}: {
  card: StudyCard
  exercise: GrammarExercise & { pointId: string }
  settings: Settings
  onGrade: (rating: Grade) => void
}) {
  const furigana = useFurigana(settings, card)
  const grade = useOnce(onGrade)
  const [options] = useState(() => shuffled(exercise.options))
  const [choice, setChoice] = useState<string | null>(null)
  const answer = /\[\[(.+?)\]\]/.exec(exercise.sentence)?.[1] ?? ''
  const correct = choice === answer
  const point = GRAMMAR_BY_ID[exercise.pointId]

  const choose = (option: string) => {
    if (choice) return
    setChoice(option)
    if (settings.autoplayAudio) speak(plainText(exercise.sentence))
  }
  const next = () => grade(correct ? Rating.Good : Rating.Again)
  useKeys(
    choice
      ? { Enter: next, ' ': next }
      : Object.fromEntries(options.map((o, i) => [String(i + 1), () => choose(o)])),
  )

  return (
    <section className="study-card">
      <p className="card-tag">Grammar · {point?.title}</p>
      <Sentence
        source={exercise.sentence}
        furigana={choice ? furigana.back : furigana.front}
        target={choice ? 'highlight' : 'blank'}
        className="front-sentence"
      />
      <p className="translation">{exercise.translation}</p>
      <div className="choices" role="group" aria-label="Choose the missing part">
        {options.map((o, i) => {
          const state = !choice ? '' : o === answer ? 'right' : o === choice ? 'wrong' : 'dim'
          return (
            <button key={o} type="button" className={`choice ${state}`} onClick={() => choose(o)} disabled={choice !== null}>
              <Ruby source={o} furigana={furigana.back} />
              <kbd>{i + 1}</kbd>
            </button>
          )
        })}
      </div>
      {choice && (
        <div className="result-block">
          <div className={`verdict ${correct ? 'right' : 'wrong'}`}>{correct ? 'Correct' : 'Not quite'}</div>
          <p className="why">{exercise.why}</p>
          <div className="example-translation">
            <span className="muted small">Hear the sentence</span>
            <AudioButton texts={[plainText(exercise.sentence)]} label="Play sentence" />
          </div>
          <button type="button" className="primary wide" onClick={next} autoFocus>
            Continue <kbd>Enter</kbd>
          </button>
        </div>
      )}
    </section>
  )
}

const GRADES: { rating: Grade; label: string; key: string }[] = [
  { rating: Rating.Again, label: 'Again', key: '1' },
  { rating: Rating.Hard, label: 'Hard', key: '2' },
  { rating: Rating.Good, label: 'Good', key: '3' },
  { rating: Rating.Easy, label: 'Easy', key: '4' },
]

function GradeButtons({
  card,
  onGrade,
  hideAgain = false,
}: {
  card: StudyCard
  onGrade: (rating: Grade) => void
  hideAgain?: boolean
}) {
  const [now] = useState(() => new Date())
  const due = useMemo(() => previewDue(card, now), [card, now])
  const grades = hideAgain ? GRADES.filter((g) => g.rating !== Rating.Again) : GRADES
  return (
    <div className="grades" role="group" aria-label="How well did you know it?">
      {grades.map((g) => (
        <button
          key={g.rating}
          type="button"
          className={`grade grade-${g.label.toLowerCase()}`}
          onClick={() => onGrade(g.rating)}
        >
          <span className="grade-label">{g.label}</span>
          <span className="grade-interval">{formatInterval(now, due[g.rating])}</span>
          <kbd>{g.key}</kbd>
        </button>
      ))}
    </div>
  )
}

function Done({ nextDue, now, onExit }: { nextDue?: Date; now: Date; onExit: () => void }) {
  useKeys({ Enter: onExit })
  return (
    <section className="study-card done">
      <p className="done-mark" lang="ja">
        おつかれさま
      </p>
      <h2>That’s everything for now.</h2>
      {nextDue && (
        <p>
          Next card in <strong>{formatInterval(now, nextDue)}</strong>.
        </p>
      )}
      <p className="hint">
        Now spend some time with real Japanese at your level: a beginner podcast, a graded reader, or a show with
        Japanese subtitles. Reviews keep words in memory; reading and listening is how you learn to use them.
      </p>
      <button type="button" className="primary wide" onClick={onExit}>
        Back to today
      </button>
    </section>
  )
}
