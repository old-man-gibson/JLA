import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { bind, unbind } from 'wanakana'
import { Keypad } from '../components/Keypad'
import { resolveLayout } from '../lib/keypadLayouts'
import {
  applyUpgrade,
  banish,
  buildPool,
  chooseUpgrade,
  createRun,
  draftUpgrades,
  matchTyped,
  prefixMatches,
  recordMiss,
  stepRun,
  WAVE_SECONDS,
  xpToNext,
  type Enemy,
  type RunOptions,
  type RunState,
  type Upgrade,
} from '../lib/run'
import type { AppState } from '../lib/types'
import { applyKey, useOnscreenKeys, useTypingKeys, type TypedKey } from '../lib/typing'

type Update = (fn: (s: AppState) => AppState) => void

interface Props {
  state: AppState
  update: Update
  options: RunOptions
  onExit: () => void
}

// The field is a night scene in both light and dark mode, so it uses its own palette.
const NIGHT = {
  sky: '#0b1020',
  skyEdge: '#05070f',
  ring: 'rgba(160, 180, 255, 0.10)',
  glow: '255, 176, 92',
  lantern: '#e2583a',
  lanternCap: '#3a2a22',
  wisp: 'rgba(150, 190, 255, 0.85)',
  wispFill: 'rgba(120, 160, 255, 0.16)',
  oni: '#ff8a76',
  oniFill: 'rgba(255, 110, 90, 0.16)',
  boss: '#ffcf5c',
  bossFill: 'rgba(255, 200, 80, 0.16)',
  target: '#ffe08a',
  text: '#f2efe6',
  muted: 'rgba(242, 239, 230, 0.6)',
  hit: '255, 70, 60',
}

const FONT_JA = `'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Noto Sans JP', 'Noto Sans CJK JP', 'Yu Gothic UI', Meiryo, sans-serif`

interface Effect {
  kind: 'float' | 'burst' | 'beam' | 'banner'
  x: number
  y: number
  life: number
  max: number
  text?: string
  sub?: string
  tx?: number
  ty?: number
}

function newRun(perks: Record<string, number>): RunState {
  const run = createRun(perks)
  if ((perks.blessing ?? 0) > 0) {
    const [gift] = draftUpgrades(run, Math.random, 1)
    if (gift) applyUpgrade(run, gift.id)
  }
  return run
}

interface Hud {
  hp: number
  maxHp: number
  wave: number
  waveProgress: number
  score: number
  combo: number
  level: number
  xp: number
  xpNeeded: number
}

const hudOf = (s: RunState): Hud => ({
  hp: s.hp,
  maxHp: s.maxHp,
  wave: s.wave,
  waveProgress: s.waveTime / WAVE_SECONDS,
  score: s.score,
  combo: s.combo,
  level: s.level,
  xp: s.xp,
  xpNeeded: xpToNext(s.level),
})

