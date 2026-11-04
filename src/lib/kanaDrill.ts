import type { KanaItem } from '../data/kana'
import type { KanaStat } from './types'

/** Answer within this time to count towards "fluent". Reading should be instant, not decoded. */
export const FLUENT_MS = 3000
export const FLUENT_STREAK = 3

export type KanaLevel = 'unseen' | 'learning' | 'fluent'

export function kanaLevel(stat: KanaStat | undefined): KanaLevel {
  if (!stat || stat.seen === 0) return 'unseen'
  const recent = stat.times.slice(-FLUENT_STREAK)
  const fast = recent.length === FLUENT_STREAK && recent.every((t) => t <= FLUENT_MS)
  return stat.streak >= FLUENT_STREAK && fast ? 'fluent' : 'learning'
}

function weight(stat: KanaStat | undefined): number {
  const level = kanaLevel(stat)
  if (!stat || level === 'unseen') return 4
  if (level === 'fluent') return 0.2
  const accuracy = stat.correct / stat.seen
  return 1 + 3 * (1 - accuracy) + (stat.streak === 0 ? 1.5 : 0)
}

/**
 * Picks a session's worth of kana without repeats, favouring ones that are
 * new, often missed or slow, and rarely picking ones that are already fluent.
 */
export function pickKanaSession(
  pool: KanaItem[],
  stats: Record<string, KanaStat>,
  size: number,
  random: () => number = Math.random,
): KanaItem[] {
  const candidates = pool.map((item) => ({ item, weight: weight(stats[item.kana]) }))
  const picked: KanaItem[] = []
  while (picked.length < size && candidates.length > 0) {
    const total = candidates.reduce((sum, c) => sum + c.weight, 0)
    let roll = random() * total
    let index = candidates.findIndex((c) => (roll -= c.weight) < 0)
    if (index === -1) index = candidates.length - 1
    picked.push(candidates[index].item)
    candidates.splice(index, 1)
  }
  return picked
}

export function recordKanaAnswer(
  stat: KanaStat | undefined,
  correct: boolean,
  ms: number,
  now: Date,
): KanaStat {
  const prev = stat ?? { seen: 0, correct: 0, streak: 0, times: [], lastSeen: now.toISOString() }
  return {
    seen: prev.seen + 1,
    correct: prev.correct + (correct ? 1 : 0),
    streak: correct ? prev.streak + 1 : 0,
    times: correct ? [...prev.times, Math.round(ms)].slice(-5) : prev.times,
    lastSeen: now.toISOString(),
  }
}
