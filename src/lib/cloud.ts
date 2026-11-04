// Optional sync for when the app runs as a claude.ai artifact. There, the page
// can ask the viewer's browser for platform capabilities through
// `window.claude.use(name)`; anywhere else `window.claude` is absent and the
// app keeps using localStorage only.

import { normalizeState } from './store'
import type { AppState, ReviewLogEntry } from './types'

interface DocSnapshot {
  exists: boolean
  data(): Record<string, unknown> | undefined
}
interface DocRef {
  get(): Promise<DocSnapshot>
  set(data: Record<string, unknown>): Promise<void>
}
interface Db {
  doc(path: string): DocRef
}
interface User {
  id(): Promise<string | null>
}
export interface Downloads {
  save(request: { filename: string; data: string }): Promise<unknown>
}
interface Runtime {
  use(name: string): Promise<unknown>
}

/** Resolves a platform capability, or null when not running inside claude.ai. */
export async function getCapability<T>(name: string): Promise<T | null> {
  const runtime = (window as unknown as { claude?: Runtime }).claude
  if (typeof runtime?.use !== 'function') return null
  try {
    return ((await runtime.use(name)) as T | null) ?? null
  } catch {
    return null
  }
}

/** Documents are capped at 256 KiB; stay safely under it. */
const MAX_DOC_BYTES = 240 * 1024
const CLOUD_LOG_LIMIT = 4000

/** Stores the review log as compact "cardId|rating|unixSeconds|stateBefore" lines. */
export function encodeLog(log: ReviewLogEntry[]): string {
  return log.map((e) => `${e.cardId}|${e.rating}|${Math.round(new Date(e.at).getTime() / 1000)}|${e.before}`).join('\n')
}

export function decodeLog(text: string): ReviewLogEntry[] {
  if (!text) return []
  return text.split('\n').flatMap((line) => {
    const [cardId, rating, seconds, before] = line.split('|')
    if (!cardId || !seconds) return []
    return [
      {
        cardId,
        rating: Number(rating) as ReviewLogEntry['rating'],
        at: new Date(Number(seconds) * 1000).toISOString(),
        before: Number(before) as ReviewLogEntry['before'],
      },
    ]
  })
}

const byteLength = (value: unknown) => new TextEncoder().encode(JSON.stringify(value)).length

/** The state as one document, dropping the oldest review history if it would not fit. */
export function toCloudDoc(state: AppState): Record<string, unknown> {
  let log = state.log.slice(-CLOUD_LOG_LIMIT)
  let doc: Record<string, unknown> = { ...state, log: encodeLog(log) }
  while (byteLength(doc) > MAX_DOC_BYTES && log.length > 0) {
    log = log.slice(Math.ceil(log.length / 4))
    doc = { ...state, log: encodeLog(log) }
  }
  return doc
}

export function fromCloudDoc(data: Record<string, unknown>): AppState {
  return normalizeState({ ...data, log: typeof data.log === 'string' ? decodeLog(data.log) : data.log })
}

export interface CloudStore {
  load(): Promise<AppState | null>
  save(state: AppState): Promise<void>
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms)
    promise.then(
      (v) => {
        clearTimeout(timer)
        resolve(v)
      },
      (e) => {
        clearTimeout(timer)
        reject(e)
      },
    )
  })
}

/**
 * Connects to the viewer's private storage (`data/users/<their id>/`), which
 * only they can read. Resolves null outside claude.ai or for signed-out viewers.
 */
export async function connectCloud(): Promise<CloudStore | null> {
  const [db, user] = await Promise.all([getCapability<Db>('db'), getCapability<User>('user')])
  if (!db || !user) return null
  const id = await user.id().catch(() => null)
  if (!id) return null
  const ref = db.doc(`data/users/${id}/progress`)
  return {
    async load() {
      const snap = await withTimeout(ref.get(), 10000)
      const data = snap.exists ? snap.data() : undefined
      return data ? fromCloudDoc(data) : null
    },
    async save(state) {
      await withTimeout(ref.set(toCloudDoc(state)), 15000)
    },
  }
}
