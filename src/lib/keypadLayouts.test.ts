import { describe, expect, it } from 'vitest'
import { detectLayout, KEYPAD_LAYOUTS } from './keypadLayouts'

describe('on-screen key layouts', () => {
  it.each(Object.values(KEYPAD_LAYOUTS).map((l) => [l.id, l] as const))('%s rows fill the grid exactly', (_, layout) => {
    for (const row of layout.rows) expect(row.reduce((sum, c) => sum + c.span, 0)).toBe(layout.columns)
  })

  it.each(Object.values(KEYPAD_LAYOUTS).map((l) => [l.id, l] as const))('%s has every letter, ー, delete and enter once', (_, layout) => {
    const keys = layout.rows.flat().flatMap((c) => (c.key ? [c.key] : []))
    expect(keys.filter((k) => k.length === 1 && k !== '-').sort().join('')).toBe('abcdefghijklmnopqrstuvwxyz')
    for (const k of ['-', 'back', 'enter']) expect(keys.filter((x) => x === k)).toHaveLength(1)
  })

  it('puts y and z where each layout has them', () => {
    const row = (id: 'qwertz' | 'qwerty', r: number) => KEYPAD_LAYOUTS[id].rows[r].map((c) => c.key ?? '').join('')
    expect(row('qwertz', 0)).toBe('qwertzuiop')
    expect(row('qwertz', 2)).toBe('yxcvbnmback')
    expect(row('qwerty', 0)).toBe('qwertyuiop')
  })

  it('guesses the layout from device languages', () => {
    expect(detectLayout(['de-CH'])).toBe('qwertz')
    expect(detectLayout(['en-US', 'de-CH'])).toBe('qwertz')
    expect(detectLayout(['en-CH'])).toBe('qwertz')
    expect(detectLayout(['fr-CH'])).toBe('qwertz')
    expect(detectLayout(['fr-FR'])).toBe('azerty')
    expect(detectLayout(['fr-CA'])).toBe('qwerty')
    expect(detectLayout(['en-US'])).toBe('qwerty')
    expect(detectLayout([])).toBe('qwerty')
  })
})
