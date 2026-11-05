import { describe, expect, it } from 'vitest'
import { BUILTIN_BY_ID } from '../data/decks'
import { WORD_CLASSES } from '../data/wordClasses'
import { conjugate, explainForm, FORMS, type FormId } from './conjugate'

const c = (word: string, form: FormId) => {
  const w = BUILTIN_BY_ID[word]
  const r = conjugate(w.word, w.reading, WORD_CLASSES[word], form)
  return r ? `${r.word}/${r.reading}` : null
}

describe('conjugation', () => {
  it('godan verbs, by ending', () => {
    expect(c('書く', 'te')).toBe('書いて/かいて')
    expect(c('泳ぐ', 'te')).toBe('泳いで/およいで')
    expect(c('話す', 'te')).toBe('話して/はなして')
    expect(c('待つ', 'te')).toBe('待って/まって')
    expect(c('死ぬ', 'te')).toBe('死んで/しんで')
    expect(c('遊ぶ', 'ta')).toBe('遊んだ/あそんだ')
    expect(c('読む', 'ta')).toBe('読んだ/よんだ')
    expect(c('買う', 'nai')).toBe('買わない/かわない')
    expect(c('飲む', 'masu')).toBe('飲みます/のみます')
    expect(c('分かる', 'masen')).toBe('分かりません/わかりません')
    expect(c('言う', 'tai')).toBe('言いたい/いいたい')
  })

  it('godan verbs that look like ichidan', () => {
    expect(c('帰る', 'te')).toBe('帰って/かえって')
    expect(c('走る', 'nai')).toBe('走らない/はしらない')
  })

  it('ichidan verbs drop る', () => {
    expect(c('食べる', 'te')).toBe('食べて/たべて')
    expect(c('見る', 'nakatta')).toBe('見なかった/みなかった')
    expect(c('起きる', 'mashita')).toBe('起きました/おきました')
  })

  it('irregular verbs', () => {
    expect(c('する', 'te')).toBe('して/して')
    expect(c('する', 'nai')).toBe('しない/しない')
    expect(c('来る', 'nai')).toBe('来ない/こない')
    expect(c('来る', 'te')).toBe('来て/きて')
    expect(c('行く', 'te')).toBe('行って/いって')
    expect(c('行く', 'ta')).toBe('行った/いった')
    expect(c('行く', 'masu')).toBe('行きます/いきます')
    expect(c('ある', 'nai')).toBe('ない/ない')
    expect(c('ある', 'masu')).toBe('あります/あります')
  })

  it('い-adjectives, and いい from よい', () => {
    expect(c('高い', 'adj-nai')).toBe('高くない/たかくない')
    expect(c('寒い', 'adj-katta')).toBe('寒かった/さむかった')
    expect(c('楽しい', 'adj-nakatta')).toBe('楽しくなかった/たのしくなかった')
    expect(c('安い', 'adj-te')).toBe('安くて/やすくて')
    expect(c('いい', 'adj-nai')).toBe('よくない/よくない')
    expect(c('いい', 'adj-katta')).toBe('よかった/よかった')
  })

  it('verb forms are refused for adjectives and the other way round', () => {
    expect(c('高い', 'te')).toBeNull()
    expect(c('書く', 'adj-nai')).toBeNull()
  })

  it('every listed word exists and has every form of its kind, with an explanation', () => {
    for (const [id, cls] of Object.entries(WORD_CLASSES)) {
      const w = BUILTIN_BY_ID[id]
      expect(w, id).toBeDefined()
      const kind = cls === 'i-adj' || cls === 'ii' ? 'adjective' : 'verb'
      for (const f of FORMS.filter((f) => f.for === kind)) {
        const r = conjugate(w.word, w.reading, cls, f.id)
        expect(r, `${id} ${f.id}`).not.toBeNull()
        expect(explainForm(w.reading, cls, f.id), `${id} ${f.id}`).not.toBe('')
      }
    }
  })
})
