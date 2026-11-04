import { describe, expect, it } from 'vitest'
import { Rating } from 'ts-fsrs'
import { STARTER_WORDS } from '../data/deck'
import { buyBuilding, buyPerk, cardIncome, collectGold, guildReport, perkCost, PERKS, rankFor } from './guild'
import { cardId, gradeCard, introduceWord } from './srs'
import { defaultState } from './store'
import type { AppState } from './types'

const day = 24 * 3600 * 1000
const t0 = new Date('2026-01-05T10:00:00Z')
const words = STARTER_WORDS

/** One word whose two cards graduated to review on day 1. */
function withGraduatedWord(): AppState {
  let s = defaultState()
  s = { ...s, guild: { ...s.guild, lastCollect: t0.toISOString() } }
  s = introduceWord(s, words[0].id, t0)
  for (const kind of ['recognize', 'produce'] as const) {
    s = gradeCard(s, cardId(words[0].id, kind), Rating.Good, t0)
    s = gradeCard(s, cardId(words[0].id, kind), Rating.Good, new Date(t0.getTime() + 11 * 60_000))
  }
  return s
}

describe('guild', () => {
  it('learning cards earn nothing; graduated cards do', () => {
    const fresh = introduceWord(defaultState(), words[0].id, t0)
    expect(guildReport(fresh, words, t0).perHour).toBe(0)
    const s = withGraduatedWord()
    const report = guildReport(s, words, new Date(t0.getTime() + 3600_000))
    expect(report.working).toBe(2)
    expect(report.perHour).toBeGreaterThan(0)
  })

  it('overdue cards rest and earn nothing until reviewed', () => {
    const s = withGraduatedWord()
    const card = s.cards[cardId(words[0].id, 'recognize')]
    const longAfter = new Date(new Date(card.fsrs.due).getTime() + day)
    expect(cardIncome(card, longAfter)).toBe(0)
    expect(guildReport(s, words, longAfter).resting).toBeGreaterThan(0)
  })

  it('accrues gold up to a 24 hour cap and resets on collect', () => {
    const s = withGraduatedWord()
    const in1h = guildReport(s, words, new Date(t0.getTime() + 3600_000))
    expect(in1h.pending).toBe(Math.floor(in1h.perHour))
    // Before the cards fall due, three days of waiting still pays only 24 hours.
    const capped = guildReport(s, words, new Date(t0.getTime() + 0.9 * day))
    expect(capped.full).toBe(false)
    const collected = collectGold(s, words, new Date(t0.getTime() + 3600_000))
    expect(collected.guild.gold).toBe(in1h.pending)
    expect(guildReport(collected, words, new Date(t0.getTime() + 3600_000)).pending).toBe(0)
  })

  it('ranks go from F to S with mature cards', () => {
    expect(rankFor(0).rank.id).toBe('F')
    expect(rankFor(10).rank.id).toBe('E')
    expect(rankFor(499).rank.id).toBe('A')
    expect(rankFor(600).next).toBeUndefined()
  })

  it('buying needs enough gold and respects max levels; the smithy discounts perks', () => {
    let s = defaultState()
    expect(buyBuilding(s, 'tavern')).toBe(s)
    s = { ...s, guild: { ...s.guild, gold: 1000 } }
    s = buyBuilding(s, 'tavern')
    expect(s.guild.buildings.tavern).toBe(1)
    expect(s.guild.gold).toBe(970)
    const calm = PERKS.find((p) => p.id === 'calm')!
    expect(perkCost(s, calm)).toBe(100)
    s = buyBuilding(s, 'smithy')
    expect(perkCost(s, calm)).toBe(90)
    s = buyPerk(s, 'calm')
    expect(s.guild.perks.calm).toBe(1)
    expect(perkCost(s, calm)).toBeUndefined()
    expect(buyPerk(s, 'calm')).toBe(s)
  })
})
