import { describe, expect, it } from 'vitest'
import { BUILTIN_WORDS } from './decks'
import { KANJI } from './kanji'

describe('kanji data', () => {
  it('covers every kanji in the deck words', () => {
    const missing = new Set<string>()
    for (const w of BUILTIN_WORDS) for (const ch of w.word) if (/\p{Script=Han}/u.test(ch) && !KANJI[ch]) missing.add(ch)
    expect([...missing]).toEqual([])
  })

  it('has a meaning and at least one reading for each kanji, in the right script', () => {
    for (const k of Object.values(KANJI)) {
      expect(k.meaning, k.kanji).not.toBe('')
      expect(k.on.length + k.kun.length, k.kanji).toBeGreaterThan(0)
      for (const r of k.on) expect(r, k.kanji).toMatch(/^[゠-ヿ]+$/)
      for (const r of k.kun) expect(r, k.kanji).toMatch(/^[぀-ゟ()]+$/)
    }
  })
})
