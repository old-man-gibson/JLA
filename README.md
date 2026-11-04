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
- **Manga reader.** Photograph a manga page (or paste text). Claude transcribes it line by line with furigana, word meanings and short grammar notes. Translations stay hidden until you ask, so you try reading first. Tap a word to add it to your reviews; its example sentence becomes the actual line from your manga. (Needs the claude.ai version, where it runs on your own Claude account.)
- **Decks.** *Starter* (62 everyday words) and *Adventurer* (45 fantasy and isekai words: 勇者, 魔法, 冒険者, 経験値…). New words alternate between enabled decks, and words you add from manga come first. Every built-in sentence is checked by a test against its word's reading.
- **Guild (idle).** Every card you've learned is an adventurer earning gold. Income grows with how well you know the card (FSRS stability), and overdue cards rest and earn nothing until reviewed, so the idle loop rewards reviewing on time rather than grinding. Gold piles up for at most 24 hours. Guild rank goes from F to S with mature cards. Gold buys buildings and permanent Night Watch upgrades.
- **Night Watch (survivors-like).** Yokai carrying kana and words you've already met drift toward your lantern; type their readings to banish them. Waves speed up, level-ups offer a draft of upgrades, and every fifth wave brings a boss carrying three words. The end screen lists what got through. It never changes your review schedule.

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

This inlines the app into one file in the form claude.ai artifacts expect. Publish it with the `db`, `user`, `downloads` and `sample` (with images) capabilities. In that setting progress also syncs to the viewer's private artifact storage, and the manga reader asks Claude on the viewer's account (`src/lib/cloud.ts`). Everywhere else progress is saved in `localStorage` only and the reader is unavailable.

## Layout

| Path | What's there |
| --- | --- |
| `src/data/kana.ts` | Kana table with accepted romaji spellings (shi/si, tsu/tu, …) |
| `src/data/deck.ts`, `src/data/adventurer.ts` | Starter and Adventurer decks. Sentence markup: `{漢字\|かんじ}` adds furigana, `[[…]]` marks the target word |
| `src/data/decks.ts`, `src/lib/words.ts` | Deck registry, introduction order, manga words |
| `src/lib/reader.ts` | Manga reader prompt, reply validation, furigana splitting, turning a line into a card |
| `src/lib/guild.ts` | Idle income, ranks, buildings and perks |
| `src/lib/run.ts` | Night Watch rules: spawning, answer matching, upgrades |
| `src/lib/srs.ts` | FSRS wrapper, study queue (learning cards first, then reviews, then new), stats |
| `src/lib/answer.ts` | Answer checking. Readings are compared in katakana so the long-vowel mark survives (コーヒー) |
| `src/lib/kanaDrill.ts` | Kana fluency rules and weighted session picking |
| `src/lib/store.ts` | Load/save/backup of the app state |
| `src/lib/cloud.ts` | Optional sync when running as a claude.ai artifact |
| `src/views/` | Today, Review, Read, Kana, Play (guild), Night Watch, Words, Settings screens |

## Roadmap

1. **Offline reader.** A dictionary-based fallback for the reader outside claude.ai: split text with a tokenizer ([kuromoji](https://github.com/takuyaa/kuromoji.js) or Sudachi) and look words up in [JMdict](https://www.edrdg.org/jmdict/j_jmdict.html).
2. **Bigger deck.** Build a frequency-ordered deck with example sentences from [Tatoeba](https://tatoeba.org) (CC BY). JMdict and KANJIDIC are CC BY-SA and need attribution.
3. **Kanji.** Component breakdowns ([KanjiVG](https://kanjivg.tagaini.net) for stroke order), always tied to vocabulary you're learning.
4. **Pitch accent and better audio.** Pitch data from Kanjium, recorded or [VOICEVOX](https://voicevox.hiroshiba.jp) audio, and a shadowing mode.
5. **Particle drills** (は/が, に/で) as their own card type.
