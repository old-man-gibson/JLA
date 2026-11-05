import type { AppState } from '../lib/types'

type Update = (fn: (s: AppState) => AppState) => void

export function Stories(_props: { state: AppState; update: Update }) {
  return <p className="lead">Stories are on their way.</p>
}
