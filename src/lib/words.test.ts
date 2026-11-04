import { describe, expect, it } from 'vitest'
import { ADVENTURER_WORDS } from '../data/adventurer'
import { STARTER_WORDS } from '../data/deck'
import { cardId, introduceWord } from './srs'
import { defaultState } from './store'
import { addCustomWord, customWordId, findWord, removeCustomWord, studyWords } from './words'

const now = new Date('2026-01-05T10:00:00Z')
const manga = {
  word: '食べた',
  reading: 'たべた',
  meaning: 'ate',
  sentence: 'もう[[{食|た}べた]]よ。',
  translation: 'I already ate.',
  lemma: '食べる',
  lemmaReading: 'たべる',
  source: 'Yotsuba&!',
}

describe('study word order', () => {
  it('alternates between enabled decks', () => {
    const words = studyWords(defaultState()).slice(0, 4)
    expect(words.map((w) => w.id)).toEqual([STARTER_WORDS[0].id, ADVENTURER_WORDS[0].id, STARTER_WORDS[1].id, ADVENTURER_WORDS[1].id])
  })

  it('puts manga words first', () => {
    const s = addCustomWord(defaultState(), manga, now)
    expect(studyWords(s)[0].id).toBe(customWordId('食べた'))
    expect(findWord(s, customWordId('食べた'))?.lemma).toBe('食べる')
  })

  it('keeps started words from a deck that was switched off', () => {
    let s = introduceWord(defaultState(), ADVENTURER_WORDS[0].id, now)
    s = { ...s, settings: { ...s.settings, decks: ['starter'] } }
    const ids = studyWords(s).map((w) => w.id)
    expect(ids).toContain(ADVENTURER_WORDS[0].id)
    expect(ids).not.toContain(ADVENTURER_WORDS[1].id)
  })

  it('removing a manga word removes its cards', () => {
    let s = addCustomWord(defaultState(), manga, now)
    const id = customWordId('食べた')
    s = introduceWord(s, id, now)
    expect(s.cards[cardId(id, 'produce')]).toBeDefined()
    s = removeCustomWord(s, id)
    expect(s.customWords[id]).toBeUndefined()
    expect(s.cards[cardId(id, 'produce')]).toBeUndefined()
    expect(s.words[id]).toBeUndefined()
  })
})
