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
- **On-screen romaji keys** on touch screens, laid out in the page so the phone's keyboard never covers the card or the game. Settings can switch back to the device keyboard (for example a Japanese flick keyboard).
- **Manga reader.** Photograph a manga page (or paste text). Claude transcribes it line by line with furigana, word meanings and short grammar notes. Translations stay hidden until you ask, so you try reading first. Tap a word to add it to your reviews; its example sentence becomes the actual line from your manga. (Needs the claude.ai version, where it runs on your own Claude account.)
- **Grammar.** 30 grammar points: 18 at JLPT N5 and 12 at N4 (から/ので, ながら, てもいい, てはいけない, なければならない, たことがある, と思う, より/のほうが, つもり, potential form, 前に/後で, たり). The 18 N5 points come in a learning order (こそあど, は, です, の, か/ね/よ, も, が, を, ます, に, で, と, い/な-adjectives, たい, てください, ている, ましょう), each with a short explanation, examples with audio and 4–5 fill-the-gap exercises. Starting a point adds its exercises to the review queue, scheduled like words.
- **Practice.** Verb and adjective forms (type 書く → 書いて, 高い → 高くない, with the rule after each answer; a conjugation engine covers every deck verb and adjective, irregulars included) and listening rounds (hear a word or sentence you know, pick its meaning).
- **Undo** for the last answer in reviews.
- **Stories.** Six short graded stories (daily life and fantasy) with furigana, audio and hidden translations. In the claude.ai version, Claude writes new stories from the words you've started and the grammar you're practising, with tappable words you can add to your reviews.
- **Decks.** *Starter* (138 everyday words) and *Adventurer* (45 fantasy and isekai words: 勇者, 魔法, 冒険者, 経験値…). New words alternate between enabled decks, and words you add from manga come first. Every built-in sentence is checked by a test against its word's reading.
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

## Android app

The APK is a thin Android shell (`android/`) around the web app on GitHub Pages, so **the app updates whenever this repository does**: every push to `main` runs the tests and redeploys the site (`.github/workflows/pages.yml`), and the app picks up the new version the next time it opens. After the first launch it also works offline. The shell adds Android text-to-speech, backup saving and file picking.

The shell itself rarely changes. When it does, bump `versionCode` in `android/app/build.gradle`; `.github/workflows/android.yml` builds a new APK and publishes it as a release, and the app shows a banner offering the download.

### One-time setup

1. **Turn on Pages:** Settings → Pages → Build and deployment → Source: **GitHub Actions**.
2. **Add the signing password:** Settings → Secrets and variables → Actions → New repository secret named `JLA_KEYSTORE_PASSWORD`, with a long random value (a password manager's generator is ideal). On its first run the Android workflow creates the app's signing key, locked with this password, and commits it as `android/release.p12`. Android only accepts an update signed with the same key, so don't change the password or delete that file.
3. **Run both workflows once:** Actions → *Deploy web app* → Run workflow, then Actions → *Build Android app* → Run workflow.

### Installing

On your phone, open [the latest release](https://github.com/old-man-gibson/JLA/releases/latest), download `JLA.apk`, and allow your browser to install apps when Android asks.

Notes:

- Progress is stored on the phone, separately from the claude.ai version. Move it with Settings → Download backup / Restore from file.
- The manga reader needs Claude, so it only works in the claude.ai version.
- Alternatively, open the Pages site in Chrome and choose *Add to Home screen*: it installs the same app without an APK.

## Layout

| Path | What's there |
| --- | --- |
| `src/data/kana.ts` | Kana table with accepted romaji spellings (shi/si, tsu/tu, …) |
| `src/data/grammar.ts`, `src/data/stories.ts` | Grammar lessons and exercises, graded stories |
| `src/data/deck.ts`, `src/data/everyday.ts`, `src/data/adventurer.ts` | Starter (two parts) and Adventurer decks. Sentence markup: `{漢字\|かんじ}` adds furigana, `[[…]]` marks the target word |
| `src/data/decks.ts`, `src/lib/words.ts` | Deck registry, introduction order, manga words |
| `src/lib/reader.ts` | Manga reader prompt, reply validation, furigana splitting, turning a line into a card |
| `src/lib/guild.ts` | Idle income, ranks, buildings and perks |
| `src/lib/run.ts` | Night Watch rules: spawning, answer matching, upgrades |
| `src/lib/conjugate.ts`, `src/data/wordClasses.ts` | Conjugation engine and the verb/adjective class of each deck word |
| `src/lib/srs.ts` | FSRS wrapper, study queue (learning cards first, then reviews, then new), stats |
| `src/lib/answer.ts` | Answer checking. Readings are compared in katakana so the long-vowel mark survives (コーヒー) |
| `src/lib/kanaDrill.ts` | Kana fluency rules and weighted session picking |
| `src/lib/store.ts` | Load/save/backup of the app state |
| `src/lib/cloud.ts` | Optional sync when running as a claude.ai artifact |
| `src/lib/typing.ts`, `src/components/Keypad.tsx` | On-screen romaji keyboard |
| `src/lib/platform.ts`, `public/sw.js` | Android shell bridge, offline support for the Pages site |
| `android/` | Android shell (Java, no third-party dependencies) |
| `.github/workflows/` | Deploy to Pages on every push; build and release the APK |
| `src/views/` | Today, Review, Learn (Kana, Grammar, Practice, Stories), Read, Play (guild), Night Watch, Words, Settings screens |

## Roadmap

1. **Offline reader.** A dictionary-based fallback for the reader outside claude.ai: split text with a tokenizer ([kuromoji](https://github.com/takuyaa/kuromoji.js) or Sudachi) and look words up in [JMdict](https://www.edrdg.org/jmdict/j_jmdict.html).
2. **Bigger deck.** Build a frequency-ordered deck with example sentences from [Tatoeba](https://tatoeba.org) (CC BY). JMdict and KANJIDIC are CC BY-SA and need attribution.
3. **Kanji.** Component breakdowns ([KanjiVG](https://kanjivg.tagaini.net) for stroke order), always tied to vocabulary you're learning.
4. **Pitch accent and better audio.** Pitch data from Kanjium, recorded or [VOICEVOX](https://voicevox.hiroshiba.jp) audio, and a shadowing mode.
5. **Sync between the Android app and the claude.ai version**, which currently keep separate progress.
