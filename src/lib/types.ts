import type { Card, Grade, State } from 'ts-fsrs'
import type { Word } from '../data/deck'
import type { DeckId } from '../data/decks'

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
/** Words have recognize and produce cards; grammar exercises have one grammar card each. */
export type CardKind = 'recognize' | 'produce' | 'grammar'

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
  /** Built-in decks new words are drawn from. Words already started keep being reviewed either way. */
  decks: DeckId[]
  /** auto: on-screen romaji keys on touch screens, the device keyboard elsewhere. */
  keyboard: 'auto' | 'onscreen' | 'system'
  /** Letter layout of the on-screen keys; auto guesses from the device language. */
  keypadLayout: 'auto' | 'qwerty' | 'qwertz' | 'azerty'
}

/** A word the learner added from the manga reader. */
export interface CustomWord extends Word {
  addedAt: string
}

export interface GuildState {
  /** Gold collected and ready to spend. */
  gold: number
  /** Gold accrues from this moment until the next collection. */
  lastCollect: string
  buildings: Record<string, number>
  /** Permanent upgrades for Night Watch runs. */
  perks: Record<string, number>
}

export interface RunRecord {
  at: string
  score: number
  wave: number
  kills: number
}

export interface RunStats {
  best: number
  bestWave: number
  history: RunRecord[]
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
  customWords: Record<string, CustomWord>
  guild: GuildState
  runs: RunStats
  /** Grammar points the learner has started practising. */
  grammar: Record<string, { startedAt: string }>
  /** Built-in stories the learner has finished, with when. */
  storiesRead: Record<string, string>
  /** Answers per conjugation form in forms practice. */
  formStats: Record<string, { seen: number; correct: number }>
}
