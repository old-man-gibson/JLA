import { describe, expect, it } from 'vitest'
import { kanaText, plainText, targetSegments } from '../lib/furigana'
import { BUILTIN_WORDS, DECKS } from './decks'

describe('built-in decks', () => {
  it('have globally unique ids', () => {
    expect(new Set(BUILTIN_WORDS.map((w) => w.id)).size).toBe(BUILTIN_WORDS.length)
  })

  it.each(DECKS.map((d) => [d.id, d] as const))('%s deck is not empty', (_, d) => {
    expect(d.words.length).toBeGreaterThan(20)
  })

  it.each(BUILTIN_WORDS.map((w) => [w.word, w] as const))('%s: target in sentence matches word and reading', (_, w) => {
    const markers = w.sentence.match(/\[\[/g) ?? []
    expect(markers).toHaveLength(1)
    const target = targetSegments(w.sentence)
    expect(target.map((s) => s.text).join('')).toBe(w.word)
    expect(target.map((s) => s.ruby ?? s.text).join('')).toBe(w.reading)
  })

  it.each(BUILTIN_WORDS.map((w) => [w.word, w] as const))('%s: every kanji in the sentence has furigana', (_, w) => {
    const plain = plainText(w.sentence)
    const kana = kanaText(w.sentence)
    expect(plain).not.toMatch(/[{}|[\]]/)
    expect(kana).not.toMatch(/\p{Script=Han}/u)
  })
})
