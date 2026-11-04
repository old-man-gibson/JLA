import { describe, expect, it } from 'vitest'
import { Rating, State } from 'ts-fsrs'
import { STARTER_WORDS as DECK } from '../data/deck'
import {
  cardId,
  computeStats,
  dayStart,
  formatInterval,
  gradeCard,
  introduceWord,
  newWordsLeftToday,
  nextItem,
  wordStatus,
} from './srs'
import { defaultState, importState, exportState } from './store'

const at = (iso: string) => new Date(iso)
const first = DECK[0].id
const second = DECK[1].id

describe('study queue', () => {
  it('starts with the first new word', () => {
    const item = nextItem(defaultState(), DECK, at('2026-01-05T10:00:00'))
    expect(item).toEqual({ type: 'new', word: DECK[0] })
  })

  it('introducing a word creates a recognize and a produce card, both due now', () => {
    const now = at('2026-01-05T10:00:00')
    const s = introduceWord(defaultState(), first, now)
    expect(Object.keys(s.cards).sort()).toEqual([cardId(first, 'produce'), cardId(first, 'recognize')].sort())
    const item = nextItem(s, DECK, now)
    expect(item.type).toBe('card')
  })

  it('learning cards come before new cards and reviews', () => {
    const t0 = at('2026-01-05T10:00:00')
    let s = introduceWord(defaultState(), first, t0)
    s = gradeCard(s, cardId(first, 'recognize'), Rating.Again, t0)
    s = introduceWord(s, second, t0)
    // Five minutes later, the failed card is due again and outranks the new cards of the second word.
    const item = nextItem(s, DECK, at('2026-01-05T10:05:00'))
    expect(item.type === 'card' && item.card.id).toBe(cardId(first, 'recognize'))
  })

  it('shows learning cards early when nothing else is left', () => {
    const t0 = at('2026-01-05T10:00:00')
    let s = { ...defaultState(), settings: { ...defaultState().settings, newWordsPerDay: 1 } }
    s = introduceWord(s, first, t0)
    s = gradeCard(s, cardId(first, 'recognize'), Rating.Good, t0)
    s = gradeCard(s, cardId(first, 'produce'), Rating.Good, t0)
    const item = nextItem(s, DECK, at('2026-01-05T10:00:30'))
    expect(item.type).toBe('card')
  })

  it('respects the new-words-per-day limit, resetting at 4am', () => {
    const settings = { ...defaultState().settings, newWordsPerDay: 2 }
    let s = { ...defaultState(), settings }
    s = introduceWord(s, first, at('2026-01-05T23:00:00'))
    s = introduceWord(s, second, at('2026-01-06T01:00:00'))
    expect(newWordsLeftToday(s, DECK, at('2026-01-06T03:59:00'))).toBe(0)
    expect(newWordsLeftToday(s, DECK, at('2026-01-06T04:01:00'))).toBe(2)
  })

  it('a word becomes known once both cards graduate', () => {
    let t = at('2026-01-05T10:00:00')
    let s = introduceWord(defaultState(), first, t)
    expect(wordStatus(s, first)).toBe('learning')
    for (let i = 0; i < 3; i++) {
      for (const kind of ['recognize', 'produce'] as const) s = gradeCard(s, cardId(first, kind), Rating.Good, t)
      t = new Date(t.getTime() + 24 * 3600 * 1000)
    }
    expect(s.cards[cardId(first, 'recognize')].fsrs.state).toBe(State.Review)
    expect(wordStatus(s, first)).toBe('known')
    expect(computeStats(s, DECK, t).known).toBe(1)
  })
})

describe('helpers', () => {
  it('day starts at 4am local time', () => {
    expect(dayStart(at('2026-01-06T02:00:00')).getDate()).toBe(5)
    expect(dayStart(at('2026-01-06T05:00:00')).getDate()).toBe(6)
  })

  it('formats intervals', () => {
    const t = at('2026-01-05T10:00:00')
    const plus = (ms: number) => new Date(t.getTime() + ms)
    expect(formatInterval(t, plus(60_000))).toBe('1m')
    expect(formatInterval(t, plus(10 * 60_000))).toBe('10m')
    expect(formatInterval(t, plus(5 * 3600_000))).toBe('5h')
    expect(formatInterval(t, plus(3 * 86400_000))).toBe('3d')
    expect(formatInterval(t, plus(90 * 86400_000))).toBe('3mo')
  })

  it('backups round-trip, dates included', () => {
    const s = gradeCard(introduceWord(defaultState(), first, at('2026-01-05T10:00:00')), cardId(first, 'recognize'), Rating.Good, at('2026-01-05T10:00:10'))
    expect(importState(exportState(s))).toEqual(s)
    expect(() => importState('{"version":2}')).toThrow()
  })
})
