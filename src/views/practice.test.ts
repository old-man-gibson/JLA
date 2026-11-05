import { describe, expect, it } from 'vitest'
import { BUILTIN_BY_ID, BUILTIN_WORDS } from '../data/decks'
import { buildKanjiRound } from './KanjiPractice'
import { buildListening } from './Listening'
import { isFormAnswerCorrect } from './Practice'

describe('forms practice answers', () => {
  const answer = { word: '書いて', reading: 'かいて' }
  it('accepts kana, leftover romaji and the written form', () => {
    expect(isFormAnswerCorrect(answer, 'かいて')).toBe(true)
    expect(isFormAnswerCorrect(answer, 'kaite')).toBe(true)
    expect(isFormAnswerCorrect(answer, '書いて')).toBe(true)
    expect(isFormAnswerCorrect(answer, 'かきて')).toBe(false)
    expect(isFormAnswerCorrect(answer, '')).toBe(false)
  })
})

describe('listening rounds', () => {
  it('gives each item its answer among four distinct options', () => {
    const learned = ['私', '水', '本', '犬', '猫', '高い'].map((id) => BUILTIN_BY_ID[id])
    const round = buildListening(learned, BUILTIN_WORDS)
    expect(round).toHaveLength(6)
    for (const item of round) {
      expect(item.options).toHaveLength(4)
      expect(new Set(item.options).size).toBe(4)
      expect(item.options).toContain(item.answer)
      expect(item.answer).toBe(item.mode === 'word' ? item.word.meaning : item.word.translation)
    }
  })
})

describe('kanji rounds', () => {
  it('alternate meaning and reading questions with four distinct options', () => {
    const words = ['学生', '先生', '日本', '電車', '会社', '食べる'].map((id) => BUILTIN_BY_ID[id])
    const kanji = ['学', '生', '先', '日', '本', '電', '車', '会', '社', '食']
    const round = buildKanjiRound(words, kanji)
    expect(round.length).toBeGreaterThanOrEqual(8)
    expect(round[0].mode).toBe('meaning')
    expect(round[1].mode).toBe('reading')
    for (const item of round) {
      expect(new Set(item.options).size).toBe(4)
      expect(item.options).toContain(item.answer)
      if (item.mode === 'meaning') expect(item.word.word).toContain(item.kanji)
    }
  })
})
