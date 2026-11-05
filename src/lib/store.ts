import type { AppState, GuildState, RunStats, Settings } from './types'

const KEY = 'nihongo:v1'

export const DEFAULT_SETTINGS: Settings = {
  newWordsPerDay: 5,
  furigana: 'auto',
  autoplayAudio: true,
  decks: ['starter', 'adventurer'],
  keyboard: 'auto',
  keypadLayout: 'auto',
}

export function defaultGuild(now = new Date()): GuildState {
  return { gold: 0, lastCollect: now.toISOString(), buildings: {}, perks: {} }
}

export function defaultRuns(): RunStats {
  return { best: 0, bestWave: 0, history: [] }
}

export function defaultState(): AppState {
  return {
    version: 1,
    settings: { ...DEFAULT_SETTINGS },
    words: {},
    cards: {},
    log: [],
    kana: {},
    customWords: {},
    guild: defaultGuild(),
    runs: defaultRuns(),
    grammar: {},
    storiesRead: {},
    formStats: {},
  }
}

/** Fills in anything missing from older or hand-edited saves. */
export function normalizeState(raw: unknown): AppState {
  if (!raw || typeof raw !== 'object') throw new Error('Not a nihongo backup')
  const data = raw as Partial<AppState>
  if (data.version !== 1) throw new Error('Unsupported backup version')
  return {
    version: 1,
    ...(typeof data.updatedAt === 'string' ? { updatedAt: data.updatedAt } : {}),
    settings: { ...DEFAULT_SETTINGS, ...data.settings },
    words: data.words ?? {},
    cards: data.cards ?? {},
    log: Array.isArray(data.log) ? data.log : [],
    kana: data.kana ?? {},
    customWords: data.customWords ?? {},
    guild: { ...defaultGuild(), ...data.guild },
    runs: { ...defaultRuns(), ...data.runs },
    grammar: data.grammar ?? {},
    storiesRead: data.storiesRead ?? {},
    formStats: data.formStats ?? {},
  }
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? normalizeState(JSON.parse(raw)) : defaultState()
  } catch {
    return defaultState()
  }
}

export function saveState(state: AppState): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
    return true
  } catch {
    return false
  }
}

/** Asks the browser not to evict our storage when space runs low. */
export function requestPersistentStorage(): void {
  try {
    void navigator.storage?.persist?.()
  } catch {
    // Not supported; localStorage still works, just with weaker guarantees.
  }
}

export function exportState(state: AppState): string {
  return JSON.stringify(state, null, 2)
}

export function importState(text: string): AppState {
  return normalizeState(JSON.parse(text))
}
