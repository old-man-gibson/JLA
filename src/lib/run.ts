import { toKatakana } from 'wanakana'
import { KANA, type Script } from '../data/kana'
import { WORD_CLASSES } from '../data/wordClasses'
import { conjugate, FORM_BY_ID, type FormId } from './conjugate'
import { finalizeKanaInput } from './answer'
import type { AppState } from './types'
import { findWord } from './words'

// Night Watch: a survivors-style typing game. Yokai drift toward your lantern
// from every side; typing a yokai's reading banishes it. Waves speed up,
// level-ups offer a draft of upgrades, and every fifth wave brings a boss
// that carries three words. It only uses kana and words you have already
// met, and it never changes your review schedule.

export interface Prompt {
  /** What the yokai shows. */
  display: string
  /** The reading to type, in kana. */
  answer: string
  meaning?: string
  kind: 'kana' | 'word'
}

export type EnemyKind = 'wisp' | 'oni' | 'boss'

export interface Enemy {
  id: number
  kind: EnemyKind
  prompt: Prompt
  /** Prompts a boss still carries after the current one. */
  queue: Prompt[]
  angle: number
  /** 1 at the edge of the field, 0 at the lantern. */
  dist: number
  /** Field radii per second. */
  speed: number
}

export type UpgradeId = 'wards' | 'incense' | 'gust' | 'drum' | 'mending' | 'bell' | 'revive'

export interface Upgrade {
  id: UpgradeId
  name: string
  ja: string
  max: number
  describe(nextLevel: number): string
}

export const UPGRADES: Upgrade[] = [
  { id: 'wards', name: 'Paper Wards', ja: '御札', max: 3, describe: () => '+1 maximum light, and restore 1' },
  { id: 'incense', name: 'Slow Incense', ja: '香', max: 3, describe: (l) => `Yokai move ${l * 12}% slower` },
  { id: 'gust', name: 'Gust', ja: '突風', max: 3, describe: (l) => `Each banish pushes nearby yokai back (strength ${l})` },
  { id: 'drum', name: 'Taiko Drum', ja: '太鼓', max: 3, describe: (l) => `Combos give more XP: +${l * 10}% per 5 in a row` },
  { id: 'mending', name: 'Mending', ja: '癒し', max: 3, describe: (l) => `Restore 1 light every ${mendEvery(l)} banishes` },
  { id: 'bell', name: 'Temple Bell', ja: '鐘', max: 2, describe: (l) => `When you’re hit, yokai freeze for ${l * 1.5}s` },
  { id: 'revive', name: 'Second Wind', ja: '復活', max: 1, describe: () => 'Once per run, relight with 3 light instead of losing' },
]

function mendEvery(level: number) {
  return Math.max(10, 30 - 6 * level)
}

export const WAVE_SECONDS = 25
const HIT_DIST = 0.08

export interface GotThrough {
  prompt: Prompt
  count: number
}

export interface RunState {
  time: number
  wave: number
  waveTime: number
  hp: number
  maxHp: number
  xp: number
  level: number
  kills: number
  misses: number
  combo: number
  bestCombo: number
  score: number
  enemies: Enemy[]
  nextSpawn: number
  nextId: number
  upgrades: Record<UpgradeId, number>
  freeze: number
  rerolls: number
  reviveUsed: boolean
  calm: boolean
  killsSinceMend: number
  pendingLevelUps: number
  gotThrough: GotThrough[]
  over: boolean
}

export interface Pool {
  kana: Prompt[]
  words: Prompt[]
  /** Share of word yokai in the first wave (rises each wave). */
  wordShare?: number
}

export interface RunOptions {
  scripts: Script[]
  words: boolean
  /** Verb and adjective form yokai: 書く・て → かいて. */
  forms?: boolean
}

const RUN_FORMS: FormId[] = ['masu', 'te', 'ta', 'nai', 'adj-nai', 'adj-katta']

/** Form prompts for the verbs and adjectives you've reviewed: shown as "書く・て", answered with the reading. */
export function formPrompts(state: AppState): Prompt[] {
  return learnedWordIds(state).flatMap((id) => {
    const cls = WORD_CLASSES[id]
    const word = findWord(state, id)
    if (!cls || !word) return []
    return RUN_FORMS.flatMap((form) => {
      const answer = conjugate(word.word, word.reading, cls, form)
      if (!answer) return []
      const short = FORM_BY_ID[form].ja.replace('〜', '')
      return [{ display: `${word.word}・${short}`, answer: answer.reading, meaning: `${answer.word}: ${FORM_BY_ID[form].label}`, kind: 'word' as const }]
    })
  })
}

/** Kana from the chosen scripts (basic and dakuten, plus combinations you've practised) and words you've met. */
export function buildPool(state: AppState, options: RunOptions): Pool {
  const kana = KANA.filter(
    (k) => options.scripts.includes(k.script) && (k.group !== 'combo' || (state.kana[k.kana]?.seen ?? 0) > 0),
  ).map((k): Prompt => ({ display: k.kana, answer: k.kana, kind: 'kana' }))
  const words = [...(options.words ? learnedWords(state) : []), ...(options.forms ? formPrompts(state) : [])]
  // Choosing verb forms means wanting to see them: more word yokai from the start.
  return { kana, words, wordShare: options.forms ? 0.4 : 0.15 }
}

