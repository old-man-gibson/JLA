import { isKana } from 'wanakana'
import type { CustomWord } from './types'

/** One piece of a transcribed line, as Claude returns it. */
export interface ReaderToken {
  /** Text exactly as written. */
  t: string
  /** Reading in hiragana, for tokens containing kanji. */
  r?: string
  /** Index into `words` for content words (not particles or punctuation). */
  w?: number
}

export interface ReaderLine {
  kind: 'dialogue' | 'narration' | 'sfx'
  speaker?: string
  tokens: ReaderToken[]
  translation: string
  grammar: string[]
}

export interface ReaderWord {
  surface: string
  reading: string
  lemma?: string
  lemmaReading?: string
  meaning: string
  pos?: string
}

export interface Reading {
  lines: ReaderLine[]
  words: ReaderWord[]
}

const KANJI = /\p{Script=Han}/u

export function hasKanji(text: string): boolean {
  return KANJI.test(text)
}

const str = (v: unknown): string => (typeof v === 'string' ? v.trim() : '')

/** Checks and tidies Claude's reply; anything malformed is dropped rather than trusted. */
export function validateReading(raw: unknown): Reading {
  const data = (raw && typeof raw === 'object' ? raw : {}) as { lines?: unknown; words?: unknown }
  const words: ReaderWord[] = (Array.isArray(data.words) ? data.words : []).map((w) => {
    const o = (w && typeof w === 'object' ? w : {}) as Record<string, unknown>
    return {
      surface: str(o.surface),
      reading: str(o.reading),
      lemma: str(o.lemma) || undefined,
      lemmaReading: str(o.lemmaReading) || undefined,
      meaning: str(o.meaning),
      pos: str(o.pos) || undefined,
    }
  })
  const lines: ReaderLine[] = (Array.isArray(data.lines) ? data.lines : []).flatMap((l) => {
    const o = (l && typeof l === 'object' ? l : {}) as Record<string, unknown>
    const tokens: ReaderToken[] = (Array.isArray(o.tokens) ? o.tokens : []).flatMap((tok) => {
      const t = (tok && typeof tok === 'object' ? tok : {}) as Record<string, unknown>
      const text = typeof t.t === 'string' ? t.t : ''
      if (!text) return []
      const reading = str(t.r)
      const index = typeof t.w === 'number' && Number.isInteger(t.w) && words[t.w]?.meaning ? t.w : undefined
      return [{ t: text, ...(reading && hasKanji(text) ? { r: reading } : {}), ...(index !== undefined ? { w: index } : {}) }]
    })
    if (tokens.length === 0) return []
    const kind = o.kind === 'narration' || o.kind === 'sfx' ? o.kind : 'dialogue'
    return [
      {
        kind,
        speaker: str(o.speaker) || undefined,
        tokens,
        translation: str(o.translation),
        grammar: (Array.isArray(o.grammar) ? o.grammar : []).map(str).filter(Boolean).slice(0, 3),
      },
    ]
  })
  return { lines, words }
}

export interface FuriganaPart {
  text: string
  ruby?: string
}

/**
 * Puts furigana only over the kanji: kana shared at the start or end of the
 * word and its reading stays plain (食べた/たべた → 食[た]べた, お金/おかね → お金[かね]).
 */
export function splitFurigana(text: string, reading?: string): FuriganaPart[] {
  if (!reading || !hasKanji(text) || text === reading) return [{ text }]
  let start = 0
  while (start < text.length && start < reading.length && text[start] === reading[start] && isKana(text[start])) start++
  let end = 0
  while (
    end < text.length - start &&
    end < reading.length - start &&
    text[text.length - 1 - end] === reading[reading.length - 1 - end] &&
    isKana(text[text.length - 1 - end])
  )
    end++
  const core = text.slice(start, text.length - end)
  const coreReading = reading.slice(start, reading.length - end)
  if (!core || !coreReading) return [{ text, ruby: reading }]
  const parts: FuriganaPart[] = []
  if (start > 0) parts.push({ text: text.slice(0, start) })
  parts.push({ text: core, ruby: coreReading })
  if (end > 0) parts.push({ text: text.slice(text.length - end) })
  return parts
}

/** Swaps characters our sentence markup uses for full-width lookalikes. */
function escapeMarkup(text: string): string {
  return text.replace(/[{}[\]|]/g, (c) => ({ '{': '｛', '}': '｝', '[': '［', ']': '］', '|': '｜' })[c] ?? c)
}

function partsToMarkup(parts: FuriganaPart[]): string {
  return parts.map((p) => (p.ruby ? `{${escapeMarkup(p.text)}|${escapeMarkup(p.ruby)}}` : escapeMarkup(p.text))).join('')
}

