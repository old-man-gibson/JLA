import { Fragment, useState, type ReactNode } from 'react'
import { lineText, splitFurigana, wordFromLine, type Reading, type ReaderLine } from '../lib/reader'
import type { AppState } from '../lib/types'
import { addCustomWord, customWordId } from '../lib/words'
import { AudioButton } from './AudioButton'

type Update = (fn: (s: AppState) => AppState) => void

interface Props {
  reading: Reading
  state: AppState
  update: Update
  /** Saved with words the learner adds, e.g. the manga title. */
  source: string
  /** Shown between the header and the lines (the photographed page). */
  children?: ReactNode
}

/**
 * Lines of Japanese with furigana, tappable words that can be added to
 * reviews, grammar notes, and translations hidden until asked for. Used by
 * the manga reader and by stories Claude writes.
 */
export function ReadingLines({ reading, state, update, source, children }: Props) {
  const [furigana, setFurigana] = useState(true)
  const [shown, setShown] = useState<Set<number>>(new Set())
  const [selected, setSelected] = useState<{ line: number; word: number } | null>(null)

  const addWord = (line: ReaderLine, wordIndex: number) => {
    const word = wordFromLine(reading, line, wordIndex, source.trim())
    if (word) update((s) => addCustomWord(s, word, new Date()))
  }

  const toggleShown = (i: number) =>
    setShown((prev) => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })

  return (
    <>
      <div className="reading-head">
        <h2 className="section-title">
          {reading.lines.length} {reading.lines.length === 1 ? 'line' : 'lines'}
        </h2>
        <label className="toggle small">
          <input type="checkbox" checked={furigana} onChange={(e) => setFurigana(e.target.checked)} />
          Furigana
        </label>
      </div>
      {children}
      <p className="hint">Try reading each line before you open its translation.</p>
      <ol className="lines">
        {reading.lines.map((line, i) => {
          const pick = selected?.line === i ? selected.word : undefined
          const info = pick !== undefined ? reading.words[pick] : undefined
          const token = pick !== undefined ? line.tokens.find((t) => t.w === pick) : undefined
          const added = token ? Boolean(state.customWords[customWordId(token.t)]) : false
          return (
            <li key={i} className={`line ${line.kind}`}>
              <div className="line-meta">
                <span>{line.kind === 'sfx' ? 'Sound effect' : line.kind === 'narration' ? 'Narration' : line.speaker || 'Dialogue'}</span>
                <AudioButton texts={[lineText(line)]} label="Play line" />
              </div>
              <p className="line-ja" lang="ja">
                {line.tokens.map((tok, j) => {
                  const parts = splitFurigana(tok.t, tok.r).map((p, k) =>
                    p.ruby && furigana ? (
                      <ruby key={k}>
                        {p.text}
                        <rt>{p.ruby}</rt>
                      </ruby>
                    ) : (
                      <Fragment key={k}>{p.text}</Fragment>
                    ),
                  )
                  if (tok.w === undefined) return <span key={j}>{parts}</span>
                  const isAdded = Boolean(state.customWords[customWordId(tok.t)])
                  return (
                    <button
                      key={j}
                      type="button"
                      className={`tok ${pick === tok.w ? 'on' : ''} ${isAdded ? 'added' : ''}`}
                      onClick={() => setSelected(pick === tok.w ? null : { line: i, word: tok.w! })}
                    >
                      {parts}
                    </button>
                  )
                })}
              </p>
              {info && token && (
                <div className="word-pop">
                  <div className="word-pop-head">
                    <span className="word-pop-word" lang="ja">
                      {token.t}
                    </span>
                    <span lang="ja" className="muted">
                      {token.r ?? info.reading}
                    </span>
                    {info.pos && <span className="pill">{info.pos}</span>}
                  </div>
                  <p className="word-pop-meaning">{info.meaning}</p>
                  {info.lemma && info.lemma !== token.t && (
                    <p className="word-extras">
                      Dictionary form: <span lang="ja">{info.lemma}</span>
                      {info.lemmaReading && <span lang="ja"> ({info.lemmaReading})</span>}
                    </p>
                  )}
                  {added ? (
                    <p className="added-note">In your reviews ✓</p>
                  ) : (
                    <button type="button" className="primary" onClick={() => addWord(line, pick!)}>
                      Add to reviews
                    </button>
                  )}
                </div>
              )}
              {line.grammar.length > 0 && (
                <ul className="line-grammar">
                  {line.grammar.map((g, k) => (
                    <li key={k}>{g}</li>
                  ))}
                </ul>
              )}
              {line.translation &&
                (shown.has(i) ? (
                  <p className="translation" onClick={() => toggleShown(i)}>
                    {line.translation}
                  </p>
                ) : (
                  <button type="button" className="link-button" onClick={() => toggleShown(i)}>
                    Show translation
                  </button>
                ))}
            </li>
          )
        })}
      </ol>
    </>
  )
}
