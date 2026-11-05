import { createEmptyCard, fsrs, Rating, State, type Card, type Grade } from 'ts-fsrs'
import type { Word } from '../data/deck'
import { EXERCISE_BY_ID, GRAMMAR_BY_ID } from '../data/grammar'
import type { AppState, CardKind, StoredFsrsCard, StudyCard } from './types'

/** FSRS with the default 90% target retention and learning steps of 1m, 10m. */
export const scheduler = fsrs({ enable_fuzz: true, enable_short_term: true })

/** Days between reviews after which a card counts as "mature". */
export const MATURE_DAYS = 21

/** Cards in learning that are due this soon are shown early instead of making you wait. */
export const LEARN_AHEAD_MS = 20 * 60 * 1000

const LOG_LIMIT = 20000

export const CARD_KINDS: CardKind[] = ['recognize', 'produce']

export function cardId(wordId: string, kind: CardKind): string {
  return `${wordId}:${kind}`
}

export function toCard(stored: StoredFsrsCard): Card {
  return {
    ...stored,
    due: new Date(stored.due),
    last_review: stored.last_review ? new Date(stored.last_review) : undefined,
  }
}

export function fromCard(card: Card): StoredFsrsCard {
  const { due, last_review, ...rest } = card
  return {
    ...rest,
    due: due.toISOString(),
    ...(last_review ? { last_review: last_review.toISOString() } : {}),
  }
}

export function isMature(card: StudyCard): boolean {
  return card.fsrs.state === State.Review && card.fsrs.scheduled_days >= MATURE_DAYS
}

/** A study day starts at 4am local time, so a late-night session counts for the day before. */
export function dayStart(now: Date): Date {
  const start = new Date(now)
  start.setHours(4, 0, 0, 0)
  if (now < start) start.setDate(start.getDate() - 1)
  return start
}

export function wordsIntroducedToday(state: AppState, now: Date): number {
  const start = dayStart(now).getTime()
  return Object.values(state.words).filter((w) => new Date(w.introducedAt).getTime() >= start).length
}

export function newWordsLeftToday(state: AppState, deck: Word[], now: Date): number {
  const remaining = deck.filter((w) => !state.words[w.id]).length
  const allowance = Math.max(0, state.settings.newWordsPerDay - wordsIntroducedToday(state, now))
  return Math.min(remaining, allowance)
}

/**
 * Cards to study: those of words still in the study list (a word may leave the
 * deck in an update) plus grammar exercises that still exist.
 */
export function cardsInDeck(state: AppState, deck: Word[]): StudyCard[] {
  const ids = new Set(deck.map((w) => w.id))
  return Object.values(state.cards).filter((c) =>
    c.kind === 'grammar' ? Boolean(EXERCISE_BY_ID[c.wordId]) : ids.has(c.wordId),
  )
}

/** Adds a card for each of a grammar point's exercises. They're due straight away. */
export function startGrammarPoint(state: AppState, pointId: string, now: Date): AppState {
  const point = GRAMMAR_BY_ID[pointId]
  if (!point) return state
  const cards = { ...state.cards }
  for (const exercise of point.exercises) {
    if (!cards[exercise.id]) {
      cards[exercise.id] = { id: exercise.id, wordId: exercise.id, kind: 'grammar', fsrs: fromCard(createEmptyCard(now)) }
    }
  }
  return {
    ...state,
    cards,
    grammar: { ...state.grammar, [pointId]: state.grammar[pointId] ?? { startedAt: now.toISOString() } },
  }
}

export type GrammarStatus = 'unseen' | 'learning' | 'known'

export function grammarStatus(state: AppState, pointId: string): GrammarStatus {
  const point = GRAMMAR_BY_ID[pointId]
  if (!point || !state.grammar[pointId]) return 'unseen'
  const cards = point.exercises.map((e) => state.cards[e.id]).filter(Boolean)
  return cards.length > 0 && cards.every((c) => c.fsrs.state === State.Review) ? 'known' : 'learning'
}

export type NextItem =
  | { type: 'card'; card: StudyCard }
  | { type: 'new'; word: Word }
  | { type: 'done'; nextDue?: Date }

const STATE_PRIORITY: Record<State, number> = {
  [State.Learning]: 0,
  [State.Relearning]: 0,
  [State.Review]: 1,
  [State.New]: 2,
}

function byPriority(a: StudyCard, b: StudyCard): number {
  return (
    STATE_PRIORITY[a.fsrs.state] - STATE_PRIORITY[b.fsrs.state] ||
    a.fsrs.due.localeCompare(b.fsrs.due)
  )
}

/**
 * Picks what to study next: cards in learning first, then reviews, then the
 * cards of words just introduced, then a new word. If nothing is due, a
 * learning card due within the next 20 minutes is shown early.
 */
export function nextItem(state: AppState, deck: Word[], now: Date): NextItem {
  const cards = cardsInDeck(state, deck)
  const nowIso = now.toISOString()
  const due = cards.filter((c) => c.fsrs.due <= nowIso).sort(byPriority)
  if (due.length > 0) return { type: 'card', card: due[0] }

  if (newWordsLeftToday(state, deck, now) > 0) {
    const word = deck.find((w) => !state.words[w.id])
    if (word) return { type: 'new', word }
  }

  const aheadLimit = new Date(now.getTime() + LEARN_AHEAD_MS).toISOString()
  const learningSoon = cards
    .filter((c) => c.fsrs.state === State.Learning || c.fsrs.state === State.Relearning)
    .filter((c) => c.fsrs.due <= aheadLimit)
    .sort(byPriority)
  if (learningSoon.length > 0) return { type: 'card', card: learningSoon[0] }

  const nextDue = cards.map((c) => c.fsrs.due).sort()[0]
  return { type: 'done', nextDue: nextDue ? new Date(nextDue) : undefined }
}

