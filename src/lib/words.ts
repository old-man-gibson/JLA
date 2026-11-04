import type { Word } from '../data/deck'
import { BUILTIN_BY_ID, DECKS } from '../data/decks'
import { CARD_KINDS, cardId } from './srs'
import type { AppState, CustomWord } from './types'

/**
 * Every word the learner studies, in the order new ones are introduced:
 * words they added from manga first, then the enabled decks taken in turn
 * (one from each), then started words from decks they have since switched off.
 */
export function studyWords(state: AppState): Word[] {
  const custom = Object.values(state.customWords).sort((a, b) => a.addedAt.localeCompare(b.addedAt))
  const enabled = DECKS.filter((d) => state.settings.decks.includes(d.id))
  const interleaved: Word[] = []
  const longest = Math.max(0, ...enabled.map((d) => d.words.length))
  for (let i = 0; i < longest; i++) {
    for (const deck of enabled) if (deck.words[i]) interleaved.push(deck.words[i])
  }
  const startedElsewhere = DECKS.filter((d) => !state.settings.decks.includes(d.id)).flatMap((d) =>
    d.words.filter((w) => state.words[w.id]),
  )
  return [...custom, ...interleaved, ...startedElsewhere]
}

export function findWord(state: AppState, id: string): Word | undefined {
  return state.customWords[id] ?? BUILTIN_BY_ID[id]
}

export function customWordId(surface: string): string {
  return `manga:${surface}`
}

export function addCustomWord(state: AppState, word: Omit<CustomWord, 'id' | 'addedAt'>, now: Date): AppState {
  const id = customWordId(word.word)
  if (state.customWords[id]) return state
  return {
    ...state,
    customWords: { ...state.customWords, [id]: { ...word, id, addedAt: now.toISOString() } },
  }
}

export function removeCustomWord(state: AppState, id: string): AppState {
  if (!state.customWords[id]) return state
  const { [id]: _removed, ...customWords } = state.customWords
  const { [id]: _started, ...words } = state.words
  const cards = { ...state.cards }
  for (const kind of CARD_KINDS) delete cards[cardId(id, kind)]
  return { ...state, customWords, words, cards }
}
