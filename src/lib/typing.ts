import { useEffect, useRef, useState } from 'react'
import { toKana } from 'wanakana'
import type { Settings } from './types'

/** A key from the on-screen keyboard or a physical one: a letter, '-', 'back' or 'enter'. */
export type TypedKey = string

/**
 * Applies one key to what's been typed. In kana mode romaji turns into kana as
 * you go, the way a Japanese input method does (ka → か, ko- → こー, nn → ん).
 */
export function applyKey(value: string, key: TypedKey, mode: 'kana' | 'romaji'): string {
  if (key === 'back') return value.slice(0, -1)
  if (key === 'enter') return value
  if (mode === 'romaji') return (value + key).slice(-6)
  return toKana(value + key, { IMEMode: true })
}

/**
 * Whether to show the on-screen romaji keyboard. On phones the system keyboard
 * covers the bottom of the screen (and inside claude.ai the page can't move
 * out of its way), so touch screens get keys laid out in the page instead.
 */
export function useOnscreenKeys(settings: Settings): boolean {
  const [touch] = useState(() => {
    try {
      return window.matchMedia('(pointer: coarse)').matches
    } catch {
      return false
    }
  })
  return settings.keyboard === 'onscreen' || (settings.keyboard === 'auto' && touch)
}

/** Physical keys while the on-screen keyboard is in use (tablets with keyboards, desktop testing). */
export function useTypingKeys(active: boolean, onKey: (key: TypedKey) => void): void {
  const handler = useRef(onKey)
  useEffect(() => {
    handler.current = onKey
  })
  useEffect(() => {
    if (!active) return
    const listener = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      let key: TypedKey | null = null
      if (/^[a-z]$/i.test(e.key)) key = e.key.toLowerCase()
      else if (e.key === '-') key = '-'
      else if (e.key === 'Backspace') key = 'back'
      else if (e.key === 'Enter' || e.key === ' ') key = 'enter'
      if (key === null) return
      e.preventDefault()
      handler.current(key)
    }
    window.addEventListener('keydown', listener)
    return () => window.removeEventListener('keydown', listener)
  }, [active])
}
