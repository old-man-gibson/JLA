import type { KeypadLayout } from '../lib/keypadLayouts'
import type { TypedKey } from '../lib/typing'

interface Props {
  layout: KeypadLayout
  onKey: (key: TypedKey) => void
  enterLabel?: string
  /** Night palette for Night Watch. */
  dark?: boolean
}

/** A romaji keyboard laid out in the page, so the phone's keyboard never covers anything. */
export function Keypad({ layout, onKey, enterLabel = 'Enter', dark = false }: Props) {
  return (
    <div
      className={`keypad ${dark ? 'dark' : ''}`}
      role="group"
      aria-label={`Romaji keyboard, ${layout.name}`}
      style={{ gridTemplateColumns: `repeat(${layout.columns}, minmax(0, 1fr))` }}
    >
      {layout.rows.flatMap((row, r) =>
        row.map((cell, c) =>
          cell.kind === 'spacer' || !cell.key ? (
            <span key={`${r}-${c}`} className="key-gap" style={{ gridColumn: `span ${cell.span}` }} />
          ) : (
            <button
              key={`${r}-${c}`}
              type="button"
              className={`key ${cell.kind ?? 'letter'}`}
              style={{ gridColumn: `span ${cell.span}` }}
              onClick={() => onKey(cell.key!)}
              aria-label={cell.key === 'back' ? 'Delete' : cell.key === '-' ? 'Long vowel mark' : undefined}
            >
              {cell.kind === 'enter' ? enterLabel : cell.label}
            </button>
          ),
        ),
      )}
    </div>
  )
}
