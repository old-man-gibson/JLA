import { useState } from 'react'
import { AudioButton } from '../components/AudioButton'
import { Sentence } from '../components/Sentence'
import { GRAMMAR, GRAMMAR_BY_ID } from '../data/grammar'
import { plainText } from '../lib/furigana'
import { grammarStatus, startGrammarPoint, type GrammarStatus } from '../lib/srs'
import type { AppState } from '../lib/types'

type Update = (fn: (s: AppState) => AppState) => void

const STATUS_LABEL: Record<GrammarStatus, string> = {
  unseen: 'Not started',
  learning: 'Practising',
  known: 'Known',
}

export function Grammar({
  state,
  update,
  onStartReview,
}: {
  state: AppState
  update: Update
  onStartReview: () => void
}) {
  const [openId, setOpenId] = useState<string | null>(null)
  const open = openId ? GRAMMAR_BY_ID[openId] : undefined
  const furigana = state.settings.furigana !== 'never'

  if (open) {
    const status = grammarStatus(state, open.id)
    return (
      <article className="lesson">
        <button type="button" className="link-button" onClick={() => setOpenId(null)}>
          ← All grammar
        </button>
        <header className="lesson-head">
          <p className="lesson-ja" lang="ja">
            {open.ja}
          </p>
          <h2>{open.title}</h2>
          <p className="lead">{open.summary}</p>
        </header>
        {open.explanation.map((paragraph, i) => (
          <p key={i} className="lesson-text">
            {paragraph}
          </p>
        ))}
        <h3 className="section-title">Examples</h3>
        <ul className="lesson-examples">
          {open.examples.map((ex, i) => (
            <li key={i}>
              <div className="example">
                <Sentence source={ex.sentence} furigana={furigana} target="plain" />
                <AudioButton texts={[plainText(ex.sentence)]} label="Play example" />
              </div>
              <p className="translation">{ex.translation}</p>
            </li>
          ))}
        </ul>
        {status === 'unseen' ? (
          <button
            type="button"
            className="primary wide"
            onClick={() => update((s) => startGrammarPoint(s, open.id, new Date()))}
          >
            Start practising ({open.exercises.length} exercises)
          </button>
        ) : (
          <div className="callout">
            <p>
              {status === 'known'
                ? 'You know this one. Its exercises keep coming back in your reviews, further apart each time.'
                : 'Its exercises are in your reviews, mixed in with your words.'}
            </p>
            <button type="button" className="secondary" onClick={onStartReview}>
              Review now
            </button>
          </div>
        )}
      </article>
    )
  }

  const started = GRAMMAR.filter((g) => state.grammar[g.id]).length
  return (
    <div className="grammar">
      <p className="lead">
        Short lessons on the grammar every beginner needs, in a sensible order. Start a point and its fill-the-gap
        exercises join your reviews. One or two new points a day is plenty. Start the second level once the first
        feels comfortable. {started > 0 && `${started} of ${GRAMMAR.length} started.`}
      </p>
      {(['N5', 'N4'] as const).map((level) => (
        <section key={level} className="grammar-level">
          <h2 className="section-title">
            {level === 'N5' ? 'Beginner (JLPT N5)' : 'Next steps (JLPT N4)'}
          </h2>
      <ol className="grammar-list">
        {GRAMMAR.filter((g) => g.level === level).map((g) => {
          const i = GRAMMAR.indexOf(g)
          const status = grammarStatus(state, g.id)
          return (
            <li key={g.id}>
              <button type="button" className="grammar-row" onClick={() => setOpenId(g.id)}>
                <span className="grammar-num">{i + 1}</span>
                <span className="grammar-main">
                  <span className="grammar-ja" lang="ja">
                    {g.ja}
                  </span>
                  <span className="grammar-title">{g.title}</span>
                </span>
                <span className={`pill ${status === 'unseen' ? 'unseen' : status === 'known' ? 'known' : 'learning'}`}>
                  {STATUS_LABEL[status]}
                </span>
              </button>
            </li>
          )
        })}
      </ol>
        </section>
      ))}
    </div>
  )
}
