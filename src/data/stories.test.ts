import { describe, expect, it } from 'vitest'
import { kanaText, plainText } from '../lib/furigana'
import { STORIES } from './stories'

const lines = STORIES.flatMap((s) => [
  [`${s.id} title`, s.title] as const,
  ...s.lines.map((l, i) => [`${s.id} line ${i + 1}`, l.ja] as const),
])

describe('stories', () => {
  it('have unique ids and translations for every line', () => {
    expect(new Set(STORIES.map((s) => s.id)).size).toBe(STORIES.length)
    for (const s of STORIES) for (const l of s.lines) expect(l.en).not.toBe('')
  })

  it.each(lines)('%s: furigana on every kanji, no stray markup', (_, ja) => {
    expect(kanaText(ja)).not.toMatch(/\p{Script=Han}/u)
    expect(plainText(ja)).not.toMatch(/[{}|[\]]/)
  })
})
