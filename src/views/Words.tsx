import { useState } from 'react'
import { AudioButton } from '../components/AudioButton'
import { WordRuby } from '../components/Sentence'
import type { Word } from '../data/deck'
import { DECKS } from '../data/decks'
import { cardId, formatInterval, wordStatus, type WordStatus } from '../lib/srs'
import type { AppState } from '../lib/types'
import { removeCustomWord } from '../lib/words'
import { Kanji } from './Kanji'

type Update = (fn: (s: AppState) => AppState) => void

const STATUS_LABEL: Record<WordStatus, string> = {
  unseen: 'Not started',
  learning: 'Learning',
  known: 'Known',
  mature: 'Mature',
}

export function Words({ state, update }: { state: AppState; update: Update }) {
  // Captured once per visit; the screen remounts whenever you come back to it.
  const [now] = useState(() => new Date())
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null)
  const [view, setView] = useState<'words' | 'kanji'>('words')
  const custom = Object.values(state.customWords).sort((a, b) => b.addedAt.localeCompare(a.addedAt))

  const row = (word: Word, removable: boolean) => {
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
          <span className="word-meaning">
            {word.meaning}
            {word.source && <span className="source-tag"> · {word.source}</span>}
          </span>
        </div>
        <div className="word-side">
          <span className={`pill ${status}`}>{STATUS_LABEL[status]}</span>
          {nextDue && status !== 'unseen' && (
            <span className="word-due">{nextDue <= now ? 'due now' : `in ${formatInterval(now, nextDue)}`}</span>
          )}
          <AudioButton texts={[word.reading]} label={`Play ${word.word}`} />
          {removable &&
            (confirmRemove === word.id ? (
              <button
                type="button"
                className="small-danger"
                onClick={() => {
                  update((s) => removeCustomWord(s, word.id))
                  setConfirmRemove(null)
                }}
              >
                Remove
              </button>
            ) : (
              <button
                type="button"
                className="icon-button subtle"
                aria-label={`Remove ${word.word}`}
                title="Remove"
                onClick={() => setConfirmRemove(word.id)}
              >
                ×
              </button>
            ))}
        </div>
      </li>
    )
  }

  const header = (
    <>
      <h1>
        <span lang="ja">単語</span> Words
      </h1>
      <div className="segmented" role="tablist" aria-label="Words or kanji">
        <button type="button" role="tab" aria-selected={view === 'words'} className={`segment ${view === 'words' ? 'on' : ''}`} onClick={() => setView('words')}>
          <span lang="ja">単語</span> Words
        </button>
        <button type="button" role="tab" aria-selected={view === 'kanji'} className={`segment ${view === 'kanji' ? 'on' : ''}`} onClick={() => setView('kanji')}>
          <span lang="ja">漢字</span> Kanji
        </button>
      </div>
    </>
  )

  if (view === 'kanji') {
    return (
      <div className="page">
        {header}
        <Kanji state={state} />
      </div>
    )
  }

  return (
    <div className="page">
      {header}
      <p className="lead">
        New words come from your manga first, then one from each enabled deck in turn. Turn decks on or off in
        Settings.
      </p>

      <section>
        <h2 className="section-title">
          <span lang="ja">漫画</span> From your manga · {custom.length}
        </h2>
        {custom.length === 0 ? (
          <p className="empty-note">Words you add in Read show up here and are introduced before deck words.</p>
        ) : (
          <ul className="word-list">{custom.map((w) => row(w, true))}</ul>
        )}
      </section>

      {DECKS.map((deck) => {
        const on = state.settings.decks.includes(deck.id)
        return (
          <section key={deck.id}>
            <h2 className="section-title">
              <span lang="ja">{deck.ja}</span> {deck.name} · {deck.words.length}
              {!on && <span className="off-tag"> · off</span>}
            </h2>
            <ul className="word-list">{deck.words.map((w) => row(w, false))}</ul>
          </section>
        )
      })}
    </div>
  )
}
