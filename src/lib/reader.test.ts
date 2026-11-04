import { describe, expect, it } from 'vitest'
import { kanaText, plainText, targetSegments } from './furigana'
import { lineToSentence, splitFurigana, validateReading, wordFromLine } from './reader'

const reply = {
  lines: [
    {
      kind: 'dialogue',
      speaker: 'Yotsuba',
      tokens: [
        { t: '俺', r: 'おれ', w: 0 },
        { t: 'は' },
        { t: 'お金', r: 'おかね', w: 1 },
        { t: 'が' },
        { t: '欲しい', r: 'ほしい', w: 2 },
        { t: '！' },
      ],
      translation: 'I want money!',
      grammar: ['が欲しい: want something'],
    },
    { kind: 'weird', tokens: [{ t: 'ドキドキ', w: 3 }], translation: 'thump thump' },
    { tokens: [] },
  ],
  words: [
    { surface: '俺', reading: 'おれ', meaning: 'I, me (casual, masculine)', pos: 'pronoun' },
    { surface: 'お金', reading: 'おかね', meaning: 'money' },
    { surface: '欲しい', reading: 'ほしい', lemma: '欲しい', meaning: 'wanted' },
    { surface: 'ドキドキ', reading: 'ドキドキ', meaning: 'heart pounding' },
  ],
}

describe('reader', () => {
  it('splits furigana so it sits only over kanji', () => {
    expect(splitFurigana('食べた', 'たべた')).toEqual([{ text: '食', ruby: 'た' }, { text: 'べた' }])
    expect(splitFurigana('お金', 'おかね')).toEqual([{ text: 'お' }, { text: '金', ruby: 'かね' }])
    expect(splitFurigana('学生', 'がくせい')).toEqual([{ text: '学生', ruby: 'がくせい' }])
    expect(splitFurigana('ドキドキ')).toEqual([{ text: 'ドキドキ' }])
  })

  it('validates and tidies a reply, dropping empty lines', () => {
    const r = validateReading(reply)
    expect(r.lines).toHaveLength(2)
    expect(r.lines[1].kind).toBe('dialogue')
    expect(r.lines[0].grammar).toEqual(['が欲しい: want something'])
    expect(validateReading('nonsense')).toEqual({ lines: [], words: [] })
  })

  it('turns a manga line into sentence markup with the chosen word marked', () => {
    const r = validateReading(reply)
    const sentence = lineToSentence(r.lines[0], 1)
    expect(sentence).toBe('{俺|おれ}は[[お{金|かね}]]が{欲|ほ}しい！')
    expect(plainText(sentence)).toBe('俺はお金が欲しい！')
    expect(kanaText(sentence)).toBe('おれはおかねがほしい！')
  })

  it('builds a study word whose target matches its reading', () => {
    const r = validateReading(reply)
    const w = wordFromLine(r, r.lines[0], 2, 'Yotsuba&!')!
    expect(w.word).toBe('欲しい')
    expect(w.reading).toBe('ほしい')
    expect(w.source).toBe('Yotsuba&!')
    const target = targetSegments(w.sentence)
    expect(target.map((s) => s.text).join('')).toBe(w.word)
    expect(target.map((s) => s.ruby ?? s.text).join('')).toBe(w.reading)
    const sfx = wordFromLine(r, r.lines[1], 3, '')!
    expect(sfx.reading).toBe('ドキドキ')
    expect(sfx.source).toBe('manga')
  })

  it('escapes characters that would break the markup', () => {
    const r = validateReading({ lines: [{ tokens: [{ t: '[', w: 0 }, { t: '本', r: 'ほん' }] }], words: [{ surface: '[', meaning: 'x' }] })
    expect(lineToSentence(r.lines[0])).toBe('［{本|ほん}')
  })
})
