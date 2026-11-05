import { describe, expect, it } from 'vitest'
import { Rating } from 'ts-fsrs'
import { STARTER_WORDS } from '../data/deck'
import { cardId, gradeCard, introduceWord } from './srs'
import { defaultState } from './store'
import { decodeTransfer, encodeTransfer } from './transfer'

describe('progress codes', () => {
  it('round-trip the progress, compressed', async () => {
    const now = new Date('2026-01-05T10:00:00Z')
    let s = defaultState()
    for (const w of STARTER_WORDS.slice(0, 20)) {
      s = introduceWord(s, w.id, now)
      s = gradeCard(s, cardId(w.id, 'recognize'), Rating.Good, now)
    }
    s = { ...s, updatedAt: now.toISOString() }
    const code = await encodeTransfer(s)
    expect(code.startsWith('JLA1.')).toBe(true)
    expect(code.length).toBeLessThan(JSON.stringify(s).length)
    expect(await decodeTransfer(`  ${code.slice(0, 20)}\n${code.slice(20)} `)).toEqual(s)
  })

  it('rejects text that is not a code', async () => {
    await expect(decodeTransfer('hello')).rejects.toThrow(/progress code/)
  })
})
