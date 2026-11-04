import { ADVENTURER_WORDS } from './adventurer'
import { STARTER_WORDS, type Word } from './deck'

export type DeckId = 'starter' | 'adventurer'

export interface DeckInfo {
  id: DeckId
  name: string
  ja: string
  description: string
  words: Word[]
}

export const DECKS: DeckInfo[] = [
  {
    id: 'starter',
    name: 'Starter',
    ja: '基本',
    description: 'Very common everyday words: people, time, places, basic verbs and adjectives.',
    words: STARTER_WORDS,
  },
  {
    id: 'adventurer',
    name: 'Adventurer',
    ja: '冒険',
    description: 'Fantasy and isekai vocabulary: heroes, monsters, magic, guilds and quests.',
    words: ADVENTURER_WORDS,
  },
]

export const BUILTIN_WORDS: Word[] = DECKS.flatMap((d) => d.words)

export const BUILTIN_BY_ID: Record<string, Word> = Object.fromEntries(BUILTIN_WORDS.map((w) => [w.id, w]))

export const DECK_OF_WORD: Record<string, DeckId> = Object.fromEntries(
  DECKS.flatMap((d) => d.words.map((w) => [w.id, d.id] as const)),
)
