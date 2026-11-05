import { State } from 'ts-fsrs'
import type { Word } from '../data/deck'
import { cardsInDeck, MATURE_DAYS } from './srs'
import type { AppState, StudyCard } from './types'

// The idle layer. Every card you have learned is an adventurer working for
// your guild. Its income grows with how well you know it (FSRS stability),
// and it stops while the card is overdue, so collecting more gold means doing
// your reviews on time. Nothing here can be bought with grinding: stability
// only grows through successful reviews spread over days.

/** Uncollected gold stops piling up after this long, so checking in daily pays. */
export const MAX_IDLE_HOURS = 24

export interface Rank {
  id: string
  /** Mature cards needed. */
  min: number
  bonus: number
}

/** Isekai adventurer ranks, F to S, earned with mature cards (interval 21+ days). */
export const RANKS: Rank[] = [
  { id: 'F', min: 0, bonus: 0 },
  { id: 'E', min: 10, bonus: 0.15 },
  { id: 'D', min: 30, bonus: 0.3 },
  { id: 'C', min: 60, bonus: 0.5 },
  { id: 'B', min: 120, bonus: 0.75 },
  { id: 'A', min: 240, bonus: 1.0 },
  { id: 'S', min: 500, bonus: 1.5 },
]

export type BuildingId = 'tavern' | 'library' | 'smithy'

export interface Building {
  id: BuildingId
  name: string
  ja: string
  max: number
  baseCost: number
  growth: number
  describe(level: number): string
}

export const BUILDINGS: Building[] = [
  {
    id: 'tavern',
    name: 'Tavern',
    ja: '酒場',
    max: 10,
    baseCost: 30,
    growth: 1.7,
    describe: (l) => `+${l * 10}% gold from every adventurer`,
  },
  {
    id: 'library',
    name: 'Library',
    ja: '図書館',
    max: 10,
    baseCost: 80,
    growth: 1.9,
    describe: (l) => `+${l * 0.5} gold/hour for each mature card`,
  },
  {
    id: 'smithy',
    name: 'Smithy',
    ja: '鍛冶屋',
    max: 5,
    baseCost: 60,
    growth: 2,
    describe: (l) => `Night Watch upgrades cost ${l * 10}% less`,
  },
]

export type PerkId = 'hp' | 'calm' | 'reroll' | 'blessing'

export interface Perk {
  id: PerkId
  name: string
  ja: string
  costs: number[]
  describe: string
}

export const PERKS: Perk[] = [
  { id: 'hp', name: 'Sturdy Lantern', ja: '頑丈な提灯', costs: [40, 120, 300], describe: '+1 starting light (health) per level' },
  { id: 'calm', name: 'Calm Night', ja: '静かな夜', costs: [100], describe: 'The first two waves move 25% slower' },
  { id: 'reroll', name: 'Fortune Slip', ja: 'おみくじ', costs: [80, 240], describe: 'Reroll an upgrade draft once per run, per level' },
  { id: 'blessing', name: 'Blessing', ja: '加護', costs: [250], describe: 'Start every run with a random upgrade' },
]

/** Gold per hour from one card: nothing while learning or overdue, then more the longer you can remember it. */
export function cardIncome(card: StudyCard, now: Date): number {
  if (card.fsrs.state !== State.Review) return 0
  if (new Date(card.fsrs.due) < now) return 0
  return 0.2 * (1 + Math.log2(1 + Math.max(0, card.fsrs.stability)))
}

export interface GuildReport {
  perHour: number
  /** Cards earning gold. */
  working: number
  /** Overdue cards: they earn nothing until reviewed. */
  resting: number
  matureCards: number
  rank: Rank
  nextRank?: Rank
  pending: number
  /** True when uncollected gold has hit the idle cap. */
  full: boolean
}

export function rankFor(matureCards: number): { rank: Rank; next?: Rank } {
  let index = 0
  RANKS.forEach((r, i) => {
    if (matureCards >= r.min) index = i
  })
  return { rank: RANKS[index], next: RANKS[index + 1] }
}

export function guildReport(state: AppState, words: Word[], now: Date): GuildReport {
  const cards = cardsInDeck(state, words)
  let base = 0
  let working = 0
  let resting = 0
  let matureCards = 0
  for (const card of cards) {
    if (card.fsrs.state !== State.Review) continue
    const income = cardIncome(card, now)
    if (income > 0) working++
    else resting++
    if (card.fsrs.scheduled_days >= MATURE_DAYS) matureCards++
    base += income
  }
  const { rank, next } = rankFor(matureCards)
  const tavern = state.guild.buildings.tavern ?? 0
  const library = state.guild.buildings.library ?? 0
  const perHour = (base + library * 0.5 * matureCards) * (1 + 0.1 * tavern) * (1 + rank.bonus)
  const hours = Math.max(0, (now.getTime() - new Date(state.guild.lastCollect).getTime()) / 3_600_000)
  return {
    perHour,
    working,
    resting,
    matureCards,
    rank,
    nextRank: next,
    pending: Math.floor(perHour * Math.min(hours, MAX_IDLE_HOURS)),
    full: hours >= MAX_IDLE_HOURS,
  }
}

export function collectGold(state: AppState, words: Word[], now: Date): AppState {
  const { pending } = guildReport(state, words, now)
  return { ...state, guild: { ...state.guild, gold: state.guild.gold + pending, lastCollect: now.toISOString() } }
}

export function buildingCost(building: Building, level: number): number {
  return Math.round(building.baseCost * building.growth ** level)
}

export function perkCost(state: AppState, perk: Perk): number | undefined {
  const level = state.guild.perks[perk.id] ?? 0
  const base = perk.costs[level]
  if (base === undefined) return undefined
  const smithy = state.guild.buildings.smithy ?? 0
  return Math.round(base * (1 - 0.1 * smithy))
}

export function buyBuilding(state: AppState, id: BuildingId): AppState {
  const building = BUILDINGS.find((b) => b.id === id)
  const level = state.guild.buildings[id] ?? 0
  if (!building || level >= building.max) return state
  const cost = buildingCost(building, level)
  if (state.guild.gold < cost) return state
  return {
    ...state,
    guild: { ...state.guild, gold: state.guild.gold - cost, buildings: { ...state.guild.buildings, [id]: level + 1 } },
  }
}

export function buyPerk(state: AppState, id: PerkId): AppState {
  const perk = PERKS.find((p) => p.id === id)
  if (!perk) return state
  const cost = perkCost(state, perk)
  if (cost === undefined || state.guild.gold < cost) return state
  const level = state.guild.perks[id] ?? 0
  return {
    ...state,
    guild: { ...state.guild, gold: state.guild.gold - cost, perks: { ...state.guild.perks, [id]: level + 1 } },
  }
}

export function formatGold(n: number): string {
  if (n < 1000) return String(Math.floor(n))
  if (n < 1_000_000) return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0)}k`
  return `${(n / 1_000_000).toFixed(1)}M`
}
