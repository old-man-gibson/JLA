# にほんご Nihongo

A small Japanese study app built around how memory works: kana drilled until reading is automatic, and vocabulary learned in sentences with typed recall and spaced repetition.

## What it does

- **Kana drill.** See a kana, type its romaji. Hiragana and katakana, including dakuten (が, ぱ) and combinations (きゃ), 104 per script. A kana counts as *fluent* after 3 correct answers in a row, each under 3 seconds. Drills favour kana you miss or hesitate on, and a missed kana comes back a few cards later.
- **Vocabulary reviews.** Each word has two cards:
  - *Read it*: the word highlighted in an example sentence. Recall the reading and meaning, reveal, then grade yourself.
  - *Type it*: the meaning, plus the sentence with the word blanked out. Type the Japanese (romaji turns into kana as you type). The answer is checked automatically.
- **Scheduling** uses [FSRS](https://github.com/open-spaced-repetition/ts-fsrs), the algorithm Anki now uses, targeting 90% recall. Grade buttons show when you'll see the card next.
- **Furigana that fades.** By default it appears on the question side until a card is mature (interval of 21+ days), then only on the answer.
- **Audio** through the browser's Japanese text-to-speech voice.
- **Progress stats** that measure learning rather than streaks: words known and mature, recall rate over 30 days, and fluent kana.
- **Backups.** Export and import a JSON file of your progress.

The starter deck has 62 common beginner words, each with a hand-written example sentence (`src/data/deck.ts`). A test checks every sentence's markup against its word's reading.

## Running it

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # unit tests (vitest)
npm run build      # static site in dist/
```

`npm run build` produces a static site you can host anywhere, for example GitHub Pages, Netlify or Cloudflare Pages.

### As a claude.ai artifact

```bash
npm run build:artifact -- path/to/page.html
```

This inlines the app into one file in the form claude.ai artifacts expect. In that setting, progress also syncs to the viewer's private artifact storage (`src/lib/cloud.ts`). Everywhere else it is saved in `localStorage` only.

## Layout

| Path | What's there |
| --- | --- |
| `src/data/kana.ts` | Kana table with accepted romaji spellings (shi/si, tsu/tu, …) |
| `src/data/deck.ts` | Starter vocabulary. Sentence markup: `{漢字\|かんじ}` adds furigana, `[[…]]` marks the target word |
| `src/lib/srs.ts` | FSRS wrapper, study queue (learning cards first, then reviews, then new), stats |
| `src/lib/answer.ts` | Answer checking. Readings are compared in katakana so the long-vowel mark survives (コーヒー) |
| `src/lib/kanaDrill.ts` | Kana fluency rules and weighted session picking |
| `src/lib/store.ts` | Load/save/backup of the app state |
| `src/lib/cloud.ts` | Optional sync when running as a claude.ai artifact |
| `src/views/` | Today, Review, Kana, Words, Settings screens |

## Roadmap

1. **Reader.** Paste Japanese text, split it into words with a tokenizer ([kuromoji](https://github.com/takuyaa/kuromoji.js) or Sudachi), tap a word to see its meaning from [JMdict](https://www.edrdg.org/jmdict/j_jmdict.html), and add it to reviews. This links studying to real Japanese.
2. **Bigger deck.** Build a frequency-ordered deck with example sentences from [Tatoeba](https://tatoeba.org) (CC BY). JMdict and KANJIDIC are CC BY-SA and need attribution.
3. **Kanji.** Component breakdowns ([KanjiVG](https://kanjivg.tagaini.net) for stroke order), always tied to vocabulary you're learning.
4. **Pitch accent and better audio.** Pitch data from Kanjium, recorded or [VOICEVOX](https://voicevox.hiroshiba.jp) audio, and a shadowing mode.
5. **Particle drills** (は/が, に/で) as their own card type.