function learnedWordIds(state: AppState): string[] {
  return Object.keys(state.words).filter((id) =>
    Object.values(state.cards).some((c) => c.wordId === id && c.fsrs.reps > 0),
  )
}

/** Words whose cards you have seen at least once. */
export function learnedWords(state: AppState): Prompt[] {
  return learnedWordIds(state).flatMap((id) => {
    const word = findWord(state, id)
    return word ? [{ display: word.word, answer: word.reading, meaning: word.meaning, kind: 'word' as const }] : []
  })
}

export function xpToNext(level: number): number {
  return 4 + level * 3
}

export function createRun(perks: Record<string, number>): RunState {
  const maxHp = 3 + (perks.hp ?? 0)
  return {
    time: 0,
    wave: 1,
    waveTime: 0,
    hp: maxHp,
    maxHp,
    xp: 0,
    level: 1,
    kills: 0,
    misses: 0,
    combo: 0,
    bestCombo: 0,
    score: 0,
    enemies: [],
    nextSpawn: 1,
    nextId: 1,
    upgrades: { wards: 0, incense: 0, gust: 0, drum: 0, mending: 0, bell: 0, revive: 0 },
    freeze: 0,
    rerolls: perks.reroll ?? 0,
    reviveUsed: false,
    calm: (perks.calm ?? 0) > 0,
    killsSinceMend: 0,
    pendingLevelUps: 0,
    gotThrough: [],
    over: false,
  }
}

function speedFactor(s: RunState): number {
  const incense = 1 - 0.12 * s.upgrades.incense
  const calm = s.calm && s.wave <= 2 ? 0.75 : 1
  return incense * calm
}

function travelSeconds(kind: EnemyKind, wave: number): number {
  const base = Math.max(5, 11 - 0.5 * (wave - 1))
  if (kind === 'oni') return base * 1.6
  if (kind === 'boss') return 34
  return base
}

function pick<T>(list: T[], rng: () => number): T {
  return list[Math.floor(rng() * list.length)]
}

function pickPrompt(s: RunState, list: Prompt[], rng: () => number): Prompt {
  const onScreen = new Set(s.enemies.map((e) => e.prompt.answer))
  for (let i = 0; i < 6; i++) {
    const p = pick(list, rng)
    if (!onScreen.has(p.answer)) return p
  }
  return pick(list, rng)
}

function spawn(s: RunState, pool: Pool, rng: () => number, kind?: EnemyKind) {
  const share = pool.wordShare ?? 0.15
  const wordChance = pool.words.length > 0 ? Math.min(Math.max(0.6, share), share + 0.07 * (s.wave - 1)) : 0
  const type: EnemyKind = kind ?? (rng() < wordChance ? 'oni' : 'wisp')
  let prompt: Prompt
  let queue: Prompt[] = []
  if (type === 'boss') {
    const source = pool.words.length >= 3 ? pool.words : pool.kana
    const chosen: Prompt[] = []
    for (let i = 0; i < 3; i++) chosen.push(pickPrompt({ ...s, enemies: [...s.enemies, ...chosen.map((p) => ({ prompt: p }) as Enemy)] }, source, rng))
    ;[prompt, ...queue] = chosen
  } else {
    prompt = pickPrompt(s, type === 'oni' ? pool.words : pool.kana, rng)
  }
  s.enemies.push({
    id: s.nextId++,
    kind: type,
    prompt,
    queue,
    angle: rng() * Math.PI * 2,
    dist: 1,
    speed: 1 / travelSeconds(type, s.wave),
  })
}

export type RunEvent =
  | { type: 'hit'; enemy: Enemy }
  | { type: 'wave'; wave: number }
  | { type: 'revive' }
  | { type: 'over' }

/** Advances the game by `dt` seconds. Mutates and returns events for effects. */
export function stepRun(s: RunState, dt: number, pool: Pool, rng: () => number = Math.random): RunEvent[] {
  const events: RunEvent[] = []
  if (s.over || s.pendingLevelUps > 0) return events
  s.time += dt
  s.waveTime += dt
  if (s.waveTime >= WAVE_SECONDS) {
    s.waveTime -= WAVE_SECONDS
    s.wave += 1
    s.score += 50 * (s.wave - 1)
    events.push({ type: 'wave', wave: s.wave })
    if (s.wave % 5 === 0) spawn(s, pool, rng, 'boss')
  }

  s.nextSpawn -= dt
  if (s.nextSpawn <= 0) {
    spawn(s, pool, rng)
    s.nextSpawn = Math.max(0.6, 2.4 * 0.88 ** (s.wave - 1))
  }

  if (s.freeze > 0) {
    s.freeze = Math.max(0, s.freeze - dt)
    return events
  }

  const factor = speedFactor(s)
  for (const enemy of [...s.enemies]) {
    enemy.dist -= enemy.speed * factor * dt
    if (enemy.dist > HIT_DIST) continue
    s.enemies = s.enemies.filter((e) => e !== enemy)
    s.hp -= enemy.kind === 'boss' ? 3 : 1
    s.combo = 0
    for (const p of [enemy.prompt, ...enemy.queue]) {
      const seen = s.gotThrough.find((g) => g.prompt.answer === p.answer && g.prompt.display === p.display)
      if (seen) seen.count++
      else s.gotThrough.push({ prompt: p, count: 1 })
    }
    events.push({ type: 'hit', enemy })
    if (s.upgrades.bell > 0) s.freeze = 1.5 * s.upgrades.bell
    if (s.hp <= 0) {
      if (s.upgrades.revive > 0 && !s.reviveUsed) {
        s.reviveUsed = true
        s.hp = Math.min(3, s.maxHp)
        s.enemies = s.enemies.filter((e) => e.dist > 0.5)
        events.push({ type: 'revive' })
      } else {
        s.over = true
        events.push({ type: 'over' })
        break
      }
    }
  }
  return events
}

