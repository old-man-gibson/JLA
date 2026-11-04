import { describe, expect, it } from 'vitest'
import { kanaText, plainText, targetSegments } from '../lib/furigana'
import { DECK } from './deck'

describe('starter deck', () => {
  it('has unique ids', () => {
    expect(new Set(DECK.map((w) => w.id)).size).toBe(DECK.length)
  })

  it.each(DECK.map((w) => [w.word, w] as const))('%s: target in sentence matches word and reading', (_, w) => {
    const markers = w.sentence.match(/\[\[/g) ?? []
    expect(markers).toHaveLength(1)
    const target = targetSegments(w.sentence)
    expect(target.map((s) => s.text).join('')).toBe(w.word)
    expect(target.map((s) => s.ruby ?? s.text).join('')).toBe(w.reading)
  })

  it.each(DECK.map((w) => [w.word, w] as const))('%s: every kanji in the sentence has furigana', (_, w) => {
    const plain = plainText(w.sentence)
    const kana = kanaText(w.sentence)
    expect(plain).not.toMatch(/[{}|[\]]/)
    expect(kana).not.toMatch(/\p{Script=Han}/u)
  })
})
