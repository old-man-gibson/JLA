import { useState } from 'react'
import { AudioButton } from '../components/AudioButton'
import { WordRuby } from '../components/Sentence'
import { DECK } from '../data/deck'
import { cardId, formatInterval, wordStatus, type WordStatus } from '../lib/srs'
import type { AppState } from '../lib/types'

const STATUS_LABEL: Record<WordStatus, string> = {
  unseen: 'Not started',
  learning: 'Learning',
  known: 'Known',
  mature: 'Mature',
}

export function Words({ state }: { state: AppState }) {
  // Captured once per visit; the screen remounts whenever you come back to it.
  const [now] = useState(() => new Date())
  return (
    <div className="page">
      <h1>
        <span lang="ja">単語</span> Words
      </h1>
      <p className="lead">
        The starter deck: {DECK.length} common beginner words, each with an example sentence. New words are introduced
        in this order.
      </p>
      <ul className="word-list">
        {DECK.map((word) => {
          const status = wordStatus(state, word.id)
          const dues = (['recognize', 'produce'] as const)
            .map((k) => state.cards[cardId(word.id, k)]?.fsrs.due)
            .filter((d): d is string => Boolean(d))
            .sort()
          const nextDue = dues[0] ? new Date(dues[0]) : undefined
          return (
            <li key={word.id} className="word-row">
              <div className="word-main">
                <span className="word-ja">
                  <WordRuby word={word} furigana={state.settings.furigana !== 'never'} />
                </span>
                <span className="word-meaning">{word.meaning}</span>
              </div>
              <div className="word-side">
                <span className={`pill ${status}`}>{STATUS_LABEL[status]}</span>
                {nextDue && status !== 'unseen' && (
                  <span className="word-due">{nextDue <= now ? 'due now' : `in ${formatInterval(now, nextDue)}`}</span>
                )}
                <AudioButton texts={[word.reading]} label={`Play ${word.word}`} />
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
