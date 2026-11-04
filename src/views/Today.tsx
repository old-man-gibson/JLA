import { useState } from 'react'
import { DECK } from '../data/deck'
import { KANA } from '../data/kana'
import { kanaLevel } from '../lib/kanaDrill'
import { computeStats, formatInterval, nextItem, queueCounts } from '../lib/srs'
import type { AppState } from '../lib/types'

interface Props {
  state: AppState
  onStartReview: () => void
  onOpenKana: () => void
}

export function Today({ state, onStartReview, onOpenKana }: Props) {
  // Captured once per visit; the screen remounts whenever you come back to it.
  const [now] = useState(() => new Date())
  const counts = queueCounts(state, DECK, now)
  const stats = computeStats(state, DECK, now)
  const next = nextItem(state, DECK, now)
  const due = counts.learning + counts.review
  const hasWork = next.type !== 'done'

  const fluent = (script: 'hiragana' | 'katakana') => {
    const items = KANA.filter((k) => k.script === script)
    return { fluent: items.filter((k) => kanaLevel(state.kana[k.kana]) === 'fluent').length, total: items.length }
  }
  const hira = fluent('hiragana')
  const kata = fluent('katakana')
  const kanaFirst = hira.fluent < 46

  return (
    <div className="page">
      <section className="hero">
        <h1>
          <span lang="ja">今日</span> Today
        </h1>
        {hasWork ? (
          <>
            <p className="hero-line">
              <strong>{due}</strong> {due === 1 ? 'card' : 'cards'} due · <strong>{counts.newWords}</strong> new{' '}
              {counts.newWords === 1 ? 'word' : 'words'}
            </p>
            <button type="button" className="primary wide" onClick={onStartReview}>
              Start reviewing
            </button>
          </>
        ) : (
          <>
            <p className="hero-line">
              All caught up.
              {next.nextDue && <> Next card in {formatInterval(now, next.nextDue)}.</>}
            </p>
            <p className="hint">Good time to read or listen to something in Japanese.</p>
          </>
        )}
      </section>

      {kanaFirst && (
        <section className="callout">
          <p>
            <strong>Make kana automatic first.</strong> Every word card uses kana, so reading it without effort makes
            everything else easier.
          </p>
          <button type="button" className="secondary" onClick={onOpenKana}>
            Practise kana
          </button>
        </section>
      )}

      <h2 className="section-title">Vocabulary</h2>
      <div className="stats">
        <Stat label="Started" value={`${stats.started}`} sub={`of ${stats.total} words`} />
        <Stat label="Known" value={`${stats.known}`} sub="both cards graduated" />
        <Stat label="Mature" value={`${stats.mature}`} sub="interval 21+ days" />
        <Stat
          label="Recall rate"
          value={stats.retention === undefined ? '–' : `${Math.round(stats.retention * 100)}%`}
          sub={stats.retentionSample ? `${stats.retentionSample} reviews, 30 days` : 'after your first reviews'}
        />
        <Stat label="Reviews today" value={`${stats.reviewsToday}`} />
        <Stat label="Due by tomorrow" value={`${stats.dueTomorrow}`} />
      </div>

      <h2 className="section-title">Kana</h2>
      <div className="stats">
        <Stat label="Hiragana fluent" value={`${hira.fluent}`} sub={`of ${hira.total}`} />
        <Stat label="Katakana fluent" value={`${kata.fluent}`} sub={`of ${kata.total}`} />
      </div>
      <p className="footnote">
        Recall rate is the number to watch: around 85–90% means the schedule is working. Much lower means too many new
        words at once.
      </p>
    </div>
  )
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="stat">
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
      {sub && <span className="stat-sub">{sub}</span>}
    </div>
  )
}