/** The line in the app's sentence markup, with the first use of `wordIndex` marked as the target. */
export function lineToSentence(line: ReaderLine, wordIndex?: number): string {
  let marked = false
  return line.tokens
    .map((tok) => {
      const markup = partsToMarkup(splitFurigana(tok.t, tok.r))
      if (!marked && wordIndex !== undefined && tok.w === wordIndex) {
        marked = true
        return `[[${markup}]]`
      }
      return markup
    })
    .join('')
}

export function lineText(line: ReaderLine): string {
  return line.tokens.map((t) => t.t).join('')
}

/** Turns a word, as it appears in a line, into a study word whose example sentence is that line. */
export function wordFromLine(
  reading: Reading,
  line: ReaderLine,
  wordIndex: number,
  source: string,
): Omit<CustomWord, 'id' | 'addedAt'> | null {
  const token = line.tokens.find((t) => t.w === wordIndex)
  const info = reading.words[wordIndex]
  if (!token || !info) return null
  const surface = escapeMarkup(token.t)
  const tokenReading = hasKanji(token.t) ? (token.r ?? info.reading) : token.t
  if (!tokenReading || hasKanji(tokenReading)) return null
  return {
    word: surface,
    reading: escapeMarkup(tokenReading),
    meaning: info.meaning,
    sentence: lineToSentence(line, wordIndex),
    translation: line.translation,
    ...(info.lemma && info.lemma !== token.t ? { lemma: info.lemma, lemmaReading: info.lemmaReading } : {}),
    source: source || 'manga',
  }
}

/** The reply format shared by the manga reader and Claude-written stories. */
const READING_FORMAT = `Reply with only JSON in this shape:
{"lines":[{"kind":"dialogue","speaker":"short description of who speaks, or omit","tokens":[{"t":"俺","r":"おれ","w":0},{"t":"は"},{"t":"腹","r":"はら","w":1},{"t":"が"},{"t":"減った","r":"へった","w":2},{"t":"！"}],"translation":"natural English","grammar":["one short beginner-friendly note on a grammar point in this line"]}],
"words":[{"surface":"減った","reading":"へった","lemma":"減る","lemmaReading":"へる","meaning":"to decrease (腹が減る = to be hungry)","pos":"verb"}]}

Rules:
- "kind" is "dialogue", "narration" or "sfx".
- The tokens of a line, joined, must equal the line exactly as written.
- Split like a dictionary would, keeping a conjugated verb or adjective with its endings as one token (減った, 食べたい, 高くない).
- Give "r" (reading in hiragana, as read in this context) only for tokens that contain kanji.
- Give "w" (an index into "words") for every content word: nouns, verbs, adjectives, adverbs, set expressions. Not for particles or punctuation. Reuse the same index when a word repeats.
- "meaning" is a short English gloss for this context. Note casual, rough or dialect forms (e.g. "casual for 私").
- At most 2 grammar notes per line, only where useful. Use [] when there's nothing worth noting.`

export function buildReaderPrompt(pastedText?: string): string {
  const what = pastedText
    ? `Here is Japanese text the learner copied from a manga:\n\n<text>\n${pastedText.slice(0, 4000)}\n</text>`
    : 'The image is a photo or scan of a manga page or panel the learner is reading.'
  return `You are helping a beginner learner of Japanese (around JLPT N5) read manga. ${what}

Transcribe every line of Japanese dialogue and narration in reading order (panels right to left, top to bottom; speech bubbles right to left). Include sound effects only when they are written in kana and clearly part of the scene. Then explain it for a beginner.

${READING_FORMAT}
- If there is no Japanese text, reply {"lines":[],"words":[]}.`
}

export interface StoryWord {
  word: string
  reading: string
  meaning: string
}

/** Asks Claude for a short graded story built from the words and grammar the learner is studying. */
export function buildStoryPrompt(options: { theme: string; words: StoryWord[]; grammar: string[] }): string {
  const words = options.words
    .slice(0, 120)
    .map((w) => `${w.word} (${w.reading}): ${w.meaning}`)
    .join('\n')
  const grammar = options.grammar.length > 0 ? ` The learner is practising: ${options.grammar.join('; ')}.` : ''
  return `You are writing a short graded story for a beginner learner of Japanese (around JLPT N5). Theme: ${options.theme}.

Write 8 to 12 short lines. Narration uses polite です/ます style; dialogue can be casual, as in manga. Use only beginner grammar.${grammar}
${words ? `Use as many of these words the learner is studying as fit naturally (word, reading, meaning):\n${words}\nOther words should be very common ones.` : 'Use only very common words.'}
Give the story a small twist or a funny ending. Make the first line the story's title, with kind "narration".

${READING_FORMAT}`
}
