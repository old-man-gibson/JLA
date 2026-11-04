import { toKana, toKatakana } from 'wanakana'
import type { KanaItem } from '../data/kana'
import type { Word } from '../data/deck'

/** Lowercases and strips whitespace from a romaji answer. */
export function normalizeRomaji(input: string): string {
  return input.trim().toLowerCase().replace(/\s+/g, '')
}

export function isKanaAnswerCorrect(item: KanaItem, input: string): boolean {
  return item.romaji.includes(normalizeRomaji(input))
}

/**
 * Turns whatever the learner typed into kana. Romaji left over from the input
 * method (for example a trailing "n") is converted too.
 */
export function finalizeKanaInput(input: string): string {
  return toKana(input.trim().replace(/\s+/g, ''))
}

/**
 * Compares in katakana, because converting katakana to hiragana rewrites the
 * long-vowel mark (コーヒー becomes こうひい) while the reverse keeps it.
 * Hiragana and katakana spellings of the same reading both count as correct,
 * and so does typing the word itself with a Japanese keyboard (学生 for がくせい).
 */
export function isReadingCorrect(word: Word, input: string): boolean {
  const typed = finalizeKanaInput(input)
  if (typed === '') return false
  if (typed === word.word) return true
  return toKatakana(typed) === toKatakana(word.reading)
}
