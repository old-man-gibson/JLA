import { speak, speechSupported } from '../lib/speech'

export function AudioButton({ texts, label = 'Play audio' }: { texts: string[]; label?: string }) {
  if (!speechSupported()) return null
  return (
    <button type="button" className="icon-button" onClick={() => speak(...texts)} aria-label={label} title={label}>
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
        <path
          fill="currentColor"
          d="M4 9v6h4l5 4V5L8 9H4zm12.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4zM14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6z"
        />
      </svg>
    </button>
  )
}
