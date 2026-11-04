import type { TypedKey } from '../lib/typing'

const ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm-']

interface Props {
  onKey: (key: TypedKey) => void
  enterLabel?: string
  /** Night palette for Night Watch. */
  dark?: boolean
}

/** A compact romaji keyboard laid out in the page, so the phone's keyboard never covers anything. */
export function Keypad({ onKey, enterLabel = 'Enter', dark = false }: Props) {
  return (
    <div className={`keypad ${dark ? 'dark' : ''}`} role="group" aria-label="Romaji keyboard">
      {ROWS.map((row) => (
        <div className="keypad-row" key={row}>
          {[...row].map((k) => (
            <button
              key={k}
              type="button"
              className="key"
              onClick={() => onKey(k)}
              aria-label={k === '-' ? 'Long vowel mark' : k}
            >
              {k === '-' ? 'ー' : k}
            </button>
          ))}
        </div>
      ))}
      <div className="keypad-row">
        <button type="button" className="key action" onClick={() => onKey('back')} aria-label="Delete">
          ⌫
        </button>
        <button type="button" className="key enter" onClick={() => onKey('enter')}>
          {enterLabel}
        </button>
      </div>
    </div>
  )
}
