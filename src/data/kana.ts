import { toKatakana } from 'wanakana'

export type Script = 'hiragana' | 'katakana'
export type KanaGroup = 'basic' | 'dakuten' | 'combo'

export interface KanaItem {
  kana: string
  /** Accepted romaji spellings. The first one is the one we display. */
  romaji: string[]
  script: Script
  group: KanaGroup
  row: number
}

// Each cell: "<kana> <romaji> [alternative romaji...]". Hepburn first, then
// the common alternatives people type (Nihon-shiki, IME spellings).
const BASIC_ROWS = [
  'あ a|い i|う u|え e|お o',
  'か ka|き ki|く ku|け ke|こ ko',
  'さ sa|し shi si|す su|せ se|そ so',
  'た ta|ち chi ti|つ tsu tu|て te|と to',
  'な na|に ni|ぬ nu|ね ne|の no',
  'は ha|ひ hi|ふ fu hu|へ he|ほ ho',
  'ま ma|み mi|む mu|め me|も mo',
  'や ya|ゆ yu|よ yo',
  'ら ra|り ri|る ru|れ re|ろ ro',
  'わ wa|を wo o|ん n nn',
]

const DAKUTEN_ROWS = [
  'が ga|ぎ gi|ぐ gu|げ ge|ご go',
  'ざ za|じ ji zi|ず zu|ぜ ze|ぞ zo',
  'だ da|ぢ ji di dji|づ zu du dzu|で de|ど do',
  'ば ba|び bi|ぶ bu|べ be|ぼ bo',
  'ぱ pa|ぴ pi|ぷ pu|ぺ pe|ぽ po',
]

const COMBO_ROWS = [
  'きゃ kya|きゅ kyu|きょ kyo',
  'しゃ sha sya|しゅ shu syu|しょ sho syo',
  'ちゃ cha cya tya|ちゅ chu cyu tyu|ちょ cho cyo tyo',
  'にゃ nya|にゅ nyu|にょ nyo',
  'ひゃ hya|ひゅ hyu|ひょ hyo',
  'みゃ mya|みゅ myu|みょ myo',
  'りゃ rya|りゅ ryu|りょ ryo',
  'ぎゃ gya|ぎゅ gyu|ぎょ gyo',
  'じゃ ja jya zya|じゅ ju jyu zyu|じょ jo jyo zyo',
  'びゃ bya|びゅ byu|びょ byo',
  'ぴゃ pya|ぴゅ pyu|ぴょ pyo',
]

const GROUP_ROWS: Record<KanaGroup, string[]> = {
  basic: BASIC_ROWS,
  dakuten: DAKUTEN_ROWS,
  combo: COMBO_ROWS,
}

export const GROUP_LABELS: Record<KanaGroup, string> = {
  basic: 'Basic',
  dakuten: 'Dakuten (が, ぱ)',
  combo: 'Combinations (きゃ)',
}

export const SCRIPT_LABELS: Record<Script, string> = {
  hiragana: 'Hiragana',
  katakana: 'Katakana',
}

function build(): KanaItem[] {
  const items: KanaItem[] = []
  for (const script of ['hiragana', 'katakana'] as const) {
    for (const group of ['basic', 'dakuten', 'combo'] as const) {
      GROUP_ROWS[group].forEach((row, rowIndex) => {
        for (const cell of row.split('|')) {
          const [hira, ...romaji] = cell.split(' ')
          items.push({
            kana: script === 'hiragana' ? hira : toKatakana(hira),
            romaji,
            script,
            group,
            row: rowIndex,
          })
        }
      })
    }
  }
  return items
}

export const KANA: KanaItem[] = build()

export function kanaFor(scripts: Script[], groups: KanaGroup[]): KanaItem[] {
  return KANA.filter((k) => scripts.includes(k.script) && groups.includes(k.group))
}