// ぢ/じ, づ/ず and を/お sound the same, and the usual romaji (ji, zu, o) types the
// second of each, so they count as one for matching.
const SAME_SOUND: Record<string, string> = { ヂ: 'ジ', ヅ: 'ズ', ヲ: 'オ' }
const normalize = (text: string) => toKatakana(text).replace(/[ヂヅヲ]/g, (c) => SAME_SOUND[c])

/**
 * Finds the yokai the learner's typing banishes. While typing, it waits if a
 * longer answer on screen also starts with what's typed (い vs いえ); pressing
 * Enter or Space settles it.
 */
export function matchTyped(s: RunState, raw: string, final: boolean): Enemy | null {
  const typed = final ? finalizeKanaInput(raw) : raw.trim()
  if (!typed || (!final && /[a-z]/i.test(typed))) return null
  const t = normalize(typed)
  const matches = s.enemies.filter((e) => normalize(e.prompt.answer) === t)
  if (matches.length === 0) return null
  if (!final && s.enemies.some((e) => normalize(e.prompt.answer).startsWith(t) && normalize(e.prompt.answer).length > t.length)) {
    return null
  }
  return matches.reduce((a, b) => (b.dist < a.dist ? b : a))
}

/** Enemies whose answer starts with what's typed so far, for highlighting. */
export function prefixMatches(s: RunState, raw: string): Set<number> {
  const typed = raw.trim()
  if (!typed || /[a-z]/i.test(typed)) return new Set()
  const t = normalize(typed)
  return new Set(s.enemies.filter((e) => normalize(e.prompt.answer).startsWith(t)).map((e) => e.id))
}

export interface Banish {
  enemy: Enemy
  prompt: Prompt
  defeated: boolean
  xp: number
}

/** Applies a correct answer to an enemy. */
export function banish(s: RunState, enemy: Enemy): Banish {
  const prompt = enemy.prompt
  s.combo += 1
  s.bestCombo = Math.max(s.bestCombo, s.combo)
  const drum = 1 + Math.min(1, 0.1 * s.upgrades.drum * Math.floor(s.combo / 5))
  let defeated = true
  let base: number
  if (enemy.kind === 'boss' && enemy.queue.length > 0) {
    enemy.prompt = enemy.queue.shift()!
    defeated = false
    base = 4
  } else {
    base = enemy.kind === 'boss' ? 10 : enemy.kind === 'oni' ? 3 : 1
    s.enemies = s.enemies.filter((e) => e !== enemy)
    s.kills += 1
    s.killsSinceMend += 1
  }
  const xp = Math.round(base * drum)
  s.xp += xp
  s.score += Math.round(base * 10 * (1 + s.combo / 20))

  if (s.upgrades.gust > 0) {
    for (const e of s.enemies) if (e.dist < 0.5) e.dist = Math.min(1, e.dist + 0.06 * s.upgrades.gust)
  }
  if (s.upgrades.mending > 0 && s.killsSinceMend >= mendEvery(s.upgrades.mending)) {
    s.killsSinceMend = 0
    s.hp = Math.min(s.maxHp, s.hp + 1)
  }
  while (s.xp >= xpToNext(s.level)) {
    s.xp -= xpToNext(s.level)
    s.level += 1
    s.pendingLevelUps += 1
  }
  return { enemy, prompt, defeated, xp }
}

export function recordMiss(s: RunState) {
  s.misses += 1
  s.combo = 0
}

export function draftUpgrades(s: RunState, rng: () => number = Math.random, count = 3): Upgrade[] {
  const open = UPGRADES.filter((u) => s.upgrades[u.id] < u.max)
  const shuffled = [...open].sort(() => rng() - 0.5)
  return shuffled.slice(0, count)
}

export function applyUpgrade(s: RunState, id: UpgradeId) {
  s.upgrades[id] += 1
  if (id === 'wards') {
    s.maxHp += 1
    s.hp = Math.min(s.maxHp, s.hp + 1)
  }
}

export function chooseUpgrade(s: RunState, id: UpgradeId) {
  if (s.pendingLevelUps <= 0) return
  applyUpgrade(s, id)
  s.pendingLevelUps -= 1
}
