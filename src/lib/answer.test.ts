import { describe, expect, it } from 'vitest'
import { KANA } from '../data/kana'
import { WORDS_BY_ID } from '../data/deck'
import { isKanaAnswerCorrect, isReadingCorrect } from './answer'

const kana = (k: string) => KANA.find((x) => x.kana === k)!

describe('kana answers', () => {
  it('accepts Hepburn and common alternatives', () => {
    expect(isKanaAnswerCorrect(kana('し'), 'shi')).toBe(true)
    expect(isKanaAnswerCorrect(kana('し'), ' SI ')).toBe(true)
    expect(isKanaAnswerCorrect(kana('ツ'), 'tsu')).toBe(true)
    expect(isKanaAnswerCorrect(kana('ん'), 'n')).toBe(true)
    expect(isKanaAnswerCorrect(kana('を'), 'o')).toBe(true)
    expect(isKanaAnswerCorrect(kana('ジョ'), 'jo')).toBe(true)
  })

  it('rejects wrong answers', () => {
    expect(isKanaAnswerCorrect(kana('し'), 'chi')).toBe(false)
    expect(isKanaAnswerCorrect(kana('ぬ'), 'me')).toBe(false)
    expect(isKanaAnswerCorrect(kana('き'), '')).toBe(false)
  })

  it('has 104 kana per script with no duplicates', () => {
    for (const script of ['hiragana', 'katakana']) {
      const items = KANA.filter((k) => k.script === script)
      expect(items).toHaveLength(104)
      expect(new Set(items.map((k) => k.kana)).size).toBe(104)
    }
  })
})

describe('typed readings', () => {
  const gakusei = WORDS_BY_ID['学生']
  const coffee = WORDS_BY_ID['コーヒー']

  it('accepts kana, leftover romaji, and the written word', () => {
    expect(isReadingCorrect(gakusei, 'がくせい')).toBe(true)
    expect(isReadingCorrect(gakusei, 'gakusei')).toBe(true)
    expect(isReadingCorrect(gakusei, 'ガクセイ')).toBe(true)
    expect(isReadingCorrect(gakusei, '学生')).toBe(true)
  })

  it('handles the long-vowel mark in katakana words', () => {
    expect(isReadingCorrect(coffee, 'こーひー')).toBe(true)
    expect(isReadingCorrect(coffee, 'ko-hi-')).toBe(true)
    expect(isReadingCorrect(coffee, 'コーヒー')).toBe(true)
  })

  it('finishes a trailing n', () => {
    expect(isReadingCorrect(WORDS_BY_ID['日本'], 'にほn')).toBe(true)
  })

  it('rejects wrong or empty answers', () => {
    expect(isReadingCorrect(gakusei, 'がくせ')).toBe(false)
    expect(isReadingCorrect(gakusei, '')).toBe(false)
  })
})
