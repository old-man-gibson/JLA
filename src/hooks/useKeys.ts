import { useEffect, useRef } from 'react'

/** Window-level keyboard shortcuts, keyed by `KeyboardEvent.key`. */
export function useKeys(map: Record<string, () => void>, active = true): void {
  const mapRef = useRef(map)
  useEffect(() => {
    mapRef.current = map
  })
  useEffect(() => {
    if (!active) return
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return
      const handler = mapRef.current[e.key]
      if (handler) {
        e.preventDefault()
        handler()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active])
}
