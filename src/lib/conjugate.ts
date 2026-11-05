// Conjugation for the verbs and い-adjectives in the decks. Works on both the
// written form and the reading: the kanji stem stays, the kana ending changes
// (書く/かく → 書いて/かいて).

export type VerbClass = 'godan' | 'ichidan' | 'suru' | 'kuru' | 'iku' | 'aru'
export type WordClass = VerbClass | 'i-adj' | 'ii'

export type FormId =
  | 'masu'
  | 'masen'
  | 'mashita'
  | 'te'
  | 'ta'
  | 'nai'
  | 'nakatta'
  | 'tai'
  | 'adj-nai'
  | 'adj-katta'
  | 'adj-nakatta'
  | 'adj-te'

export interface FormInfo {
  id: FormId
  label: string
  /** Short name in Japanese grammar terms. */
  ja: string
  for: 'verb' | 'adjective'
}

export const FORMS: FormInfo[] = [
  { id: 'masu', label: 'Polite', ja: '〜ます', for: 'verb' },
  { id: 'masen', label: 'Polite negative', ja: '〜ません', for: 'verb' },
  { id: 'mashita', label: 'Polite past', ja: '〜ました', for: 'verb' },
  { id: 'te', label: 'て-form', ja: '〜て', for: 'verb' },
  { id: 'ta', label: 'Plain past', ja: '〜た', for: 'verb' },
  { id: 'nai', label: 'Plain negative', ja: '〜ない', for: 'verb' },
  { id: 'nakatta', label: 'Plain past negative', ja: '〜なかった', for: 'verb' },
  { id: 'tai', label: 'Want to', ja: '〜たい', for: 'verb' },
  { id: 'adj-nai', label: 'Negative', ja: '〜くない', for: 'adjective' },
  { id: 'adj-katta', label: 'Past', ja: '〜かった', for: 'adjective' },
  { id: 'adj-nakatta', label: 'Past negative', ja: '〜くなかった', for: 'adjective' },
  { id: 'adj-te', label: 'て-form (and…)', ja: '〜くて', for: 'adjective' },
]

export const FORM_BY_ID = Object.fromEntries(FORMS.map((f) => [f.id, f])) as Record<FormId, FormInfo>

// Godan endings: the u-row kana and its i-row (ます stem) and a-row (ない stem).
const I_ROW: Record<string, string> = { う: 'い', く: 'き', ぐ: 'ぎ', す: 'し', つ: 'ち', ぬ: 'に', ぶ: 'び', む: 'み', る: 'り' }
const A_ROW: Record<string, string> = { う: 'わ', く: 'か', ぐ: 'が', す: 'さ', つ: 'た', ぬ: 'な', ぶ: 'ば', む: 'ま', る: 'ら' }
const TE: Record<string, string> = { う: 'って', つ: 'って', る: 'って', く: 'いて', ぐ: 'いで', す: 'して', ぬ: 'んで', ぶ: 'んで', む: 'んで' }

function swapEnding(text: string, from: number, ending: string): string {
  return text.slice(0, text.length - from) + ending
}

/** The ending for a form, applied to whatever comes before the dictionary ending. */
function verbEnding(cls: VerbClass, last: string, form: FormId): { cut: number; add: string } {
  if (cls === 'ichidan') {
    const add = { masu: 'ます', masen: 'ません', mashita: 'ました', te: 'て', ta: 'た', nai: 'ない', nakatta: 'なかった', tai: 'たい' }[form as string]
    return { cut: 1, add: add ?? '' }
  }
  if (cls === 'suru') {
    const add = { masu: 'します', masen: 'しません', mashita: 'しました', te: 'して', ta: 'した', nai: 'しない', nakatta: 'しなかった', tai: 'したい' }[form as string]
    return { cut: 2, add: add ?? '' }
  }
  // godan, iku and aru share most forms
  const stemI = I_ROW[last]
  const stemA = A_ROW[last]
  const te = cls === 'iku' ? 'って' : TE[last]
  const ta = te.replace(/て$/, 'た').replace(/で$/, 'だ')
  switch (form) {
    case 'masu':
      return { cut: 1, add: `${stemI}ます` }
    case 'masen':
      return { cut: 1, add: `${stemI}ません` }
    case 'mashita':
      return { cut: 1, add: `${stemI}ました` }
    case 'tai':
      return { cut: 1, add: `${stemI}たい` }
    case 'te':
      return { cut: 1, add: te }
    case 'ta':
      return { cut: 1, add: ta }
    case 'nai':
      return cls === 'aru' ? { cut: 2, add: 'ない' } : { cut: 1, add: `${stemA}ない` }
    case 'nakatta':
      return cls === 'aru' ? { cut: 2, add: 'なかった' } : { cut: 1, add: `${stemA}なかった` }
    default:
      return { cut: 0, add: '' }
  }
}

