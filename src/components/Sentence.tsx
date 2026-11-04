import type { ReactNode } from 'react'
import { parseSentence, targetSegments } from '../lib/furigana'
import type { Word } from '../data/deck'

interface Props {
  source: string
  /** Show furigana over kanji outside the target word. */
  furigana: boolean
  /** highlight: emphasize the word; blank: hide it; plain: no special treatment. */
  target?: 'highlight' | 'blank' | 'plain'
  /** Show furigana on the target word itself (off when the reading is what's being tested). */
  targetFurigana?: boolean
  className?: string
}

export function Sentence({ source, furigana, target = 'highlight', targetFurigana = furigana, className }: Props) {
  const segments = parseSentence(source)
  const out: ReactNode[] = []
  let blanked = false
  segments.forEach((seg, i) => {
    if (seg.target && target === 'blank') {
      if (!blanked) out.push(<span key={i} className="blank" role="img" aria-label="blank" />)
      blanked = true
      return
    }
    const showRuby = seg.ruby && (seg.target ? targetFurigana : furigana)
    const content = showRuby ? (
      <ruby key={i}>
        {seg.text}
        <rt>{seg.ruby}</rt>
      </ruby>
    ) : (
      <span key={i}>{seg.text}</span>
    )
    out.push(seg.target && target === 'highlight' ? <mark key={i}>{content}</mark> : content)
  })
  return (
    <p lang="ja" className={`sentence ${className ?? ''}`}>
      {out}
    </p>
  )
}

/** The word with furigana over each kanji, taken from the target in its example sentence. */
export function WordRuby({ word, furigana }: { word: Word; furigana: boolean }) {
  const segments = targetSegments(word.sentence)
  if (segments.length === 0) return <span lang="ja">{word.word}</span>
  return (
    <span lang="ja">
      {segments.map((seg, i) =>
        seg.ruby && furigana ? (
          <ruby key={i}>
            {seg.text}
            <rt>{seg.ruby}</rt>
          </ruby>
        ) : (
          <span key={i}>{seg.text}</span>
        ),
      )}
    </span>
  )
}
