import { describe, expect, it } from 'vitest'
import { Rating, State } from 'ts-fsrs'
import { decodeLog, encodeLog, fromCloudDoc, toCloudDoc } from './cloud'
import { defaultState } from './store'
import type { ReviewLogEntry } from './types'

const entry = (i: number): ReviewLogEntry => ({
  cardId: `単語${i}:recognize`,
  rating: Rating.Good,
  at: new Date(Date.UTC(2026, 0, 1, 0, 0, i)).toISOString(),
  before: State.Review,
})

describe('cloud document', () => {
  it('round-trips the review log compactly', () => {
    const log = [entry(1), entry(2)]
    expect(decodeLog(encodeLog(log))).toEqual(log)
    expect(decodeLog('')).toEqual([])
  })

  it('round-trips the whole state', () => {
    const s = { ...defaultState(), updatedAt: '2026-01-01T00:00:00.000Z', log: [entry(1)] }
    expect(fromCloudDoc(JSON.parse(JSON.stringify(toCloudDoc(s))))).toEqual(s)
  })

  it('stays under the document size cap by dropping the oldest history', () => {
    const s = { ...defaultState(), log: Array.from({ length: 20000 }, (_, i) => entry(i)) }
    const doc = toCloudDoc(s)
    expect(new TextEncoder().encode(JSON.stringify(doc)).length).toBeLessThan(256 * 1024)
    const kept = decodeLog(doc.log as string)
    expect(kept.at(-1)).toEqual(s.log.at(-1))
  })
})
