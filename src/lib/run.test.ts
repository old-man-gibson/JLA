import { describe, expect, it } from 'vitest'
import { Rating } from 'ts-fsrs'
import { STARTER_WORDS } from '../data/deck'
import {
  applyUpgrade,
  banish,
  buildPool,
  chooseUpgrade,
  createRun,
  draftUpgrades,
  learnedWords,
  matchTyped,
  prefixMatches,
  stepRun,
  type Enemy,
  type Pool,
  type Prompt,
} from './run'
import { cardId, gradeCard, introduceWord } from './srs'
import { defaultState } from './store'

const kana = (k: string): Prompt => ({ display: k, answer: k, kind: 'kana' })
const word = (display: string, answer: string): Prompt => ({ display, answer, kind: 'word', meaning: 'x' })
const enemy = (id: number, prompt: Prompt, dist = 0.9, kind: Enemy['kind'] = 'wisp', queue: Prompt[] = []): Enemy => ({
  id,
  kind,
  prompt,
  queue,
  angle: 0,
  dist,
  speed: 0.1,
})

// Deterministic random numbers for repeatable runs.
function seeded(seed = 1) {
  return () => {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
  }
}

describe('Night Watch matching', () => {
  it('matches kana typed as hiragana, katakana enemies included', () => {
    const s = createRun({})
    s.enemies = [enemy(1, kana('カ')), enemy(2, kana('し'))]
    expect(matchTyped(s, 'か', false)?.id).toBe(1)
    expect(matchTyped(s, 'し', false)?.id).toBe(2)
    expect(matchTyped(s, 'sh', false)).toBeNull()
  })

  it('waits when a longer answer starts the same way, until Enter', () => {
    const s = createRun({})
    s.enemies = [enemy(1, kana('い')), enemy(2, word('家', 'いえ'))]
    expect(matchTyped(s, 'い', false)).toBeNull()
    expect(matchTyped(s, 'い', true)?.id).toBe(1)
    expect(matchTyped(s, 'いえ', false)?.id).toBe(2)
    expect([...prefixMatches(s, 'い')].sort()).toEqual([1, 2])
  })

  it('finishes a trailing n on Enter (ん)', () => {
    const s = createRun({})
    s.enemies = [enemy(1, kana('ん'))]
    expect(matchTyped(s, 'n', false)).toBeNull()
    expect(matchTyped(s, 'n', true)?.id).toBe(1)
  })

  it('targets the closest enemy when two share an answer', () => {
    const s = createRun({})
    s.enemies = [enemy(1, kana('あ'), 0.8), enemy(2, kana('あ'), 0.3)]
    expect(matchTyped(s, 'あ', false)?.id).toBe(2)
  })
})

describe('Night Watch rules', () => {
  it('bosses take one hit per word they carry', () => {
    const s = createRun({})
    const boss = enemy(1, word('剣', 'けん'), 0.9, 'boss', [word('盾', 'たて'), word('弓', 'ゆみ')])
    s.enemies = [boss]
    expect(banish(s, boss).defeated).toBe(false)
    expect(boss.prompt.answer).toBe('たて')
    banish(s, boss)
    expect(banish(s, boss).defeated).toBe(true)
    expect(s.enemies).toHaveLength(0)
    expect(s.kills).toBe(1)
  })

  it('enemies that reach the lantern cost light and are remembered for the summary', () => {
    const s = createRun({})
    s.nextSpawn = 999
    s.enemies = [enemy(1, kana('ぬ'), 0.1)]
    stepRun(s, 1, { kana: [kana('あ')], words: [] })
    expect(s.hp).toBe(2)
    expect(s.gotThrough[0].prompt.display).toBe('ぬ')
  })

  it('ends the run at zero light, unless Second Wind is available', () => {
    const pool: Pool = { kana: [kana('あ')], words: [] }
    const s = createRun({})
    s.nextSpawn = 999
    s.hp = 1
    applyUpgrade(s, 'revive')
    s.enemies = [enemy(1, kana('ぬ'), 0.05)]
    stepRun(s, 0.1, pool)
    expect(s.over).toBe(false)
    expect(s.hp).toBe(3)
    s.hp = 1
    s.enemies = [enemy(2, kana('め'), 0.05)]
    stepRun(s, 0.1, pool)
    expect(s.over).toBe(true)
  })

  it('levels up from XP and pauses for an upgrade draft', () => {
    const s = createRun({})
    for (let i = 0; i < 7; i++) {
      const e = enemy(i + 1, kana('あ'))
      s.enemies = [e]
      banish(s, e)
    }
    expect(s.level).toBe(2)
    expect(s.pendingLevelUps).toBe(1)
    const before = s.time
    stepRun(s, 1, { kana: [kana('あ')], words: [] })
    expect(s.time).toBe(before)
    const draft = draftUpgrades(s, seeded())
    expect(draft).toHaveLength(3)
    chooseUpgrade(s, draft[0].id)
    expect(s.pendingLevelUps).toBe(0)
  })

  it('a simulated run spawns waves and eventually ends if nobody types', () => {
    const s = createRun({ hp: 1 })
    const rng = seeded(7)
    const pool: Pool = { kana: [kana('あ'), kana('い'), kana('う')], words: [word('水', 'みず')] }
    let t = 0
    while (!s.over && t < 600) {
      stepRun(s, 0.1, pool, rng)
      t += 0.1
    }
    expect(s.over).toBe(true)
    expect(s.maxHp).toBe(4)
    expect(s.gotThrough.length).toBeGreaterThan(0)
  })

  it('builds a pool from kana scripts and words you have reviewed', () => {
    const now = new Date('2026-01-05T10:00:00Z')
    let state = introduceWord(defaultState(), STARTER_WORDS[0].id, now)
    expect(learnedWords(state)).toHaveLength(0)
    state = gradeCard(state, cardId(STARTER_WORDS[0].id, 'recognize'), Rating.Good, now)
    expect(learnedWords(state).map((p) => p.answer)).toEqual(['わたし'])
    const pool = buildPool(state, { scripts: ['katakana'], words: true })
    expect(pool.kana.every((k) => /[゠-ヿ]/.test(k.display))).toBe(true)
    expect(pool.kana).toHaveLength(71)
    expect(pool.words).toHaveLength(1)
  })
})
