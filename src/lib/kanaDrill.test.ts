import { describe, expect, it } from 'vitest'
import { kanaFor } from '../data/kana'
import { kanaLevel, pickKanaSession, recordKanaAnswer } from './kanaDrill'

const now = new Date('2026-01-05T10:00:00Z')

describe('kana drill', () => {
  it('needs three fast correct answers in a row to be fluent', () => {
    let stat = recordKanaAnswer(undefined, true, 1200, now)
    stat = recordKanaAnswer(stat, true, 1500, now)
    expect(kanaLevel(stat)).toBe('learning')
    stat = recordKanaAnswer(stat, true, 900, now)
    expect(kanaLevel(stat)).toBe('fluent')
    stat = recordKanaAnswer(stat, false, 900, now)
    expect(kanaLevel(stat)).toBe('learning')
  })

  it('slow answers do not count as fluent', () => {
    let stat = undefined
    for (const ms of [1000, 1000, 4500]) stat = recordKanaAnswer(stat, true, ms, now)
    expect(kanaLevel(stat)).toBe('learning')
  })

  it('picks a session without repeats', () => {
    const pool = kanaFor(['hiragana'], ['basic'])
    const session = pickKanaSession(pool, {}, 20)
    expect(session).toHaveLength(20)
    expect(new Set(session).size).toBe(20)
    expect(pickKanaSession(pool.slice(0, 5), {}, 20)).toHaveLength(5)
  })

  it('rarely picks fluent kana', () => {
    const pool = kanaFor(['hiragana'], ['basic'])
    const fluent = { seen: 3, correct: 3, streak: 3, times: [800, 800, 800], lastSeen: now.toISOString() }
    const stats = Object.fromEntries(pool.slice(0, 40).map((k) => [k.kana, fluent]))
    let unfluentPicked = 0
    for (let i = 0; i < 50; i++) {
      unfluentPicked += pickKanaSession(pool, stats, 6).filter((k) => !stats[k.kana]).length
    }
    // 6 of 46 kana are not fluent; with weighting they should dominate the picks.
    expect(unfluentPicked / (50 * 6)).toBeGreaterThan(0.6)
  })
})
