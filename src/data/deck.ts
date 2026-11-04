export interface Word {
  /** Stable id. The written form is unique within the deck, so we use it. */
  id: string
  word: string
  reading: string
  meaning: string
  /**
   * Example sentence. `{漢字|かんじ}` adds furigana, and `[[...]]` marks the
   * target word, which is the part hidden on "type the Japanese" cards.
   */
  sentence: string
  translation: string
  /** Dictionary form, when the word appears conjugated in its sentence (manga words). */
  lemma?: string
  lemmaReading?: string
  /** Where a word the learner added came from, e.g. a manga title. */
  source?: string
}

export type Row = [word: string, reading: string, meaning: string, sentence: string, translation: string]

// A hand-written starter deck of very common beginner (JLPT N5-level) words,
// roughly ordered by usefulness. It is meant to be replaced by a larger
// frequency-ordered deck built from open data (see README).
const ROWS: Row[] = [
  ['私', 'わたし', 'I, me', '[[{私|わたし}]]は{学生|がくせい}です。', 'I am a student.'],
  ['人', 'ひと', 'person', '{駅|えき}に[[{人|ひと}]]がたくさんいる。', 'There are a lot of people at the station.'],
  ['何', 'なに', 'what', '[[{何|なに}]]を{食|た}べたいですか。', 'What do you want to eat?'],
  ['今日', 'きょう', 'today', '[[{今日|きょう}]]は{暑|あつ}い。', 'It is hot today.'],
  ['食べる', 'たべる', 'to eat', '{毎朝|まいあさ}パンを[[{食|た}べる]]。', 'I eat bread every morning.'],
  ['飲む', 'のむ', 'to drink', '{毎日|まいにち}{水|みず}をたくさん[[{飲|の}む]]。', 'I drink a lot of water every day.'],
  ['行く', 'いく', 'to go', '{明日|あした}{学校|がっこう}に[[{行|い}く]]。', 'I am going to school tomorrow.'],
  ['来る', 'くる', 'to come', '{友達|ともだち}が{家|いえ}に[[{来|く}る]]。', 'A friend is coming to my house.'],
  ['見る', 'みる', 'to see, to watch', '{夜|よる}にテレビを[[{見|み}る]]。', 'I watch TV at night.'],
  ['する', 'する', 'to do', '{週末|しゅうまつ}はテニスを[[する]]。', 'I play tennis on weekends.'],
  ['ある', 'ある', 'to exist, to be (things)', '{机|つくえ}の{上|うえ}に{本|ほん}が[[ある]]。', 'There is a book on the desk.'],
  ['いる', 'いる', 'to exist, to be (people, animals)', '{公園|こうえん}に{子供|こども}が[[いる]]。', 'There are children in the park.'],
  ['水', 'みず', 'water', '[[{水|みず}]]を{飲|の}みたい。', 'I want to drink water.'],
  ['学生', 'がくせい', 'student', '{兄|あに}は[[{学生|がくせい}]]です。', 'My older brother is a student.'],
  ['先生', 'せんせい', 'teacher', '[[{先生|せんせい}]]はとても{優|やさ}しい。', 'The teacher is very kind.'],
  ['友達', 'ともだち', 'friend', '{今日|きょう}は[[{友達|ともだち}]]と{映画|えいが}を{見|み}る。', 'Today I am watching a movie with a friend.'],
  ['明日', 'あした', 'tomorrow', '[[{明日|あした}]]は{雨|あめ}です。', 'It will rain tomorrow.'],
  ['昨日', 'きのう', 'yesterday', '[[{昨日|きのう}]]、{駅|えき}で{先生|せんせい}に{会|あ}った。', 'Yesterday I ran into my teacher at the station.'],
  ['今', 'いま', 'now', '[[{今|いま}]]、{何時|なんじ}ですか。', 'What time is it now?'],
  ['時間', 'じかん', 'time', '[[{時間|じかん}]]がない。', 'I do not have time.'],
  ['誰', 'だれ', 'who', 'あの{人|ひと}は[[{誰|だれ}]]ですか。', 'Who is that person?'],
  ['どこ', 'どこ', 'where', 'トイレは[[どこ]]ですか。', 'Where is the restroom?'],
  ['日本', 'にほん', 'Japan', '[[{日本|にほん}]]に{行|い}きたい。', 'I want to go to Japan.'],
  ['日本語', 'にほんご', 'Japanese (language)', '[[{日本語|にほんご}]]を{勉強|べんきょう}している。', 'I am studying Japanese.'],
  ['家', 'いえ', 'house, home', '{私|わたし}の[[{家|いえ}]]は{駅|えき}から{近|ちか}い。', 'My house is close to the station.'],
  ['学校', 'がっこう', 'school', '[[{学校|がっこう}]]は{八時|はちじ}に{始|はじ}まる。', 'School starts at eight.'],
  ['駅', 'えき', 'station', '[[{駅|えき}]]はどこですか。', 'Where is the station?'],
  ['電車', 'でんしゃ', 'train', '[[{電車|でんしゃ}]]で{会社|かいしゃ}に{行|い}く。', 'I go to the office by train.'],
  ['会社', 'かいしゃ', 'company, office', '{父|ちち}は[[{会社|かいしゃ}]]で{働|はたら}いている。', 'My father works at a company.'],
  ['仕事', 'しごと', 'work, job', '[[{仕事|しごと}]]は{六時|ろくじ}に{終|お}わる。', 'Work ends at six.'],
  ['分かる', 'わかる', 'to understand', '{日本語|にほんご}が{少|すこ}し[[{分|わ}かる]]。', 'I understand a little Japanese.'],
  ['話す', 'はなす', 'to speak, to talk', '{母|はは}と{電話|でんわ}で[[{話|はな}す]]。', 'I talk with my mother on the phone.'],
  ['聞く', 'きく', 'to listen, to ask', '{毎日|まいにち}{音楽|おんがく}を[[{聞|き}く]]。', 'I listen to music every day.'],
  ['言う', 'いう', 'to say', '{本当|ほんとう}のことを[[{言|い}う]]のは{難|むずか}しい。', 'Telling the truth is hard.'],
  ['読む', 'よむ', 'to read', '{寝|ね}る{前|まえ}に{本|ほん}を[[{読|よ}む]]。', 'I read a book before going to sleep.'],
  ['書く', 'かく', 'to write', '{毎晩|まいばん}{日記|にっき}を[[{書|か}く]]。', 'I write in my diary every night.'],
  ['買う', 'かう', 'to buy', 'コンビニで{水|みず}を[[{買|か}う]]。', 'I buy water at the convenience store.'],
  ['待つ', 'まつ', 'to wait', '{駅|えき}で{友達|ともだち}を[[{待|ま}つ]]。', 'I wait for my friend at the station.'],
  ['本', 'ほん', 'book', 'この[[{本|ほん}]]はおもしろい。', 'This book is interesting.'],
  ['名前', 'なまえ', 'name', 'お[[{名前|なまえ}]]は{何|なん}ですか。', 'What is your name?'],
  ['大きい', 'おおきい', 'big', 'この{犬|いぬ}は[[{大|おお}きい]]。', 'This dog is big.'],
  ['小さい', 'ちいさい', 'small', '{妹|いもうと}の{手|て}は[[{小|ちい}さい]]。', 'My little sister’s hands are small.'],
  ['高い', 'たかい', 'expensive; tall, high', 'この{時計|とけい}は[[{高|たか}い]]。', 'This watch is expensive.'],
  ['安い', 'やすい', 'cheap', 'あの{店|みせ}は[[{安|やす}い]]。', 'That shop is cheap.'],
  ['新しい', 'あたらしい', 'new', '[[{新|あたら}しい]]{靴|くつ}を{買|か}った。', 'I bought new shoes.'],
  ['古い', 'ふるい', 'old (things)', 'この{建物|たてもの}は[[{古|ふる}い]]。', 'This building is old.'],
  ['いい', 'いい', 'good', '[[いい]]{天気|てんき}ですね。', 'Nice weather, isn’t it?'],
  ['好き', 'すき', 'liked; to like', '{私|わたし}は{猫|ねこ}が[[{好|す}き]]です。', 'I like cats.'],
  ['楽しい', 'たのしい', 'fun, enjoyable', '{友達|ともだち}と{話|はな}すのは[[{楽|たの}しい]]。', 'Talking with friends is fun.'],
  ['難しい', 'むずかしい', 'difficult', '{漢字|かんじ}は[[{難|むずか}しい]]。', 'Kanji is difficult.'],
  ['毎日', 'まいにち', 'every day', '[[{毎日|まいにち}]]{日本語|にほんご}を{勉強|べんきょう}する。', 'I study Japanese every day.'],
  ['天気', 'てんき', 'weather', '{明日|あした}の[[{天気|てんき}]]はどうですか。', 'How is the weather tomorrow?'],
  ['雨', 'あめ', 'rain', '{朝|あさ}から[[{雨|あめ}]]が{降|ふ}っている。', 'It has been raining since this morning.'],
  ['猫', 'ねこ', 'cat', '[[{猫|ねこ}]]がソファで{寝|ね}ている。', 'A cat is sleeping on the sofa.'],
  ['犬', 'いぬ', 'dog', '{隣|となり}の[[{犬|いぬ}]]はよく{吠|ほ}える。', 'The neighbor’s dog barks a lot.'],
  ['店', 'みせ', 'shop, store', 'この[[{店|みせ}]]は{十時|じゅうじ}に{開|あ}く。', 'This shop opens at ten.'],
  ['車', 'くるま', 'car', '{父|ちち}の[[{車|くるま}]]は{白|しろ}い。', 'My father’s car is white.'],
  ['お金', 'おかね', 'money', '{今月|こんげつ}は[[お{金|かね}]]がない。', 'I have no money this month.'],
  ['電話', 'でんわ', 'telephone; phone call', '{後|あと}で[[{電話|でんわ}]]します。', 'I will call you later.'],
  ['朝ご飯', 'あさごはん', 'breakfast', '[[{朝|あさ}ご{飯|はん}]]を{食|た}べた？', 'Did you eat breakfast?'],
  ['コーヒー', 'コーヒー', 'coffee', '[[コーヒー]]が{好|す}きです。', 'I like coffee.'],
  ['テレビ', 'テレビ', 'TV', '[[テレビ]]を{消|け}してください。', 'Please turn off the TV.'],
]

export function wordsFromRows(rows: Row[]): Word[] {
  return rows.map(([word, reading, meaning, sentence, translation]) => ({
    id: word,
    word,
    reading,
    meaning,
    sentence,
    translation,
  }))
}

export const STARTER_WORDS: Word[] = wordsFromRows(ROWS)