// 来る changes its reading (き/こ) as well as its ending, so it's spelled out.
const KURU: Partial<Record<FormId, [word: string, reading: string]>> = {
  masu: ['来ます', 'きます'],
  masen: ['来ません', 'きません'],
  mashita: ['来ました', 'きました'],
  te: ['来て', 'きて'],
  ta: ['来た', 'きた'],
  nai: ['来ない', 'こない'],
  nakatta: ['来なかった', 'こなかった'],
  tai: ['来たい', 'きたい'],
}

export interface Conjugated {
  word: string
  reading: string
}

export function conjugate(word: string, reading: string, cls: WordClass, form: FormId): Conjugated | null {
  const info = FORM_BY_ID[form]
  const isAdjective = cls === 'i-adj' || cls === 'ii'
  if ((info.for === 'adjective') !== isAdjective) return null
  if (cls === 'kuru') {
    const f = KURU[form]
    return f ? { word: f[0], reading: f[1] } : null
  }
  if (isAdjective) {
    // いい takes its forms from よい.
    const baseWord = cls === 'ii' ? 'よい' : word
    const baseReading = cls === 'ii' ? 'よい' : reading
    const add = { 'adj-nai': 'くない', 'adj-katta': 'かった', 'adj-nakatta': 'くなかった', 'adj-te': 'くて' }[form as string]
    if (!add) return null
    return { word: swapEnding(baseWord, 1, add), reading: swapEnding(baseReading, 1, add) }
  }
  const last = reading.slice(-1)
  if (cls !== 'ichidan' && cls !== 'suru' && !I_ROW[last]) return null
  const { cut, add } = verbEnding(cls, last, form)
  if (!add) return null
  return { word: swapEnding(word, cut, add), reading: swapEnding(reading, cut, add) }
}

/** A one-line reminder of the rule behind a form, shown after answering. */
export function explainForm(reading: string, cls: WordClass, form: FormId): string {
  const last = reading.slice(-1)
  if (cls === 'kuru') return '来る is irregular: き in most forms (きます, きて, きた), こ before ない (こない).'
  if (cls === 'suru') return 'する is irregular: します, して, した, しない.'
  if (cls === 'ii') return 'いい is irregular: its forms come from よい (よくない, よかった).'
  if (cls === 'i-adj') {
    return {
      'adj-nai': 'い-adjectives: drop い, add くない.',
      'adj-katta': 'い-adjectives: drop い, add かった.',
      'adj-nakatta': 'い-adjectives: drop い, add くなかった.',
      'adj-te': 'い-adjectives: drop い, add くて to link to what comes next.',
    }[form as string] ?? ''
  }
  if (cls === 'ichidan') return 'る-verb (ichidan): drop る and add the ending.'
  const stemNote = `う-verb (godan): ${last} → ${I_ROW[last]} before ます and たい, ${A_ROW[last]} before ない.`
  if (form === 'te' || form === 'ta') {
    if (cls === 'iku') return '行く is the one exception: 行って, 行った (not 行いて).'
    const te = TE[last]
    return `う-verb ending in ${last}: ${last} → ${form === 'te' ? te : te.replace(/て$/, 'た').replace(/で$/, 'だ')}.`
  }
  if (cls === 'aru' && (form === 'nai' || form === 'nakatta')) return 'ある is irregular in the negative: ない, なかった (never あらない).'
  return stemNote
}
