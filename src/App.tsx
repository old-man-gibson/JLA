import { useCallback, useEffect, useRef, useState } from 'react'
import { connectCloud, type CloudStore } from './lib/cloud'
import { loadState, requestPersistentStorage, saveState } from './lib/store'
import type { AppState } from './lib/types'
import { Kana } from './views/Kana'
import { Review } from './views/Review'
import { SettingsView, type SyncStatus } from './views/SettingsView'
import { Today } from './views/Today'
import { Words } from './views/Words'

type Tab = 'today' | 'kana' | 'words' | 'settings'

const TABS: { id: Tab; label: string; ja: string }[] = [
  { id: 'today', label: 'Today', ja: '今日' },
  { id: 'kana', label: 'Kana', ja: 'かな' },
  { id: 'words', label: 'Words', ja: '単語' },
  { id: 'settings', label: 'Settings', ja: '設定' },
]

const CLOUD_SAVE_DELAY_MS = 1500

export default function App() {
  const [state, setState] = useState<AppState>(loadState)
  const [tab, setTab] = useState<Tab>('today')
  const [reviewing, setReviewing] = useState(false)
  const [saveFailed, setSaveFailed] = useState(false)
  const [sync, setSync] = useState<SyncStatus>('connecting')

  const latest = useRef(state)
  const cloud = useRef<CloudStore | null>(null)
  const cloudSavedAt = useRef<string | undefined>(undefined)
  const writing = useRef(false)
  const pending = useRef(false)

  // Every change is stamped so the newest copy wins when syncing.
  const update = useCallback(
    (fn: (s: AppState) => AppState) =>
      setState((s) => {
        const next = fn(s)
        return next === s ? s : { ...next, updatedAt: new Date().toISOString() }
      }),
    [],
  )

  // One cloud write at a time; changes made during a write are sent right after it.
  const flush = useCallback(async () => {
    const store = cloud.current
    if (!store) return
    if (writing.current) {
      pending.current = true
      return
    }
    writing.current = true
    try {
      do {
        pending.current = false
        const snapshot = latest.current
        if (snapshot.updatedAt === cloudSavedAt.current) continue
        await store.save(snapshot)
        cloudSavedAt.current = snapshot.updatedAt
      } while (pending.current)
      setSync('synced')
    } catch {
      setSync('error')
    } finally {
      writing.current = false
    }
  }, [])

  // Local copy: instant and always on.
  useEffect(() => {
    latest.current = state
    setSaveFailed(!saveState(state))
  }, [state])

  // Cloud copy: only when running as a claude.ai artifact for a signed-in viewer.
  useEffect(() => {
    requestPersistentStorage()
    let cancelled = false
    void (async () => {
      const store = await connectCloud()
      if (cancelled) return
      if (!store) {
        setSync('local')
        return
      }
      try {
        const remote = await store.load()
        if (cancelled) return
        const local = latest.current
        if (remote && (remote.updatedAt ?? '') > (local.updatedAt ?? '')) {
          cloudSavedAt.current = remote.updatedAt
          setState(remote)
        } else if (remote) {
          cloudSavedAt.current = remote.updatedAt
        }
        cloud.current = store
        setSync('synced')
        if (local.updatedAt && (!remote || local.updatedAt > (remote.updatedAt ?? ''))) void flush()
      } catch {
        if (!cancelled) setSync('error')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [flush])

  useEffect(() => {
    if (sync !== 'synced' || state.updatedAt === cloudSavedAt.current) return
    const timer = setTimeout(() => void flush(), CLOUD_SAVE_DELAY_MS)
    return () => clearTimeout(timer)
  }, [state, sync, flush])

  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === 'hidden') void flush()
    }
    document.addEventListener('visibilitychange', onHide)
    return () => document.removeEventListener('visibilitychange', onHide)
  }, [flush])

  return (
    <div className="app">
      {saveFailed && sync !== 'synced' && (
        <p className="save-warning" role="alert">
          Progress can’t be saved in this browser (storage is blocked or full). Download a backup from Settings before
          closing.
        </p>
      )}
      {reviewing ? (
        <main className="main">
          <Review state={state} update={update} onExit={() => setReviewing(false)} />
        </main>
      ) : (
        <>
          <nav className="tabs" aria-label="Sections">
            <span className="brand" lang="ja">
              にほんご
            </span>
            <div className="tab-list">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`tab ${tab === t.id ? 'on' : ''}`}
                  aria-current={tab === t.id ? 'page' : undefined}
                  onClick={() => setTab(t.id)}
                >
                  <span className="tab-ja" lang="ja">
                    {t.ja}
                  </span>
                  <span className="tab-en">{t.label}</span>
                </button>
              ))}
            </div>
          </nav>
          <main className="main">
            {tab === 'today' && (
              <Today state={state} onStartReview={() => setReviewing(true)} onOpenKana={() => setTab('kana')} />
            )}
            {tab === 'kana' && <Kana state={state} update={update} />}
            {tab === 'words' && <Words state={state} />}
            {tab === 'settings' && <SettingsView state={state} update={update} sync={sync} />}
          </main>
        </>
      )}
    </div>
  )
}
