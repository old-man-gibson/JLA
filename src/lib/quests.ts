import { dayStart, queueCounts, wordsIntroducedToday } from './srs'
import type { AppState } from './types'
import { studyWords } from './words'

// Daily quests on the guild board (依頼). Each one is a real study task, so
// the gold they pay is earned by learning, never by grinding the game.

/** Today's date as the study day sees it (days start at 4am). */
export function studyDay(now: Date): string {
  const d = dayStart(now)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export type DailyCounter = 'formsCorrect' | 'listeningCorrect' | 'kanaAnswers'

/** Adds to one of today's activity counters, starting fresh each study day. */
export function countToday(state: AppState, key: DailyCounter, by: number, now: Date): AppState {
  const day = studyDay(now)
  const counts = state.daily.date === day ? state.daily.counts : {}
  return { ...state, daily: { date: day, counts: { ...counts, [key]: (counts[key] ?? 0) + by } } }
}

function counter(state: AppState, key: DailyCounter, now: Date): number {
  return state.daily.date === studyDay(now) ? (state.daily.counts[key] ?? 0) : 0
}

export interface Quest {
  id: string
  title: string
  ja: string
  reward: number
  /** Progress towards the goal, and the goal. */
  progress(state: AppState, now: Date): [done: number, goal: number]
  /** Whether it makes sense to offer this quest now. */
  available?(state: AppState): boolean
}

const todayIso = (now: Date) => dayStart(now).toISOString()

export const QUESTS: Quest[] = [
  {
    id: 'reviews',
    title: 'Clear every review due today',
    ja: '復習',
    reward: 40,
    progress: (s, now) => {
      const counts = queueCounts(s, studyWords(s), now)
      const studiedToday = s.log.some((e) => e.at >= todayIso(now))
      return [counts.review === 0 && counts.learning === 0 && studiedToday ? 1 : 0, 1]
    },
  },
  {
    id: 'new-words',
    title: 'Learn 3 new words',
    ja: '新しい言葉',
    reward: 30,
    progress: (s, now) => [Math.min(3, wordsIntroducedToday(s, now)), 3],
  },
  {
    id: 'forms',
    title: 'Get 10 verb or adjective forms right',
    ja: '活用',
    reward: 35,
    progress: (s, now) => [Math.min(10, counter(s, 'formsCorrect', now)), 10],
  },
  {
    id: 'listening',
    title: 'Understand 8 things in listening practice',
    ja: '聞き取り',
    reward: 30,
    progress: (s, now) => [Math.min(8, counter(s, 'listeningCorrect', now)), 8],
    available: (s) => Object.keys(s.words).length >= 4,
  },
  {
    id: 'kana',
    title: 'Answer 30 kana in the drill',
    ja: 'かな',
    reward: 20,
    progress: (s, now) => [Math.min(30, counter(s, 'kanaAnswers', now)), 30],
  },
  {
    id: 'story',
    title: 'Read a story',
    ja: '物語',
    reward: 30,
    progress: (s, now) => [Object.values(s.storiesRead).some((at) => at >= todayIso(now)) ? 1 : 0, 1],
  },
  {
    id: 'grammar',
    title: 'Start a new grammar point',
    ja: '文法',
    reward: 30,
    progress: (s, now) => [Object.values(s.grammar).some((g) => g.startedAt >= todayIso(now)) ? 1 : 0, 1],
  },
  {
    id: 'night-watch',
    title: 'Reach wave 4 in Night Watch',
    ja: '夜番',
    reward: 35,
    progress: (s, now) => {
      const best = Math.max(0, ...s.runs.history.filter((r) => r.at >= todayIso(now)).map((r) => r.wave))
      return [Math.min(4, best), 4]
    },
  },
]

const QUESTS_BY_ID = Object.fromEntries(QUESTS.map((q) => [q.id, q]))

/** A small stable hash, so the board is the same all day and changes the next. */
function hash(text: string): number {
  let h = 2166136261
  for (const ch of text) h = Math.imul(h ^ ch.charCodeAt(0), 16777619)
  return h >>> 0
}

/** The three quests on today's board. */
export function todaysQuests(state: AppState, now: Date): Quest[] {
  const day = studyDay(now)
  // Once picked, a day's board stays put even if what's available changes.
  if (state.questBoard.date === day) {
    return state.questBoard.ids.map((id) => QUESTS_BY_ID[id]).filter(Boolean)
  }
  const open = QUESTS.filter((q) => q.available?.(state) ?? true)
  return [...open].sort((a, b) => hash(day + a.id) - hash(day + b.id)).slice(0, 3)
}

export interface QuestStatus {
  quest: Quest
  done: number
  goal: number
  complete: boolean
  claimed: boolean
}

export function questStatuses(state: AppState, now: Date): QuestStatus[] {
  const day = studyDay(now)
  const claimed = state.questBoard.date === day ? state.questBoard.claimed : []
  return todaysQuests(state, now).map((quest) => {
    const [done, goal] = quest.progress(state, now)
    return { quest, done, goal, complete: done >= goal, claimed: claimed.includes(quest.id) }
  })
}

/** Pays a completed quest's reward once, and fixes today's board if it wasn't saved yet. */
export function claimQuest(state: AppState, questId: string, now: Date): AppState {
  const day = studyDay(now)
  const status = questStatuses(state, now).find((q) => q.quest.id === questId)
  if (!status || !status.complete || status.claimed) return state
  const board =
    state.questBoard.date === day
      ? state.questBoard
      : { date: day, ids: todaysQuests(state, now).map((q) => q.id), claimed: [] }
  return {
    ...state,
    guild: { ...state.guild, gold: state.guild.gold + status.quest.reward },
    questBoard: { ...board, claimed: [...board.claimed, questId] },
  }
}
