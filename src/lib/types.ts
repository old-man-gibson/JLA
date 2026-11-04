import type { Card, Grade, State } from 'ts-fsrs'

/** An FSRS card as stored in JSON (dates become ISO strings). */
export type StoredFsrsCard = Omit<Card, 'due' | 'last_review'> & {
  due: string
  last_review?: string
}

/**
 * Each word has two cards:
 * - recognize: see the Japanese, recall the reading and meaning.
 * - produce: see the meaning in a sentence, type the Japanese.
 */
export type CardKind = 'recognize' | 'produce'

export interface StudyCard {
  id: string
  wordId: string
  kind: CardKind
  fsrs: StoredFsrsCard
}

export interface ReviewLogEntry {
  cardId: string
  rating: Grade
  /** ISO time of the review. */
  at: string
  /** The card's state before this review. */
  before: State
}

export interface KanaStat {
  seen: number
  correct: number
  /** Correct answers in a row. */
  streak: number
  /** Response times in ms of the most recent correct answers. */
  times: number[]
  lastSeen: string
}

export type FuriganaMode = 'auto' | 'always' | 'never'

export interface Settings {
  newWordsPerDay: number
  /** auto: furigana on the question side until a card is mature (21+ days). */
  furigana: FuriganaMode
  autoplayAudio: boolean
}

export interface AppState {
  version: 1
  /** When anything last changed; the newer copy wins when syncing between devices. */
  updatedAt?: string
  settings: Settings
  /** Words the learner has started, with when they were introduced. */
  words: Record<string, { introducedAt: string }>
  cards: Record<string, StudyCard>
  log: ReviewLogEntry[]
  kana: Record<string, KanaStat>
}
