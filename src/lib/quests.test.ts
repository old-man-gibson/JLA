import { describe, expect, it } from 'vitest'
import { claimQuest, countToday, questStatuses, studyDay, todaysQuests } from './quests'
import { defaultState } from './store'

const morning = new Date('2026-03-10T09:00:00')
const nextDay = new Date('2026-03-11T09:00:00')

describe('guild quests', () => {
  it('a study day starts at 4am', () => {
    expect(studyDay(new Date('2026-03-10T03:00:00'))).toBe('2026-03-09')
    expect(studyDay(new Date('2026-03-10T05:00:00'))).toBe('2026-03-10')
  })

  it('posts three quests, the same all day, different the next', () => {
    const s = defaultState()
    const today = todaysQuests(s, morning).map((q) => q.id)
    expect(today).toHaveLength(3)
    expect(todaysQuests(s, new Date('2026-03-10T22:00:00')).map((q) => q.id)).toEqual(today)
    const days = new Set(Array.from({ length: 7 }, (_, i) => todaysQuests(s, new Date(2026, 2, 10 + i, 9)).map((q) => q.id).join()))
    expect(days.size).toBeGreaterThan(1)
  })

  it('counters reset on a new study day', () => {
    let s = countToday(defaultState(), 'formsCorrect', 4, morning)
    s = countToday(s, 'formsCorrect', 3, morning)
    expect(s.daily.counts.formsCorrect).toBe(7)
    s = countToday(s, 'formsCorrect', 1, nextDay)
    expect(s.daily.counts.formsCorrect).toBe(1)
  })

  it('pays a completed quest once', () => {
    // Find a day whose board has the forms quest, then complete it.
    let day = morning
    for (let i = 0; i < 30 && !todaysQuests(defaultState(), day).some((q) => q.id === 'forms'); i++) {
      day = new Date(day.getTime() + 86400000)
    }
    let s = defaultState()
    expect(claimQuest(s, 'forms', day)).toBe(s)
    s = countToday(s, 'formsCorrect', 10, day)
    const status = questStatuses(s, day).find((q) => q.quest.id === 'forms')!
    expect(status.complete).toBe(true)
    s = claimQuest(s, 'forms', day)
    expect(s.guild.gold).toBe(status.quest.reward)
    expect(claimQuest(s, 'forms', day)).toBe(s)
    expect(questStatuses(s, day).find((q) => q.quest.id === 'forms')!.claimed).toBe(true)
  })
})
