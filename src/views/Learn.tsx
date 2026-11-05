import { useState } from 'react'
import type { AppState } from '../lib/types'
import { Grammar } from './Grammar'
import { Kana } from './Kana'
import { Stories } from './Stories'

type Update = (fn: (s: AppState) => AppState) => void

export type LearnSection = 'kana' | 'grammar' | 'stories'

const SECTIONS: { id: LearnSection; ja: string; label: string }[] = [
  { id: 'kana', ja: 'かな', label: 'Kana' },
  { id: 'grammar', ja: '文法', label: 'Grammar' },
  { id: 'stories', ja: '物語', label: 'Stories' },
]

interface Props {
  state: AppState
  update: Update
  section: LearnSection
  onSection: (section: LearnSection) => void
  onStartReview: () => void
}

export function Learn({ state, update, section, onSection, onStartReview }: Props) {
  const [drilling, setDrilling] = useState(false)
  return (
    <div className="page">
      {!drilling && (
        <>
          <h1>
            <span lang="ja">学ぶ</span> Learn
          </h1>
          <div className="segmented" role="tablist" aria-label="What to learn">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={section === s.id}
            className={`segment ${section === s.id ? 'on' : ''}`}
            onClick={() => onSection(s.id)}
          >
            <span lang="ja">{s.ja}</span> {s.label}
          </button>
        ))}
          </div>
        </>
      )}
      {section === 'kana' && <Kana state={state} update={update} onDrilling={setDrilling} />}
      {section === 'grammar' && <Grammar state={state} update={update} onStartReview={onStartReview} />}
      {section === 'stories' && <Stories state={state} update={update} />}
    </div>
  )
}
