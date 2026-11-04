export interface Segment {
  text: string
  /** Furigana reading, when the segment contains kanji. */
  ruby?: string
  /** True for the part of the sentence that is the word being studied. */
  target: boolean
}

const TOKEN = /\[\[|\]\]|\{([^|}]+)\|([^}]+)\}|[^[\]{]+/g

/** Parses `{漢字|かんじ}` furigana markup and `[[target]]` markers. */
export function parseSentence(source: string): Segment[] {
  const segments: Segment[] = []
  let target = false
  for (const match of source.matchAll(TOKEN)) {
    const [token, kanji, reading] = match
    if (token === '[[') target = true
    else if (token === ']]') target = false
    else if (kanji !== undefined) segments.push({ text: kanji, ruby: reading, target })
    else segments.push({ text: token, target })
  }
  return segments
}

/** The sentence as normally written (kanji, no furigana). */
export function plainText(source: string): string {
  return parseSentence(source)
    .map((s) => s.text)
    .join('')
}

/** The sentence with every kanji replaced by its reading. */
export function kanaText(source: string): string {
  return parseSentence(source)
    .map((s) => s.ruby ?? s.text)
    .join('')
}

export function targetSegments(source: string): Segment[] {
  return parseSentence(source).filter((s) => s.target)
}