export function NightWatch({ state, update, options, onExit }: Props) {
  const pool = useMemo(() => buildPool(state, options), [])
  const perks = state.guild.perks
  const runRef = useRef<RunState>(newRun(perks))
  const [hud, setHud] = useState<Hud>(() => hudOf(runRef.current))
  const [draft, setDraft] = useState<Upgrade[] | null>(null)
  const [paused, setPaused] = useState(false)
  const [over, setOver] = useState<RunState | null>(null)
  const [shake, setShake] = useState(0)
  const screenRef = useRef<HTMLDivElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const effects = useRef<Effect[]>([])
  const flash = useRef(0)
  const size = useRef({ w: 0, h: 0, dpr: 1 })
  const halted = useRef(false)
  const recorded = useRef(false)
  halted.current = paused || draft !== null || over !== null

  const geometry = () => {
    const { w, h } = size.current
    return { cx: w / 2, cy: h / 2, r: Math.max(80, Math.min(w, h) / 2 - 12) }
  }
  const enemyPos = (e: Enemy) => {
    const { cx, cy, r } = geometry()
    return { x: cx + Math.cos(e.angle) * e.dist * r, y: cy + Math.sin(e.angle) * e.dist * r }
  }

  const onscreen = useOnscreenKeys(state.settings)
  const focusInput = () => {
    if (!onscreen) inputRef.current?.focus({ preventScroll: true })
  }

  const finish = useCallback(
    (s: RunState) => {
      if (recorded.current) return
      recorded.current = true
      setOver({ ...s, gotThrough: [...s.gotThrough] })
      update((st) => ({
        ...st,
        runs: {
          best: Math.max(st.runs.best, s.score),
          bestWave: Math.max(st.runs.bestWave, s.wave),
          history: [...st.runs.history, { at: new Date().toISOString(), score: s.score, wave: s.wave, kills: s.kills }].slice(-20),
        },
      }))
    },
    [update],
  )

  const tryMatch = (final: boolean) => {
    const el = inputRef.current
    const s = runRef.current
    if (!el || halted.current) return
    const raw = el.value.replace(/\s+$/, '')
    const target = matchTyped(s, raw, final)
    if (target) {
      const { x, y } = enemyPos(target)
      const { cx, cy } = geometry()
      const result = banish(s, target)
      effects.current.push({ kind: 'beam', x: cx, y: cy, tx: x, ty: y, life: 0.25, max: 0.25 })
      effects.current.push({ kind: 'burst', x, y, life: 0.45, max: 0.45 })
      if (result.prompt.kind === 'word') {
        effects.current.push({
          kind: 'float',
          x,
          y,
          life: 1.6,
          max: 1.6,
          text: result.prompt.answer,
          sub: result.prompt.meaning,
        })
      }
      el.value = ''
      if (s.pendingLevelUps > 0) setDraft(draftUpgrades(s))
      setHud(hudOf(s))
    } else if (final) {
      if (raw.trim()) {
        recordMiss(s)
        setShake((n) => n + 1)
      }
      el.value = ''
    }
  }

  const pick = (u: Upgrade) => {
    const s = runRef.current
    chooseUpgrade(s, u.id)
    setDraft(s.pendingLevelUps > 0 ? draftUpgrades(s) : null)
    setHud(hudOf(s))
    focusInput()
  }

  const reroll = () => {
    const s = runRef.current
    if (s.rerolls <= 0) return
    s.rerolls -= 1
    setDraft(draftUpgrades(s))
  }

  const restart = () => {
    runRef.current = newRun(perks)
    effects.current = []
    recorded.current = false
    setOver(null)
    setDraft(null)
    setPaused(false)
    setHud(hudOf(runRef.current))
    if (inputRef.current) inputRef.current.value = ''
    focusInput()
  }

  // On-screen keys (and physical keys while they're shown).
  const pressKey = (key: TypedKey) => {
    const el = inputRef.current
    if (!el || halted.current) return
    if (key === 'enter') {
      tryMatch(true)
    } else {
      el.value = applyKey(el.value, key, 'kana')
      tryMatch(false)
    }
  }
  useTypingKeys(onscreen && over === null, pressKey)

  // The device keyboard, with romaji turning into kana as you type.
  useEffect(() => {
    const el = inputRef.current
    if (!el || onscreen) return
    bind(el, { IMEMode: true })
    const onInput = () => {
      // Phone keyboards often send a space as text rather than a key press.
      if (/\s$/.test(el.value)) tryMatch(true)
      else tryMatch(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        tryMatch(true)
      } else if (e.key === 'Escape') {
        setPaused((p) => !p)
      }
    }
    el.addEventListener('input', onInput)
    el.addEventListener('keydown', onKey)
    focusInput()
    return () => {
      el.removeEventListener('input', onInput)
      el.removeEventListener('keydown', onKey)
      unbind(el)
    }
  }, [onscreen])

  // Draft choices by number key.
  useEffect(() => {
    if (!draft) return
    const onKey = (e: KeyboardEvent) => {
      const i = Number(e.key) - 1
      if (draft[i]) {
        e.preventDefault()
        pick(draft[i])
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [draft])

  // Lets the browser tests in development read the game state.
  useEffect(() => {
    if (import.meta.env.DEV) (window as unknown as { __nightWatch?: typeof runRef }).__nightWatch = runRef
  }, [])

  // Pause when the page is hidden.
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === 'hidden') setPaused(true)
    }
    document.addEventListener('visibilitychange', onHide)
    return () => document.removeEventListener('visibilitychange', onHide)
  }, [])

  // Fit the screen to the visible area, so the input stays above a phone keyboard.
  useEffect(() => {
    const vv = window.visualViewport
    const screen = screenRef.current
    if (!vv || !screen) return
    const apply = () => {
      screen.style.height = `${vv.height}px`
      screen.style.top = `${vv.offsetTop}px`
    }
    apply()
    vv.addEventListener('resize', apply)
    vv.addEventListener('scroll', apply)
    return () => {
      vv.removeEventListener('resize', apply)
      vv.removeEventListener('scroll', apply)
    }
  }, [])

  // Canvas size follows its container.
  useEffect(() => {
    const wrap = wrapRef.current
    const canvas = canvasRef.current
    if (!wrap || !canvas) return
    const observer = new ResizeObserver(() => {
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      const { width, height } = wrap.getBoundingClientRect()
      size.current = { w: width, h: height, dpr }
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
    })
    observer.observe(wrap)
    return () => observer.disconnect()
  }, [])

  const draw = (s: RunState) => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    const { w, h, dpr } = size.current
    if (!canvas || !ctx || w === 0) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    const { cx, cy, r } = geometry()

    const sky = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.7)
    sky.addColorStop(0, NIGHT.sky)
    sky.addColorStop(1, NIGHT.skyEdge)
    ctx.fillStyle = sky
    ctx.fillRect(0, 0, w, h)

    ctx.strokeStyle = NIGHT.ring
    ctx.lineWidth = 1
    for (const f of [1, 0.66, 0.33]) {
      ctx.beginPath()
      ctx.arc(cx, cy, r * f, 0, Math.PI * 2)
      ctx.stroke()
    }

    // Lantern light shrinks as you lose light.
    const light = Math.max(0.2, s.hp / s.maxHp)
    const glow = ctx.createRadialGradient(cx, cy, 4, cx, cy, r * 0.45 * light + 30)
    glow.addColorStop(0, `rgba(${NIGHT.glow}, 0.45)`)
    glow.addColorStop(1, `rgba(${NIGHT.glow}, 0)`)
    ctx.fillStyle = glow
    ctx.beginPath()
    ctx.arc(cx, cy, r * 0.45 * light + 30, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = NIGHT.lanternCap
    ctx.fillRect(cx - 9, cy - 20, 18, 5)
    ctx.fillRect(cx - 9, cy + 15, 18, 5)
    ctx.fillStyle = NIGHT.lantern
    ctx.beginPath()
    ctx.ellipse(cx, cy, 13, 16, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = NIGHT.text
    ctx.font = `600 13px ${FONT_JA}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('灯', cx, cy + 1)

    const typed = inputRef.current?.value ?? ''
    const targeted = prefixMatches(s, typed)
    for (const e of s.enemies) {
      const { x, y } = enemyPos(e)
      const isTarget = targeted.has(e.id)
      const fontSize = e.kind === 'boss' ? 24 : e.kind === 'oni' ? 19 : 22
      ctx.font = `600 ${fontSize}px ${FONT_JA}`
      const tw = ctx.measureText(e.prompt.display).width
      const stroke = e.kind === 'boss' ? NIGHT.boss : e.kind === 'oni' ? NIGHT.oni : NIGHT.wisp
      const fill = e.kind === 'boss' ? NIGHT.bossFill : e.kind === 'oni' ? NIGHT.oniFill : NIGHT.wispFill
      ctx.lineWidth = isTarget ? 3 : 1.5
      ctx.strokeStyle = isTarget ? NIGHT.target : stroke
      ctx.fillStyle = fill
      ctx.beginPath()
      if (e.kind === 'wisp') {
        ctx.arc(x, y, Math.max(20, tw / 2 + 10), 0, Math.PI * 2)
      } else {
        const bw = tw + 24
        const bh = fontSize + 18
        ctx.roundRect(x - bw / 2, y - bh / 2, bw, bh, bh / 2)
      }
      ctx.fill()
      ctx.stroke()
      ctx.fillStyle = NIGHT.text
      ctx.fillText(e.prompt.display, x, y + 1)
      if (e.kind === 'boss') {
        const pips = e.queue.length + 1
        for (let i = 0; i < pips; i++) {
          ctx.fillStyle = NIGHT.boss
          ctx.beginPath()
          ctx.arc(x - (pips - 1) * 6 + i * 12, y - fontSize - 6, 4, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    }

    for (const fx of effects.current) {
      const a = fx.life / fx.max
      if (fx.kind === 'beam') {
        ctx.strokeStyle = `rgba(${NIGHT.glow}, ${a})`
        ctx.lineWidth = 3 * a + 1
        ctx.beginPath()
        ctx.moveTo(fx.x, fx.y)
        ctx.lineTo(fx.tx!, fx.ty!)
        ctx.stroke()
      } else if (fx.kind === 'burst') {
        ctx.strokeStyle = `rgba(${NIGHT.glow}, ${a})`
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(fx.x, fx.y, 12 + (1 - a) * 30, 0, Math.PI * 2)
        ctx.stroke()
      } else if (fx.kind === 'float') {
        const rise = (1 - a) * 28
        ctx.globalAlpha = Math.min(1, a * 1.5)
        ctx.fillStyle = NIGHT.target
        ctx.font = `600 16px ${FONT_JA}`
        ctx.fillText(fx.text ?? '', fx.x, fx.y - 26 - rise)
        if (fx.sub) {
          ctx.fillStyle = NIGHT.muted
          ctx.font = `13px system-ui, sans-serif`
          ctx.fillText(fx.sub.length > 28 ? `${fx.sub.slice(0, 27)}…` : fx.sub, fx.x, fx.y - 8 - rise)
        }
        ctx.globalAlpha = 1
      } else if (fx.kind === 'banner') {
        ctx.globalAlpha = Math.min(1, a * 2)
        ctx.fillStyle = NIGHT.text
        ctx.font = `700 26px system-ui, sans-serif`
        ctx.fillText(fx.text ?? '', fx.x, fx.y)
        if (fx.sub) {
          ctx.fillStyle = NIGHT.boss
          ctx.font = `600 15px system-ui, sans-serif`
          ctx.fillText(fx.sub, fx.x, fx.y + 26)
        }
        ctx.globalAlpha = 1
      }
    }

    if (flash.current > 0) {
      ctx.fillStyle = `rgba(${NIGHT.hit}, ${flash.current * 0.35})`
      ctx.fillRect(0, 0, w, h)
    }
  }

  // The game loop.
  useEffect(() => {
    let raf = 0
    let last = performance.now()
    let hudClock = 0
    const loop = (t: number) => {
      const dt = Math.min(0.05, (t - last) / 1000)
      last = t
      const s = runRef.current
      if (!halted.current) {
        for (const ev of stepRun(s, dt, pool)) {
          if (ev.type === 'hit') {
            flash.current = 0.6
            setShake((n) => n + 1)
          } else if (ev.type === 'wave') {
            const { cx, cy } = geometry()
            effects.current.push({ kind: 'banner', x: cx, y: cy * 0.45, life: 2, max: 2, text: `Wave ${ev.wave}`, sub: ev.wave % 5 === 0 ? 'A boss approaches' : undefined })
          } else if (ev.type === 'revive') {
            flash.current = 0.4
          } else if (ev.type === 'over') {
            finish(s)
          }
        }
        effects.current = effects.current.filter((e) => (e.life -= dt) > 0)
        flash.current = Math.max(0, flash.current - dt)
      }
      draw(s)
      hudClock += dt
      if (hudClock > 0.12) {
        hudClock = 0
        setHud(hudOf(s))
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  const accuracy =
    over && over.kills + over.misses > 0 ? `${Math.round((over.kills / (over.kills + over.misses)) * 100)}%` : '–'

  return (
    <div className="nw-screen" ref={screenRef}>
      <div className="nw-hud">
        <div className="nw-light" aria-label={`Light ${hud.hp} of ${hud.maxHp}`}>
          {Array.from({ length: hud.maxHp }, (_, i) => (
            <span key={i} className={`nw-pip ${i < hud.hp ? 'on' : ''}`} />
          ))}
        </div>
        <div className="nw-stat">
          Wave <strong>{hud.wave}</strong>
          <span className="nw-bar">
            <span style={{ width: `${hud.waveProgress * 100}%` }} />
          </span>
        </div>
        <div className="nw-stat">
          Lv <strong>{hud.level}</strong>
          <span className="nw-bar xp">
            <span style={{ width: `${(hud.xp / hud.xpNeeded) * 100}%` }} />
          </span>
        </div>
        <div className="nw-stat nw-score">
          <strong>{hud.score.toLocaleString()}</strong>
          {hud.combo >= 3 && <span className="nw-combo">×{hud.combo}</span>}
        </div>
        <button type="button" className="nw-pause" onClick={() => setPaused(true)} aria-label="Pause">
          ❚❚
        </button>
      </div>

      <div className={`nw-field ${shake % 2 ? 'shake-a' : shake ? 'shake-b' : ''}`} ref={wrapRef} onClick={focusInput}>
        <canvas ref={canvasRef} aria-label="Night Watch field" />

        {draft && (
          <div className="nw-overlay" role="dialog" aria-label="Choose an upgrade">
            <p className="nw-overlay-title">Level up! Choose one</p>
            <div className="nw-choices">
              {draft.map((u, i) => (
                <button key={u.id} type="button" className="nw-choice" onClick={() => pick(u)}>
                  <span className="nw-choice-ja" lang="ja">
                    {u.ja}
                  </span>
                  <strong>{u.name}</strong>
                  <span className="nw-choice-level">Lv {runRef.current.upgrades[u.id] + 1}</span>
                  <span className="nw-choice-text">{u.describe(runRef.current.upgrades[u.id] + 1)}</span>
                  <kbd>{i + 1}</kbd>
                </button>
              ))}
            </div>
            {runRef.current.rerolls > 0 && (
              <button type="button" className="nw-link" onClick={reroll}>
                Reroll ({runRef.current.rerolls} left)
              </button>
            )}
          </div>
        )}

        {paused && !over && (
          <div className="nw-overlay" role="dialog" aria-label="Paused">
            <p className="nw-overlay-title">Paused</p>
            <div className="nw-buttons">
              <button
                type="button"
                className="primary"
                onClick={() => {
                  setPaused(false)
                  focusInput()
                }}
              >
                Resume
              </button>
              <button type="button" className="nw-secondary" onClick={onExit}>
                Leave the watch
              </button>
            </div>
          </div>
        )}

        {over && (
          <div className="nw-overlay nw-summary" role="dialog" aria-label="Run over">
            <p className="nw-overlay-title">The lantern went out</p>
            <div className="nw-results">
              <span>
                <strong>{over.score.toLocaleString()}</strong> points
              </span>
              <span>
                Wave <strong>{over.wave}</strong>
              </span>
              <span>
                <strong>{over.kills}</strong> banished
              </span>
              <span>
                <strong>{accuracy}</strong> accuracy
              </span>
              <span>
                Best combo <strong>{over.bestCombo}</strong>
              </span>
            </div>
            {over.score >= state.runs.best && over.score > 0 && <p className="nw-best">New best!</p>}
            {over.gotThrough.length > 0 && (
              <>
                <p className="nw-subtitle">These got through. Worth another look:</p>
                <ul className="nw-missed">
                  {[...over.gotThrough]
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 12)
                    .map((g) => (
                      <li key={`${g.prompt.display}-${g.prompt.answer}`}>
                        <span lang="ja" className="nw-missed-display">
                          {g.prompt.display}
                        </span>
                        <span lang="ja">{g.prompt.kind === 'word' ? g.prompt.answer : ''}</span>
                        <span className="nw-missed-meaning">{g.prompt.meaning ?? ''}</span>
                        {g.count > 1 && <span className="nw-missed-count">×{g.count}</span>}
                      </li>
                    ))}
                </ul>
              </>
            )}
            <div className="nw-buttons">
              <button type="button" className="primary" onClick={restart}>
                Watch again
              </button>
              <button type="button" className="nw-secondary" onClick={onExit}>
                Back
              </button>
            </div>
          </div>
        )}
      </div>

      <form
        className="nw-input-row"
        onSubmit={(e) => {
          e.preventDefault()
          tryMatch(true)
        }}
      >
        <input
          ref={inputRef}
          className="nw-input"
          lang="ja"
          placeholder={onscreen ? 'Tap the keys below' : 'Type a reading in romaji'}
          aria-label="Type a reading"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          disabled={over !== null}
          readOnly={onscreen}
          inputMode={onscreen ? 'none' : undefined}
        />
        {!onscreen && (
          <button type="submit" className="nw-enter" onPointerDown={(e) => e.preventDefault()} aria-label="Enter">
            ⏎
          </button>
        )}
      </form>
      {onscreen && over === null && <Keypad dark layout={resolveLayout(state.settings.keypadLayout)} onKey={pressKey} enterLabel="Enter" />}
    </div>
  )
}
