import { useMemo, useState } from 'react'
import { AudioButton } from '../components/AudioButton'
import { WordRuby } from '../components/Sentence'
import type { Word } from '../data/deck'
import { BUILTIN_WORDS } from '../data/decks'
import { KANJI } from '../data/kanji'
import { wordStatus, type WordStatus } from '../lib/srs'
import type { AppState } from '../lib/types'

type KanjiLevel = 'unseen' | 'learning' | 'known'

const HAN = /\p{Script=Han}/u

/** Every kanji in the deck words with the words that use it, in deck order. */
function kanjiIndex(): Map<string, Word[]> {
  const index = new Map<string, Word[]>()
  for (const w of BUILTIN_WORDS) {
    for (const ch of new Set(w.word)) {
      if (HAN.test(ch) && KANJI[ch]) index.set(ch, [...(index.get(ch) ?? []), w])
    }
  }
  return index
}

const STATUS_LABEL: Record<WordStatus, string> = { unseen: 'Not started', learning: 'Learning', known: 'Known', mature: 'Mature' }

export function Kanji({ state }: { state: AppState }) {
  const index = useMemo(kanjiIndex, [])
  const [open, setOpen] = useState<string | null>(null)
  const furigana = state.settings.furigana !== 'never'

  const level = (words: Word[]): KanjiLevel => {
    const statuses = words.map((w) => wordStatus(state, w.id))
    if (statuses.some((s) => s === 'known' || s === 'mature')) return 'known'
    if (statuses.some((s) => s === 'learning')) return 'learning'
    return 'unseen'
  }
  const entries = [...index.entries()].map(([kanji, words]) => ({ kanji, words, level: level(words) }))
  // Kanji you've met first, then the rest in deck order.
  const met = entries.filter((e) => e.level !== 'unseen')
  const ordered = [...met, ...entries.filter((e) => e.level === 'unseen')]
  const detail = open ? KANJI[open] : undefined
  const detailWords = open ? (index.get(open) ?? []) : []

  return (
    <div className="kanji">
      <p className="lead">
        The {entries.length} kanji in your decks. You’ve met <strong>{met.length}</strong> of them in words you’ve
        started. Tap one to see its meaning, readings and the words that use it.
      </p>

      {detail && (
        <section className="kanji-detail" aria-live="polite">
          <div className="kanji-detail-head">
            <span className="kanji-big" lang="ja">
              {detail.kanji}
            </span>
            <div>
              <p className="kanji-meaning">{detail.meaning}</p>
              {detail.on.length > 0 && (
                <p className="kanji-reading">
                  <span className="kanji-reading-label">On</span>{' '}
                  <span lang="ja">{detail.on.join('、')}</span>
                </p>
              )}
              {detail.kun.length > 0 && (
                <p className="kanji-reading">
                  <span className="kanji-reading-label">Kun</span>{' '}
                  <span lang="ja">{detail.kun.join('、')}</span>
                </p>
              )}
            </div>
            <button type="button" className="icon-button subtle" aria-label="Close" onClick={() => setOpen(null)}>
              ×
            </button>
          </div>
          <ul className="word-list">
            {detailWords.map((w) => {
              const status = wordStatus(state, w.id)
              return (
                <li key={w.id} className="word-row">
                  <div className="word-main">
                    <span className="word-ja">
                      <WordRuby word={w} furigana={furigana} />
                    </span>
                    <span className="word-meaning">{w.meaning}</span>
                  </div>
                  <div className="word-side">
                    <span className={`pill ${status}`}>{STATUS_LABEL[status]}</span>
                    <AudioButton texts={[w.reading]} label={`Play ${w.word}`} />
                  </div>
                </li>
              )
            })}
          </ul>
          <p className="muted small">
            On readings come from Chinese and appear mostly in compound words; kun readings are native Japanese and
            appear mostly when the kanji stands alone with kana after it.
          </p>
        </section>
      )}

      <div className="kanji-grid" role="list">
        {ordered.map((e) => (
          <button
            key={e.kanji}
            type="button"
            role="listitem"
            className={`kanji-cell ${e.level} ${open === e.kanji ? 'on' : ''}`}
            onClick={() => setOpen(open === e.kanji ? null : e.kanji)}
            title={KANJI[e.kanji].meaning}
          >
            <span lang="ja">{e.kanji}</span>
          </button>
        ))}
      </div>
      <div className="legend">
        <span className="dot unseen" /> Not met yet <span className="dot learning" /> In a word you’re learning{' '}
        <span className="dot fluent" /> In a word you know
      </div>
    </div>
  )
}
