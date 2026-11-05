import type { TypedKey } from './typing'

export type KeypadLayoutId = 'qwerty' | 'qwertz' | 'azerty'

/** One cell of the on-screen keyboard. `span` is in half-key units, so rows can be offset like a phone keyboard. */
export interface KeyCell {
  key?: TypedKey
  label?: string
  span: number
  kind?: 'letter' | 'action' | 'enter' | 'spacer'
}

export interface KeypadLayout {
  id: KeypadLayoutId
  name: string
  /** Grid columns (half-key units) per row. */
  columns: number
  rows: KeyCell[][]
}

const letters = (s: string): KeyCell[] => [...s].map((k) => ({ key: k, label: k, span: 2, kind: 'letter' }))
const gap = (span: number): KeyCell => ({ span, kind: 'spacer' })
const back: KeyCell = { key: 'back', label: '⌫', span: 3, kind: 'action' }
// The long-vowel key sits where phone keyboards keep their symbol keys; Enter covers the space bar and return key.
const bottom = (columns: number): KeyCell[] => [
  { key: '-', label: 'ー', span: 5, kind: 'action' },
  { key: 'enter', span: columns - 5, kind: 'enter' },
]

// Each layout mirrors the phone keyboards people type on every day, keeping
// the letters where muscle memory expects them. Keys that romaji never needs
// (shift, ü, ö, ä…) stay as gaps so the other letters don't shift.
export const KEYPAD_LAYOUTS: Record<KeypadLayoutId, KeypadLayout> = {
  // German and Swiss keyboards: 11 keys per row, with ü, ö and ä at the ends.
  qwertz: {
    id: 'qwertz',
    name: 'QWERTZ',
    columns: 22,
    rows: [
      [...letters('qwertzuiop'), gap(2)],
      [...letters('asdfghjkl'), gap(4)],
      [gap(4), ...letters('yxcvbnm'), { ...back, span: 4 }],
      bottom(22),
    ],
  },
  qwerty: {
    id: 'qwerty',
    name: 'QWERTY',
    columns: 20,
    rows: [
      letters('qwertyuiop'),
      [gap(1), ...letters('asdfghjkl'), gap(1)],
      [gap(3), ...letters('zxcvbnm'), back],
      bottom(20),
    ],
  },
  azerty: {
    id: 'azerty',
    name: 'AZERTY',
    columns: 20,
    rows: [
      letters('azertyuiop'),
      letters('qsdfghjklm'),
      [gap(3), ...letters('wxcvbn'), gap(2), back],
      bottom(20),
    ],
  },
}

const QWERTZ_LANGUAGES = ['de', 'cs', 'sk', 'hu', 'sl', 'hr', 'sr', 'bs', 'lb', 'rm', 'gsw']
const QWERTZ_REGIONS = ['ch', 'at', 'de', 'li', 'lu']

/** Guesses the phone keyboard from the device languages (a page can't read the keyboard itself). */
export function detectLayout(languages: readonly string[]): KeypadLayoutId {
  for (const tag of languages) {
    const [lang, ...rest] = tag.toLowerCase().split('-')
    const region = rest.find((part) => part.length === 2)
    if (QWERTZ_LANGUAGES.includes(lang) || (region && QWERTZ_REGIONS.includes(region))) return 'qwertz'
    if ((lang === 'fr' && region !== 'ca') || region === 'be') return 'azerty'
  }
  return 'qwerty'
}

export function resolveLayout(setting: 'auto' | KeypadLayoutId): KeypadLayout {
  if (setting !== 'auto') return KEYPAD_LAYOUTS[setting]
  let languages: readonly string[] = []
  try {
    languages = navigator.languages?.length ? navigator.languages : [navigator.language]
  } catch {
    // Fall through to QWERTY.
  }
  return KEYPAD_LAYOUTS[detectLayout(languages)]
}
