import { describe, expect, it } from 'vitest'
import { applyKey } from './typing'

const type = (keys: string, mode: 'kana' | 'romaji' = 'kana') =>
  [...keys].reduce((v, k) => applyKey(v, k === '<' ? 'back' : k, mode), '')

describe('on-screen typing', () => {
  it('turns romaji into kana as you type, like an input method', () => {
    expect(type('gakusei')).toBe('がくせい')
    expect(type('ko-hi-')).toBe('こーひー')
    expect(type('hetta')).toBe('へった')
    expect(type('kya')).toBe('きゃ')
  })

  it('keeps a lone n until the next key decides it', () => {
    expect(type('n')).toBe('n')
    expect(type('nn')).toBe('ん')
    expect(type('nihon')).toBe('にほn')
    expect(type('kanji')).toBe('かんじ')
  })

  it('backspace removes the last kana, and typing continues from there', () => {
    expect(type('kaki<')).toBe('か')
    expect(type('kaki<ku')).toBe('かく')
    expect(type('k<')).toBe('')
  })

  it('leaves romaji alone in romaji mode', () => {
    expect(type('shi', 'romaji')).toBe('shi')
    expect(type('tsu<', 'romaji')).toBe('ts')
  })
})
