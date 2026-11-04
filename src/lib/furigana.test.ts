import { describe, expect, it } from 'vitest'
import { kanaText, parseSentence, plainText } from './furigana'

describe('furigana parsing', () => {
  const s = '{私|わたし}は[[{学生|がくせい}]]です。'

  it('splits furigana and target markers', () => {
    expect(parseSentence(s)).toEqual([
      { text: '私', ruby: 'わたし', target: false },
      { text: 'は', target: false },
      { text: '学生', ruby: 'がくせい', target: true },
      { text: 'です。', target: false },
    ])
  })

  it('renders plain and kana text', () => {
    expect(plainText(s)).toBe('私は学生です。')
    expect(kanaText(s)).toBe('わたしはがくせいです。')
  })

  it('keeps okurigana inside the target', () => {
    const segs = parseSentence('パンを[[{食|た}べる]]。').filter((x) => x.target)
    expect(segs).toEqual([
      { text: '食', ruby: 'た', target: true },
      { text: 'べる', target: true },
    ])
  })
})
