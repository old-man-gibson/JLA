import { useEffect, useMemo, useState } from 'react'
import type { Script } from '../data/kana'
import {
  BUILDINGS,
  buildingCost,
  buyBuilding,
  buyPerk,
  collectGold,
  formatGold,
  guildReport,
  MAX_IDLE_HOURS,
  PERKS,
  perkCost,
} from '../lib/guild'
import { learnedWords, type RunOptions } from '../lib/run'
import type { AppState } from '../lib/types'
import { studyWords } from '../lib/words'

type Update = (fn: (s: AppState) => AppState) => void

interface Props {
  state: AppState
  update: Update
  onStartRun: (options: RunOptions) => void
  onStartReview: () => void
}

export function Play({ state, update, onStartRun, onStartReview }: Props) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])
  const words = useMemo(() => studyWords(state), [state])
  const report = guildReport(state, words, now)
  const gold = state.guild.gold
  const learned = useMemo(() => learnedWords(state).length, [state])

  const [scripts, setScripts] = useState<Script[]>(['hiragana'])
  const [useWords, setUseWords] = useState(true)
  const wordsOn = useWords && learned > 0
  const toggleScript = (s: Script) =>
    setScripts((v) => (v.includes(s) ? (v.length > 1 ? v.filter((x) => x !== s) : v) : [...v, s]))

  const rankProgress = report.nextRank
    ? (report.matureCards - report.rank.min) / (report.nextRank.min - report.rank.min)
    : 1

  return (
    <div className="page">
      <h1>
        <span lang="ja">遊ぶ</span> Play
      </h1>

      <section className="guild">
        <div className="guild-head">
          <div className={`rank-badge rank-${report.rank.id}`} aria-label={`Rank ${report.rank.id}`}>
            {report.rank.id}
          </div>
          <div className="guild-title">
            <h2>
              <span lang="ja">ギルド</span> Your guild
            </h2>
            <p className="muted small">
              {report.nextRank ? (
                <>
                  {report.matureCards} / {report.nextRank.min} mature cards to rank {report.nextRank.id}
                </>
              ) : (
                <>Top rank. {report.matureCards} mature cards.</>
              )}
              {report.rank.bonus > 0 && <> · +{Math.round(report.rank.bonus * 100)}% gold</>}
            </p>
            <div className="bar" aria-hidden="true">
              <div className="bar-fill" style={{ width: `${Math.min(100, rankProgress * 100)}%` }} />
            </div>
          </div>
        </div>

        <div className="gold-row">
          <div>
            <span className="gold-amount">{formatGold(gold)}</span> <span className="muted">gold</span>
            <p className="muted small">
              {report.perHour.toFixed(1)} gold/hour from {report.working} working {report.working === 1 ? 'card' : 'cards'}
            </p>
          </div>
          <button
            type="button"
            className="primary"
            disabled={report.pending < 1}
            onClick={() => update((s) => collectGold(s, studyWords(s), new Date()))}
          >
            Collect {formatGold(report.pending)}
          </button>
        </div>
        {report.full && <p className="hint">The coffers are full: gold stops piling up after {MAX_IDLE_HOURS} hours.</p>}

        {report.resting > 0 ? (
          <div className="callout">
            <p>
              <strong>
                {report.resting} {report.resting === 1 ? 'card is' : 'cards are'} resting.
              </strong>{' '}
              Overdue cards earn nothing until you review them.
            </p>
            <button type="button" className="secondary" onClick={onStartReview}>
              Review now
            </button>
          </div>
        ) : (
          report.working === 0 && (
            <p className="hint">
              Each word you learn becomes an adventurer once it passes its first reviews. The better you know it, the
              more gold it brings in.
            </p>
          )
        )}

        <h3 className="section-title">Buildings</h3>
        <ul className="shop">
          {BUILDINGS.map((b) => {
            const level = state.guild.buildings[b.id] ?? 0
            const maxed = level >= b.max
            const cost = buildingCost(b, level)
            return (
              <li key={b.id} className="shop-row">
                <div>
                  <strong>
                    <span lang="ja">{b.ja}</span> {b.name}
                  </strong>{' '}
                  <span className="muted small">
                    Lv {level}/{b.max}
                  </span>
                  <p className="muted small">{b.describe(maxed ? level : level + 1)}</p>
                </div>
                <button
                  type="button"
                  className="secondary buy"
                  disabled={maxed || gold < cost}
                  onClick={() => update((s) => buyBuilding(s, b.id))}
                >
                  {maxed ? 'Max' : `${formatGold(cost)} g`}
                </button>
              </li>
            )
          })}
        </ul>
      </section>

      <section className="watch">
        <h2>
          <span lang="ja">夜番</span> Night Watch
        </h2>
        <p className="lead">
          Yokai drift toward your lantern. Type a yokai’s reading to banish it. Level up, pick upgrades, and survive
          the boss every fifth wave. It uses kana and words you’ve already met, and doesn’t change your reviews.
        </p>
        <div className="chip-row" role="group" aria-label="What to practise">
          {(['hiragana', 'katakana'] as const).map((s) => (
            <button
              key={s}
              type="button"
              className={`chip ${scripts.includes(s) ? 'on' : ''}`}
              aria-pressed={scripts.includes(s)}
              onClick={() => toggleScript(s)}
            >
              {s === 'hiragana' ? 'Hiragana' : 'Katakana'}
            </button>
          ))}
          <button
            type="button"
            className={`chip ${wordsOn ? 'on' : ''}`}
            aria-pressed={wordsOn}
            disabled={learned === 0}
            onClick={() => setUseWords((v) => !v)}
            title={learned === 0 ? 'Review a few words first' : undefined}
          >
            My words ({learned})
          </button>
        </div>
        <button
          type="button"
          className="primary wide"
          onClick={() => onStartRun({ scripts, words: wordsOn })}
        >
          Start the watch
        </button>
        {state.runs.best > 0 && (
          <p className="muted small">
            Best: {state.runs.best.toLocaleString()} points · wave {state.runs.bestWave}
          </p>
        )}

        <h3 className="section-title">Permanent upgrades</h3>
        <ul className="shop">
          {PERKS.map((p) => {
            const level = state.guild.perks[p.id] ?? 0
            const cost = perkCost(state, p)
            return (
              <li key={p.id} className="shop-row">
                <div>
                  <strong>
                    <span lang="ja">{p.ja}</span> {p.name}
                  </strong>{' '}
                  <span className="muted small">
                    Lv {level}/{p.costs.length}
                  </span>
                  <p className="muted small">{p.describe}</p>
                </div>
                <button
                  type="button"
                  className="secondary buy"
                  disabled={cost === undefined || gold < cost}
                  onClick={() => update((s) => buyPerk(s, p.id))}
                >
                  {cost === undefined ? 'Max' : `${formatGold(cost)} g`}
                </button>
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}
