import { describe, expect, it } from 'vitest'
import { kanaText, parseSentence, plainText } from '../lib/furigana'
import { EXERCISE_BY_ID, GRAMMAR } from './grammar'

/** The markup between [[ and ]], exactly as written. */
function targetMarkup(sentence: string): string {
  return /\[\[(.+?)\]\]/.exec(sentence)?.[1] ?? ''
}

const exercises = GRAMMAR.flatMap((g) => g.exercises.map((e) => [e.id, e] as const))
const allSentences = GRAMMAR.flatMap((g) => [
  ...g.examples.map((e) => [`${g.id} example`, e.sentence] as const),
  ...g.exercises.map((e) => [e.id, e.sentence] as const),
])

describe('grammar content', () => {
  it('has unique point and exercise ids', () => {
    expect(new Set(GRAMMAR.map((g) => g.id)).size).toBe(GRAMMAR.length)
    expect(Object.keys(EXERCISE_BY_ID)).toHaveLength(exercises.length)
  })

  it.each(GRAMMAR.map((g) => [g.id, g] as const))('%s has an explanation, examples and exercises', (_, g) => {
    expect(g.explanation.length).toBeGreaterThan(0)
    expect(g.examples.length).toBeGreaterThan(0)
    expect(g.exercises.length).toBeGreaterThanOrEqual(4)
  })

  it.each(exercises)('%s: one gap, whose answer is exactly one of the options', (_, e) => {
    expect(e.sentence.match(/\[\[/g)).toHaveLength(1)
    const answer = targetMarkup(e.sentence)
    expect(e.options.filter((o) => o === answer)).toHaveLength(1)
    expect(new Set(e.options.map(plainText)).size).toBe(e.options.length)
    expect(e.translation).not.toBe('')
    expect(e.why).not.toBe('')
  })

  it.each(allSentences)('%s: every kanji has furigana', (_, sentence) => {
    expect(plainText(sentence)).not.toMatch(/[{}|[\]]/)
    expect(kanaText(sentence)).not.toMatch(/\p{Script=Han}/u)
    expect(parseSentence(sentence).length).toBeGreaterThan(0)
  })

  it.each(exercises)('%s: options have furigana too', (_, e) => {
    for (const o of e.options) expect(kanaText(o)).not.toMatch(/\p{Script=Han}/u)
  })
})
