import { useState } from 'react'
import { KANA } from '../data/kana'
import { kanaLevel } from '../lib/kanaDrill'
import { GRAMMAR } from '../data/grammar'
import { STORIES } from '../data/stories'
import { collectGold, formatGold, guildReport } from '../lib/guild'
import { questStatuses } from '../lib/quests'
import { computeStats, dayStart, formatInterval, nextItem, queueCounts } from '../lib/srs'
import type { AppState } from '../lib/types'
import { studyWords } from '../lib/words'

interface Props {
  state: AppState
  update: (fn: (s: AppState) => AppState) => void
  onStartReview: () => void
  onOpen: (tab: 'kana' | 'grammar' | 'stories' | 'read' | 'play') => void
}

export function Today({ state, update, onStartReview, onOpen }: Props) {
  // Captured once per visit; the screen remounts whenever you come back to it.
  const [now] = useState(() => new Date())
  const words = studyWords(state)
  const counts = queueCounts(state, words, now)
  const stats = computeStats(state, words, now)
  const next = nextItem(state, words, now)
  const due = counts.learning + counts.review + counts.newGrammar
  const hasWork = next.type !== 'done'
  const guild = guildReport(state, words, now)
  const [collected, setCollected] = useState(0)

  const fluent = (script: 'hiragana' | 'katakana') => {
    const items = KANA.filter((k) => k.script === script)
    return { fluent: items.filter((k) => kanaLevel(state.kana[k.kana]) === 'fluent').length, total: items.length }
  }
  const hira = fluent('hiragana')
  const kata = fluent('katakana')
  const basicHiragana = KANA.filter((k) => k.script === 'hiragana' && k.group === 'basic')
  const basicFluent = basicHiragana.filter((k) => kanaLevel(state.kana[k.kana]) === 'fluent').length
  const kanaFirst = basicFluent < basicHiragana.length

  // A short, ordered list of what to do today. Steps tick off as they're done.
  const todayStart = dayStart(now).toISOString()
  const kanaToday = Object.values(state.kana).some((k) => k.lastSeen >= todayStart)
  const nextGrammar = GRAMMAR.find((g) => !state.grammar[g.id])
  const grammarToday = Object.values(state.grammar).some((g) => g.startedAt >= todayStart)
  const nextStory = STORIES.find((st) => !state.storiesRead[st.id])
  const storyToday = Object.values(state.storiesRead).some((at) => at >= todayStart)
  const plan: { id: string; title: string; detail: string; action: string; done: boolean; go: () => void }[] = [
    {
      id: 'review',
      title: 'Reviews and new words',
      detail: hasWork
        ? `${due} due, ${counts.newWords} new ${counts.newWords === 1 ? 'word' : 'words'}`
        : 'All done for now',
      action: 'Start',
      done: !hasWork,
      go: onStartReview,
    },
    ...(kanaFirst
      ? [
          {
            id: 'kana',
            title: 'Kana drill',
            detail: `${basicFluent} of ${basicHiragana.length} basic hiragana fluent. Reading kana without effort makes everything easier.`,
            action: 'Drill',
            done: kanaToday,
            go: () => onOpen('kana'),
          },
        ]
      : []),
    ...(nextGrammar || grammarToday
      ? [
          {
            id: 'grammar',
            title: 'A grammar point',
            detail: grammarToday ? 'Started one today' : `Next: ${nextGrammar!.title}`,
            action: 'Learn',
            done: grammarToday,
            go: () => onOpen('grammar'),
          },
        ]
      : []),
    ...(nextStory || storyToday
      ? [
          {
            id: 'story',
            title: 'Read a story',
            detail: storyToday ? 'Read one today' : `Next: ${nextStory!.titleEn}`,
            action: 'Read',
            done: storyToday,
            go: () => onOpen('stories'),
          },
        ]
      : []),
  ]

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

      <section className="plan" aria-label="Today’s plan">
        <h2 className="section-title">
          <span lang="ja">今日の予定</span> Today’s plan
        </h2>
        <ol className="plan-list">
          {plan.map((step) => (
            <li key={step.id} className={`plan-step ${step.done ? 'done' : ''}`}>
              <span className="plan-check" aria-hidden="true">
                {step.done ? '✓' : ''}
              </span>
              <span className="plan-text">
                <strong>{step.title}</strong>
                <span className="muted small">{step.detail}</span>
              </span>
              {!step.done && (
                <button type="button" className="secondary plan-go" onClick={step.go}>
                  {step.action}
                </button>
              )}
            </li>
          ))}
        </ol>
      </section>

      <section className="today-guild">
        <div className={`rank-badge rank-${guild.rank.id}`} aria-label={`Guild rank ${guild.rank.id}`}>
          {guild.rank.id}
        </div>
        <p>
          <strong>{formatGold(state.guild.gold)} gold</strong>
          {collected > 0 ? (
            <span className="muted"> · collected {formatGold(collected)}</span>
          ) : (
            <span className="muted">
              {' '}
              · {formatGold(guild.pending)} waiting · {guild.perHour.toFixed(1)}/hour
            </span>
          )}
          {(() => {
            const ready = questStatuses(state, now).filter((q) => q.complete && !q.claimed).length
            return ready > 0 ? (
              <>
                <br />
                <span className="small">
                  {ready} {ready === 1 ? 'quest is' : 'quests are'} ready to claim in Play.
                </span>
              </>
            ) : null
          })()}
          {guild.resting > 0 && (
            <>
              <br />
              <span className="small">
                {guild.resting} resting {guild.resting === 1 ? 'card' : 'cards'}: review to put them back to work.
              </span>
            </>
          )}
        </p>
        {guild.pending >= 1 && collected === 0 ? (
          <button
            type="button"
            className="secondary"
            onClick={() => {
              setCollected(guild.pending)
              update((s) => collectGold(s, studyWords(s), new Date()))
            }}
          >
            Collect
          </button>
        ) : (
          <button type="button" className="secondary" onClick={() => onOpen('play')}>
            Guild
          </button>
        )}
      </section>

      <section className="callout read-callout">
        <p>
          <strong>Reading manga?</strong> Photograph a page and tap the words you want to learn.
        </p>
        <button type="button" className="secondary" onClick={() => onOpen('read')}>
          Read a page
        </button>
      </section>

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

      <details className="guide">
        <summary>How to study with this app</summary>
        <h3>Every day, 15–30 minutes</h3>
        <ol>
          <li>
            <strong>Reviews first.</strong> Do them every day, even if it’s only five minutes. Skipping a day makes the
            next one heavier, and overdue words stop earning guild gold.
          </li>
          <li>
            <strong>New words.</strong> Five a day is a good pace: about 150 words a month without the reviews piling up.
          </li>
          <li>
            <strong>One grammar point</strong> every day or two, in the order of the list.
          </li>
          <li>
            <strong>Read something:</strong> a story, or a manga page in Read. This is where words turn into Japanese
            you can actually understand.
          </li>
        </ol>
        <h3>Doing it well</h3>
        <ul>
          <li>Until the basic hiragana are fluent, start each day with a kana drill. It makes everything else easier.</li>
          <li>
            Grade yourself honestly. Press Again when you hesitated or guessed: it only means the card comes back sooner.
          </li>
          <li>
            In manga, add only the words you’d like to remember, three to five per page. The rest will come back
            naturally.
          </li>
          <li>Extra time? Practice (forms, listening, kanji) and Night Watch train the same material from new angles.</li>
        </ul>
        <h3>Outside the app</h3>
        <ul>
          <li>Listen to beginner Japanese podcasts or YouTube channels made for learners while commuting or cooking.</li>
          <li>Watch anime you already know with Japanese subtitles, and pause on lines you can read.</li>
          <li>Switch a game you know well to Japanese. Item and menu text repeats constantly.</li>
        </ul>
      </details>
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