export function introduceWord(state: AppState, wordId: string, now: Date): AppState {
  if (state.words[wordId]) return state
  const cards = { ...state.cards }
  for (const kind of CARD_KINDS) {
    const id = cardId(wordId, kind)
    cards[id] = { id, wordId, kind, fsrs: fromCard(createEmptyCard(now)) }
  }
  return {
    ...state,
    words: { ...state.words, [wordId]: { introducedAt: now.toISOString() } },
    cards,
  }
}

export function gradeCard(state: AppState, id: string, rating: Grade, now: Date): AppState {
  const card = state.cards[id]
  if (!card) return state
  const { card: next } = scheduler.next(toCard(card.fsrs), now, rating)
  const entry = { cardId: id, rating, at: now.toISOString(), before: card.fsrs.state }
  return {
    ...state,
    cards: { ...state.cards, [id]: { ...card, fsrs: fromCard(next) } },
    log: [...state.log, entry].slice(-LOG_LIMIT),
  }
}

/** When each rating would schedule the card next, for the button labels. */
export function previewDue(card: StudyCard, now: Date): Record<Grade, Date> {
  const preview = scheduler.repeat(toCard(card.fsrs), now)
  return {
    [Rating.Again]: preview[Rating.Again].card.due,
    [Rating.Hard]: preview[Rating.Hard].card.due,
    [Rating.Good]: preview[Rating.Good].card.due,
    [Rating.Easy]: preview[Rating.Easy].card.due,
  }
}

export function formatInterval(from: Date, to: Date): string {
  const minutes = Math.max(1, Math.round((to.getTime() - from.getTime()) / 60000))
  if (minutes < 60) return `${minutes}m`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.round(hours / 24)
  if (days < 31) return `${days}d`
  const months = Math.round(days / 30.4)
  if (months < 12) return `${months}mo`
  return `${Math.round((days / 365) * 10) / 10}y`
}

export interface QueueCounts {
  learning: number
  review: number
  newCards: number
  /** New grammar exercises from points the learner started. */
  newGrammar: number
  /** Words still to be learned today: not yet introduced, or introduced with a card not yet seen. */
  newWords: number
}

export function queueCounts(state: AppState, deck: Word[], now: Date): QueueCounts {
  const nowIso = now.toISOString()
  const due = cardsInDeck(state, deck).filter((c) => c.fsrs.due <= nowIso)
  return {
    learning: due.filter((c) => c.fsrs.state === State.Learning || c.fsrs.state === State.Relearning).length,
    review: due.filter((c) => c.fsrs.state === State.Review).length,
    newCards: due.filter((c) => c.fsrs.state === State.New).length,
    newGrammar: due.filter((c) => c.kind === 'grammar' && c.fsrs.state === State.New).length,
    newWords:
      newWordsLeftToday(state, deck, now) +
      new Set(due.filter((c) => c.kind !== 'grammar' && c.fsrs.state === State.New).map((c) => c.wordId)).size,
  }
}

export type WordStatus = 'unseen' | 'learning' | 'known' | 'mature'

/** A word is "known" once both of its cards have graduated to review, "mature" once both are mature. */
export function wordStatus(state: AppState, wordId: string): WordStatus {
  if (!state.words[wordId]) return 'unseen'
  const cards = CARD_KINDS.map((k) => state.cards[cardId(wordId, k)]).filter(Boolean)
  if (cards.length > 0 && cards.every(isMature)) return 'mature'
  if (cards.length > 0 && cards.every((c) => c.fsrs.state === State.Review)) return 'known'
  return 'learning'
}

export interface Stats {
  started: number
  known: number
  mature: number
  total: number
  reviewsToday: number
  /** Share of reviews of graduated cards in the last 30 days that were not "Again". */
  retention?: number
  retentionSample: number
  dueTomorrow: number
}

export function computeStats(state: AppState, deck: Word[], now: Date): Stats {
  const statuses = deck.map((w) => wordStatus(state, w.id))
  const today = dayStart(now).getTime()
  const monthAgo = now.getTime() - 30 * 24 * 3600 * 1000
  const recentReviews = state.log.filter(
    (e) => e.before === State.Review && new Date(e.at).getTime() >= monthAgo,
  )
  const passed = recentReviews.filter((e) => e.rating !== Rating.Again).length
  const tomorrowEnd = new Date(dayStart(now).getTime() + 2 * 24 * 3600 * 1000).toISOString()
  return {
    started: statuses.filter((s) => s !== 'unseen').length,
    known: statuses.filter((s) => s === 'known' || s === 'mature').length,
    mature: statuses.filter((s) => s === 'mature').length,
    total: deck.length,
    reviewsToday: state.log.filter((e) => new Date(e.at).getTime() >= today).length,
    retention: recentReviews.length > 0 ? passed / recentReviews.length : undefined,
    retentionSample: recentReviews.length,
    dueTomorrow: cardsInDeck(state, deck).filter((c) => c.fsrs.due < tomorrowEnd).length,
  }
}
