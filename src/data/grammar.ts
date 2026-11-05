// Beginner (JLPT N5) grammar: short explanations, examples, and fill-the-gap
// exercises. Sentences use the deck markup: {漢字|かんじ} for furigana and
// [[…]] around the answer, which is hidden in the exercise. Options use the
// same furigana markup, and one of them is exactly the [[…]] text. The
// translation is always shown, so it decides between forms (です or でした).

export interface GrammarExample {
  sentence: string
  translation: string
}

export interface GrammarExercise {
  id: string
  sentence: string
  options: string[]
  translation: string
  /** Shown after answering: why this answer. */
  why: string
}

export type GrammarLevel = 'N5' | 'N4'

export interface GrammarPoint {
  id: string
  /** JLPT level: N5 is the first level, N4 the next. */
  level: GrammarLevel
  title: string
  /** The pattern in Japanese, shown big. */
  ja: string
  summary: string
  explanation: string[]
  examples: GrammarExample[]
  exercises: GrammarExercise[]
}

type Ex = [sentence: string, options: string[], translation: string, why: string]

function point(
  id: string,
  title: string,
  ja: string,
  summary: string,
  explanation: string[],
  examples: [string, string][],
  exercises: Ex[],
  level: GrammarLevel = 'N5',
): GrammarPoint {
  return {
    id,
    level,
    title,
    ja,
    summary,
    explanation,
    examples: examples.map(([sentence, translation]) => ({ sentence, translation })),
    exercises: exercises.map(([sentence, options, translation, why], i) => ({
      id: `g:${id}:${i + 1}`,
      sentence,
      options,
      translation,
      why,
    })),
  }
}

export const GRAMMAR: GrammarPoint[] = [
  point(
    'kosoado',
    'This, that, which',
    'これ・この・ここ',
    'こ- is near me, そ- is near you, あ- is far from us both, ど- asks which.',
    [
      'Japanese builds "this / that / which" words from four starts: こ (near the speaker), そ (near the listener), あ (far from both) and ど (question).',
      'これ, それ, あれ, どれ stand alone ("this one"). この, その, あの, どの need a noun after them ("this book"). ここ, そこ, あそこ, どこ are places.',
    ],
    [
      ['これは{私|わたし}の{本|ほん}です。', 'This is my book.'],
      ['あの{人|ひと}は{先生|せんせい}です。', 'That person over there is a teacher.'],
    ],
    [
      ['[[これ]]は{私|わたし}のペンです。', ['これ', 'この', 'ここ'], 'This is my pen.', 'これ stands alone as "this one". この always needs a noun after it: このペン.'],
      ['[[この]]{本|ほん}はおもしろいです。', ['この', 'これ', 'ここ'], 'This book is interesting.', 'この comes right before a noun: この本 = this book.'],
      ['トイレは[[どこ]]ですか。', ['どこ', 'どれ', 'どの'], 'Where is the restroom?', 'どこ asks about a place. どれ asks which thing.'],
      ['[[あの]]{人|ひと}は{誰|だれ}ですか。', ['あの', 'あれ', 'あそこ'], 'Who is that person over there?', 'あ- is for things far from both of you, and あの needs a noun: あの人.'],
      ['[[それ]]をください。', ['それ', 'その', 'そこ'], 'I’ll take that one, please.', 'それ is "that one" near the listener, standing alone.'],
    ],
  ),
  point(
    'wa',
    'Topic marker は',
    'X は Y です',
    'は marks what the sentence is about. Written は, read わ.',
    [
      'は (pronounced わ) marks the topic: what you are talking about. XはYです means "As for X, it is Y", or simply "X is Y".',
      'The topic is often something already known in the conversation. Once it is clear, Japanese usually drops it: (私は) 学生です.',
    ],
    [
      ['{私|わたし}は{学生|がくせい}です。', 'I am a student.'],
      ['{今日|きょう}は{暑|あつ}いです。', 'It is hot today.'],
    ],
    [
      ['{私|わたし}[[は]]{学生|がくせい}です。', ['は', 'を', 'に'], 'I am a student.', '私 is the topic: XはYです means "X is Y".'],
      ['{今日|きょう}[[は]]{暑|あつ}いです。', ['は', 'を', 'で'], 'It’s hot today.', '今日 is the topic: "as for today, it’s hot".'],
      ['これ[[は]]{私|わたし}の{本|ほん}です。', ['は', 'を', 'へ'], 'This is my book.', 'これ is what the sentence is about, so it takes は.'],
      ['{田中|たなか}さん[[は]]{先生|せんせい}ですか。', ['は', 'を', 'に'], 'Is Tanaka a teacher?', 'Questions about someone use the same pattern: 田中さんは…ですか.'],
      ['{東京|とうきょう}[[は]]{大|おお}きいです。', ['は', 'を', 'で'], 'Tokyo is big.', 'Describing a topic with an adjective: XはAdjectiveです.'],
    ],
  ),
  point(
    'desu',
    'Is, was, is not: です',
    'です・でした・じゃありません',
    'The polite "is". Change the ending for past and negative.',
    [
      'です makes a sentence polite and means "is / am / are". It does not change for person or number.',
      'Past: でした. Negative: じゃありません (or the more formal ではありません). Past negative: じゃありませんでした.',
    ],
    [
      ['{昨日|きのう}は{雨|あめ}でした。', 'It was rainy yesterday.'],
      ['{私|わたし}は{先生|せんせい}じゃありません。', 'I am not a teacher.'],
    ],
    [
      ['{私|わたし}は{学生|がくせい}[[です]]。', ['です', 'でした', 'じゃありません'], 'I am a student.', 'Present and positive: です.'],
      ['{昨日|きのう}は{雨|あめ}[[でした]]。', ['です', 'でした', 'じゃありません'], 'It was rainy yesterday.', 'Past: でした.'],
      ['{田中|たなか}さんは{先生|せんせい}[[じゃありません]]。', ['です', 'でした', 'じゃありません'], 'Tanaka is not a teacher.', 'Negative: じゃありません.'],
      ['{昨日|きのう}は{休|やす}み[[じゃありませんでした]]。', ['でした', 'じゃありません', 'じゃありませんでした'], 'Yesterday wasn’t a day off.', 'Past negative: じゃありませんでした.'],
      ['あの{人|ひと}は{誰|だれ}[[です]]か。', ['です', 'でした', 'じゃありません'], 'Who is that person?', 'A question is the same sentence with か at the end.'],
    ],
  ),
  point(
    'no',
    'Linking nouns: の',
    'X の Y',
    'の joins two nouns: 私の本 = my book, 日本語の先生 = Japanese teacher.',
    [
      'の connects two nouns. The first one describes the second: 私の本 (my book), 日本の車 (a Japanese car), 駅の前 (in front of the station).',
      'Position words like 前 (front), 上 (on top), 中 (inside) and 近く (near) work this way too.',
    ],
    [
      ['これは{友達|ともだち}の{車|くるま}です。', 'This is my friend’s car.'],
      ['{駅|えき}の{前|まえ}で{待|ま}ちます。', 'I’ll wait in front of the station.'],
    ],
    [
      ['{私|わたし}[[の]]{本|ほん}です。', ['の', 'は', 'が'], 'It’s my book.', '私の本 = my book. の links the two nouns.'],
      ['{山田|やまだ}さんは{日本語|にほんご}[[の]]{先生|せんせい}です。', ['の', 'を', 'に'], 'Yamada is a Japanese teacher.', 'The first noun describes the second: a teacher of Japanese.'],
      ['これは{誰|だれ}[[の]]かばんですか。', ['の', 'が', 'は'], 'Whose bag is this?', '誰の = whose.'],
      ['{駅|えき}[[の]]{前|まえ}で{待|ま}ちます。', ['の', 'に', 'を'], 'I’ll wait in front of the station.', 'Position words follow the noun with の: 駅の前.'],
      ['{友達|ともだち}[[の]]{家|いえ}に{行|い}きました。', ['の', 'を', 'で'], 'I went to my friend’s house.', '友達の家 = my friend’s house.'],
    ],
  ),
  point(
    'ka-ne-yo',
    'Sentence endings か, ね, よ',
    '〜か・〜ね・〜よ',
    'か asks, ね checks the listener agrees, よ tells them something new.',
    [
      'Add か to the end of a sentence to make it a question. No change in word order is needed.',
      'ね is like "isn’t it?": you expect the listener to agree. よ is like "you know": you’re telling them something they may not know.',
    ],
    [
      ['これは{何|なん}ですか。', 'What is this?'],
      ['いい{天気|てんき}ですね。', 'Nice weather, isn’t it?'],
    ],
    [
      ['これは{何|なん}です[[か]]。', ['か', 'ね', 'よ'], 'What is this?', 'か at the end makes a question.'],
      ['{明日|あした}、{来|き}ます[[か]]。', ['か', 'よ', 'の'], 'Will you come tomorrow?', 'A yes/no question also just adds か.'],
      ['いい{天気|てんき}です[[ね]]。', ['ね', 'か', 'よ'], 'Nice weather, isn’t it?', 'ね invites agreement: "isn’t it?"'],
      ['この{店|みせ}は{安|やす}いです[[よ]]。', ['よ', 'か', 'ね'], 'This shop is cheap, you know.', 'よ gives the listener new information.'],
      ['コーヒーと{紅茶|こうちゃ}、どちらがいいです[[か]]。', ['か', 'ね', 'よ'], 'Which would you like, coffee or tea?', 'A question with どちら (which of two) still ends in か.'],
    ],
  ),
  point(
    'mo',
    'Also: も',
    'X も',
    'も means "also" and takes the place of は, が or を.',
    [
      'も means "too / also". It replaces は, が or を: 私は学生です → 私も学生です (I’m a student too).',
      'AもBも means "both A and B". A question word with も and a negative verb means "no-": 何も (nothing), 誰も (nobody).',
    ],
    [
      ['{私|わたし}も{行|い}きます。', 'I’ll go too.'],
      ['{誰|だれ}もいません。', 'There’s nobody here.'],
    ],
    [
      ['{私|わたし}[[も]]{学生|がくせい}です。', ['も', 'は', 'を'], 'I’m a student too.', 'も replaces は to mean "also".'],
      ['{猫|ねこ}が{好|す}きです。{犬|いぬ}[[も]]{好|す}きです。', ['も', 'を', 'に'], 'I like cats. I like dogs too.', 'も replaces が here: 犬も好きです.'],
      ['{何|なに}[[も]]{食|た}べませんでした。', ['も', 'を', 'が'], 'I didn’t eat anything.', '何も with a negative verb means "nothing".'],
      ['{田中|たなか}さん[[も]]{来|き}ますか。', ['も', 'を', 'で'], 'Is Tanaka coming too?', 'も works in questions as well.'],
      ['コーヒー[[も]]{紅茶|こうちゃ}も{飲|の}みます。', ['も', 'を', 'と'], 'I drink both coffee and tea.', 'AもBも = both A and B.'],
    ],
  ),
  point(
    'ga',
    'Subject marker が',
    'X が …',
    'が marks the subject when it’s new or the focus, and with ある, いる, 好き and 分かる.',
    [
      'が marks the subject, often when it is new information or the important part: 誰が来ましたか (Who came?). Question words never take は as the subject.',
      'Some words always use が for the thing involved: ある and いる (there is), 好き (like), 分かる (understand), 欲しい (want).',
    ],
    [
      ['{机|つくえ}の{上|うえ}に{本|ほん}があります。', 'There is a book on the desk.'],
      ['{私|わたし}は{音楽|おんがく}が{好|す}きです。', 'I like music.'],
    ],
    [
      ['{机|つくえ}の{上|うえ}に{本|ほん}[[が]]あります。', ['が', 'を', 'で'], 'There is a book on the desk.', 'ある (there is) takes が for the thing that exists.'],
      ['{私|わたし}は{猫|ねこ}[[が]]{好|す}きです。', ['が', 'を', 'に'], 'I like cats.', '好き takes が for what you like, not を.'],
      ['{誰|だれ}[[が]]{来|き}ましたか。', ['が', 'は', 'を'], 'Who came?', 'A question word as the subject takes が.'],
      ['{日本語|にほんご}[[が]]{少|すこ}し{分|わ}かります。', ['が', 'を', 'で'], 'I understand a little Japanese.', '分かる takes が for what is understood.'],
      ['{公園|こうえん}に{子供|こども}[[が]]います。', ['が', 'を', 'で'], 'There are children in the park.', 'いる (there is, for people and animals) takes が.'],
    ],
  ),
  point(
    'wo',
    'Object marker を',
    'X を Verb',
    'を marks the thing the action is done to. Written を, read お.',
    [
      'を (pronounced お) marks the direct object: パンを食べる (eat bread), 本を読む (read a book).',
      'With movement verbs like 歩く, 散歩する and 渡る, を marks the place you move through: 公園を散歩する (take a walk through the park).',
    ],
    [
      ['{本|ほん}を{読|よ}みます。', 'I read a book.'],
      ['{道|みち}を{渡|わた}ります。', 'I cross the road.'],
    ],
    [
      ['{毎朝|まいあさ}パン[[を]]{食|た}べます。', ['を', 'が', 'で'], 'I eat bread every morning.', 'パン is what gets eaten, so it takes を.'],
      ['コーヒー[[を]]{飲|の}みます。', ['を', 'に', 'で'], 'I drink coffee.', 'The thing you drink is the object: を.'],
      ['{夜|よる}、テレビ[[を]]{見|み}ます。', ['を', 'が', 'に'], 'I watch TV at night.', 'テレビ is what you watch: を.'],
      ['{手紙|てがみ}[[を]]{書|か}きました。', ['を', 'で', 'へ'], 'I wrote a letter.', 'The letter is what gets written: を.'],
      ['{公園|こうえん}[[を]]{散歩|さんぽ}します。', ['を', 'で', 'に'], 'I take a walk through the park.', 'With movement verbs, を marks the place you move through.'],
    ],
  ),
  point(
    'masu',
    'Polite verbs: ます',
    '〜ます・〜ません・〜ました',
    'The polite verb ending, for now and the future. Change it for negative and past.',
    [
      'Verbs in polite speech end in ます. It covers habits, the present and the future: 毎日コーヒーを飲みます (I drink coffee every day), 明日行きます (I’ll go tomorrow).',
      'Negative: ません. Past: ました. Past negative: ませんでした.',
    ],
    [
      ['{明日|あした}、{東京|とうきょう}に{行|い}きます。', 'I’ll go to Tokyo tomorrow.'],
      ['{昨日|きのう}は{何|なに}も{食|た}べませんでした。', 'I didn’t eat anything yesterday.'],
    ],
    [
      ['{毎朝|まいあさ}コーヒーを[[{飲|の}みます]]。', ['{飲|の}みます', '{飲|の}みました', '{飲|の}みません'], 'I drink coffee every morning.', 'Habits use the present form ～ます.'],
      ['{昨日|きのう}、{映画|えいが}を[[{見|み}ました]]。', ['{見|み}ます', '{見|み}ました', '{見|み}ません'], 'I watched a movie yesterday.', 'Past: ～ました.'],
      ['{肉|にく}は[[{食|た}べません]]。', ['{食|た}べます', '{食|た}べません', '{食|た}べました'], 'I don’t eat meat.', 'Negative: ～ません.'],
      ['{昨日|きのう}は{学校|がっこう}に[[{行|い}きませんでした]]。', ['{行|い}きません', '{行|い}きませんでした', '{行|い}きました'], 'I didn’t go to school yesterday.', 'Past negative: ～ませんでした.'],
      ['{明日|あした}{友達|ともだち}に[[{会|あ}います]]。', ['{会|あ}います', '{会|あ}いました', '{会|あ}いませんでした'], 'I’ll meet a friend tomorrow.', 'The ～ます form also covers the future.'],
    ],
  ),
  point(
    'ni',
    'Time, destination, place of being: に',
    'X に',
    'に marks clock times, where you go, where something is, and who you give to.',
    [
      'に has a few jobs. It marks a point in time (七時に, 日曜日に), the destination of 行く, 来る and 帰る (学校に行く), the place where something is with ある and いる (部屋にいる), and the person you give, send or say something to.',
      'Words like 今日, 明日, 毎日 and 今 take no particle at all. へ (read え) can replace に for direction: 日本へ行く.',
    ],
    [
      ['{日曜日|にちようび}に{映画|えいが}を{見|み}ます。', 'I’ll watch a movie on Sunday.'],
      ['{兄|あに}は{東京|とうきょう}にいます。', 'My older brother is in Tokyo.'],
    ],
    [
      ['{七時|しちじ}[[に]]{起|お}きます。', ['に', 'で', 'を'], 'I get up at seven.', 'Clock times take に.'],
      ['{明日|あした}{学校|がっこう}[[に]]{行|い}きます。', ['に', 'で', 'を'], 'I’m going to school tomorrow.', 'に marks where you go. 明日 itself takes no particle.'],
      ['{猫|ねこ}は{部屋|へや}[[に]]います。', ['に', 'で', 'を'], 'The cat is in the room.', 'Where something is (with いる/ある) takes に, not で.'],
      ['{友達|ともだち}[[に]]{手紙|てがみ}を{書|か}きます。', ['に', 'を', 'で'], 'I write a letter to a friend.', 'The person you write, send or give to takes に.'],
      ['{毎日|まいにち}{六時|ろくじ}[[に]]{帰|かえ}ります。', ['に', 'で', 'を'], 'I go home at six every day.', 'Clock time: に. 毎日 takes no particle.'],
    ],
  ),
  point(
    'de',
    'Place of action, means: で',
    'X で',
    'で marks where an action happens and what you use to do it.',
    [
      'で marks the place where an action takes place: 図書館で勉強する (study at the library). Compare に, which is for where something simply is.',
      'で also marks the means: 電車で (by train), はしで (with chopsticks), 日本語で (in Japanese).',
    ],
    [
      ['{家|いえ}で{勉強|べんきょう}します。', 'I study at home.'],
      ['バスで{行|い}きます。', 'I’ll go by bus.'],
    ],
    [
      ['{図書館|としょかん}[[で]]{勉強|べんきょう}します。', ['で', 'に', 'を'], 'I study at the library.', 'The place where an action happens takes で.'],
      ['{電車|でんしゃ}[[で]]{会社|かいしゃ}に{行|い}きます。', ['で', 'に', 'を'], 'I go to the office by train.', 'で marks the means: by train.'],
      ['はし[[で]]{食|た}べます。', ['で', 'を', 'に'], 'I eat with chopsticks.', 'The tool you use takes で.'],
      ['{日本語|にほんご}[[で]]{話|はな}してください。', ['で', 'を', 'に'], 'Please speak in Japanese.', 'The language you speak in takes で.'],
      ['{公園|こうえん}[[で]]{遊|あそ}びます。', ['で', 'に', 'を'], 'I play in the park.', 'Playing happens in the park, so で. 公園にいます would be "I’m in the park".'],
    ],
  ),
  point(
    'to',
    'With, and, quoting: と',
    'X と',
    'と means "with" someone, "and" between nouns, and marks quoted words.',
    [
      'と means "together with": 友達と映画を見る (watch a movie with a friend). Between nouns it means "and" for a complete list: パンと卵.',
      'と also marks what someone says or thinks: 「ありがとう」と言う.',
    ],
    [
      ['{母|はは}と{買|か}い{物|もの}に{行|い}きます。', 'I’m going shopping with my mother.'],
      ['{肉|にく}と{野菜|やさい}を{買|か}いました。', 'I bought meat and vegetables.'],
    ],
    [
      ['{友達|ともだち}[[と]]{映画|えいが}を{見|み}ました。', ['と', 'を', 'に'], 'I watched a movie with a friend.', 'と = together with someone.'],
      ['パン[[と]]{卵|たまご}を{買|か}いました。', ['と', 'も', 'の'], 'I bought bread and eggs.', 'と joins nouns into a list: A and B.'],
      ['{母|はは}[[と]]{電話|でんわ}で{話|はな}しました。', ['と', 'に', 'を'], 'I talked with my mother on the phone.', 'Talking with someone: と.'],
      ['「ありがとう」[[と]]{言|い}いました。', ['と', 'を', 'に'], 'I said “thank you”.', 'と marks quoted words before 言う and 思う.'],
    ],
  ),
  point(
    'i-adj',
    'い-adjectives',
    '高い・高くない・高かった',
    'Adjectives ending in い change their ending for negative and past.',
    [
      'い-adjectives end in い: 高い, 安い, 寒い. For the negative, drop い and add くない: 高くない. For the past, drop い and add かった: 高かった.',
      'いい (good) is irregular. Its forms come from よい: よくない (not good), よかった (was good).',
    ],
    [
      ['この{本|ほん}は{高|たか}くないです。', 'This book isn’t expensive.'],
      ['{昨日|きのう}は{楽|たの}しかったです。', 'Yesterday was fun.'],
    ],
    [
      ['この{本|ほん}は[[{高|たか}い]]です。', ['{高|たか}い', '{高|たか}くない', '{高|たか}かった'], 'This book is expensive.', 'Present and positive: the dictionary form 高い.'],
      ['{昨日|きのう}は[[{寒|さむ}かった]]です。', ['{寒|さむ}い', '{寒|さむ}かった', '{寒|さむ}くない'], 'It was cold yesterday.', 'Past: drop い, add かった.'],
      ['この{料理|りょうり}は[[{辛|から}くない]]です。', ['{辛|から}い', '{辛|から}くない', '{辛|から}かった'], 'This dish isn’t spicy.', 'Negative: drop い, add くない.'],
      ['{天気|てんき}は[[よくない]]です。', ['いい', 'よくない', 'いくない'], 'The weather isn’t good.', 'いい is irregular: "not good" is よくない.'],
      ['{旅行|りょこう}は[[{楽|たの}しかった]]です。', ['{楽|たの}しい', '{楽|たの}しかった', '{楽|たの}しくない'], 'The trip was fun.', 'Past: 楽しい → 楽しかった.'],
    ],
  ),
  point(
    'na-adj',
    'な-adjectives',
    '静かな町・静かです',
    'These adjectives take な before a noun and behave like nouns otherwise.',
    [
      'な-adjectives (静か, 有名, 元気, 好き, きれい) take な before a noun: 静かな町 (a quiet town).',
      'At the end of a sentence they work like nouns with です: 静かです, 静かでした, 静かじゃありません. きれい ends in い but is a な-adjective.',
    ],
    [
      ['ここは{静|しず}かな{町|まち}です。', 'This is a quiet town.'],
      ['{昨日|きのう}は{暇|ひま}でした。', 'I was free yesterday.'],
    ],
    [
      ['ここは{静|しず}か[[な]]{町|まち}です。', ['な', 'の', 'い'], 'This is a quiet town.', 'Before a noun, な-adjectives take な.'],
      ['{有名|ゆうめい}[[な]]{人|ひと}に{会|あ}いました。', ['な', 'の', 'い'], 'I met a famous person.', '有名 is a な-adjective: 有名な人.'],
      ['{元気|げんき}[[な]]{子供|こども}ですね。', ['な', 'の', 'い'], 'What a lively child.', '元気な子供 = a lively child.'],
      ['この{部屋|へや}は[[きれいじゃありません]]。', ['きれいじゃありません', 'きれくないです', 'きれいくないです'], 'This room isn’t clean.', 'きれい is a な-adjective, so its negative works like a noun’s.'],
      ['{日曜日|にちようび}は[[{暇|ひま}でした]]。', ['{暇|ひま}でした', '{暇|ひま}かったです', '{暇|ひま}くないです'], 'I was free on Sunday.', 'な-adjectives take でした for the past, like nouns.'],
    ],
  ),
  point(
    'tai',
    'Want to: 〜たい',
    '行きたい',
    'Swap ます for たい to say what you want to do.',
    [
      'Take the ます form, drop ます and add たい: 行きます → 行きたい (want to go), 食べます → 食べたい (want to eat).',
      'たい then works like an い-adjective: 行きたくない (don’t want to go), 行きたかった (wanted to go).',
    ],
    [
      ['{日本|にほん}に{行|い}きたいです。', 'I want to go to Japan.'],
      ['{今日|きょう}は{勉強|べんきょう}したくないです。', 'I don’t want to study today.'],
    ],
    [
      ['{日本|にほん}に[[{行|い}きたい]]です。', ['{行|い}きたい', '{行|い}きます', '{行|い}きました'], 'I want to go to Japan.', '行きます → 行きたい: want to go.'],
      ['{何|なに}が[[{食|た}べたい]]ですか。', ['{食|た}べたい', '{食|た}べます', '{食|た}べない'], 'What do you want to eat?', '食べます → 食べたい.'],
      ['{今日|きょう}は{何|なに}も[[したくない]]です。', ['したくない', 'したい', 'しない'], 'I don’t want to do anything today.', 'たい conjugates like an い-adjective: したくない.'],
      ['{新|あたら}しいゲームを[[{買|か}いたい]]です。', ['{買|か}いたい', '{買|か}います', '{買|か}いました'], 'I want to buy a new game.', '買います → 買いたい.'],
      ['もっと{寝|ね}[[たい]]です。', ['たい', 'ます', 'ない'], 'I want to sleep more.', '寝ます → 寝たい.'],
    ],
  ),
  point(
    'te-kudasai',
    'Please do: 〜てください',
    '待ってください',
    'The て-form plus ください makes a polite request.',
    [
      'て-form + ください = please do. The て-form depends on how the verb ends: る-verbs like 食べる and 見る just drop る (食べて, 見て).',
      'Others change: く → いて (書いて), ぐ → いで (泳いで), う・つ・る → って (言って, 待って, 帰って), む・ぶ・ぬ → んで (読んで), す → して (話して). 行く is irregular: 行って.',
    ],
    [
      ['ちょっと{待|ま}ってください。', 'Please wait a moment.'],
      ['ゆっくり{話|はな}してください。', 'Please speak slowly.'],
    ],
    [
      ['ちょっと[[{待|ま}って]]ください。', ['{待|ま}って', '{待|ま}ち', '{待|ま}つ'], 'Please wait a moment.', '待つ → 待って. て-form + ください = please do.'],
      ['ここに{名前|なまえ}を[[{書|か}いて]]ください。', ['{書|か}いて', '{書|か}きて', '{書|か}って'], 'Please write your name here.', 'Verbs ending in く change to いて: 書く → 書いて.'],
      ['もう{一度|いちど}[[{言|い}って]]ください。', ['{言|い}って', '{言|い}いて', '{言|い}んで'], 'Please say it once more.', 'Verbs ending in う change to って: 言う → 言って.'],
      ['この{本|ほん}を[[{読|よ}んで]]ください。', ['{読|よ}んで', '{読|よ}みて', '{読|よ}って'], 'Please read this book.', 'Verbs ending in む change to んで: 読む → 読んで.'],
      ['{窓|まど}を[[{開|あ}けて]]ください。', ['{開|あ}けて', '{開|あ}けりて', '{開|あ}けって'], 'Please open the window.', '開ける is a る-verb: drop る, add て.'],
    ],
  ),
  point(
    'te-iru',
    'Ongoing actions: 〜ている',
    '降っています',
    'The て-form plus いる describes something going on now, or a lasting state.',
    [
      'て-form + いる (polite: います) describes an action in progress: 雨が降っています (it’s raining).',
      'With some verbs it describes a lasting state: 住んでいる (live somewhere), 結婚している (be married), 知っている (know).',
    ],
    [
      ['{今|いま}、{本|ほん}を{読|よ}んでいます。', 'I’m reading a book now.'],
      ['{姉|あね}は{大阪|おおさか}に{住|す}んでいます。', 'My older sister lives in Osaka.'],
    ],
    [
      ['{今|いま}、{雨|あめ}が[[{降|ふ}っています]]。', ['{降|ふ}っています', '{降|ふ}ります', '{降|ふ}りました'], 'It’s raining now.', '～ています describes something going on right now.'],
      ['{兄|あに}は{東京|とうきょう}に[[{住|す}んでいます]]。', ['{住|す}んでいます', '{住|す}みます', '{住|す}みました'], 'My brother lives in Tokyo.', '住む is almost always 住んでいる: a lasting state.'],
      ['{母|はは}は{今|いま}{料理|りょうり}を[[しています]]。', ['しています', 'します', 'しました'], 'My mother is cooking now.', 'Right now, in progress: しています.'],
      ['{田中|たなか}さんは{結婚|けっこん}[[しています]]。', ['しています', 'します', 'しました'], 'Tanaka is married.', '結婚している = is married. 結婚します = will get married.'],
      ['{猫|ねこ}がソファで[[{寝|ね}ています]]。', ['{寝|ね}ています', '{寝|ね}ます', '{寝|ね}ました'], 'The cat is sleeping on the sofa.', 'Sleeping right now: 寝ています.'],
    ],
  ),
  point(
    'mashou',
    'Let’s, shall we: 〜ましょう・〜ませんか',
    '行きましょう',
    'ましょう means "let’s"; ませんか is a polite invitation.',
    [
      'Replace ます with ましょう for "let’s …": 行きましょう (let’s go).',
      'A negative question, ませんか, is a gentle invitation: 一緒に行きませんか (Would you like to go together?).',
    ],
    [
      ['{一緒|いっしょ}に{帰|かえ}りましょう。', 'Let’s go home together.'],
      ['お{茶|ちゃ}を{飲|の}みませんか。', 'Would you like some tea?'],
    ],
    [
      ['{一緒|いっしょ}に{昼|ひる}ご{飯|はん}を[[{食|た}べましょう]]。', ['{食|た}べましょう', '{食|た}べました', '{食|た}べません'], 'Let’s have lunch together.', '～ましょう = let’s.'],
      ['{週末|しゅうまつ}、{映画|えいが}を[[{見|み}ませんか]]。', ['{見|み}ませんか', '{見|み}ません', '{見|み}ました'], 'Would you like to watch a movie this weekend?', '～ませんか is a polite invitation.'],
      ['ちょっと[[{休|やす}みましょう]]。', ['{休|やす}みましょう', '{休|やす}みました', '{休|やす}みません'], 'Let’s take a short break.', '休みます → 休みましょう.'],
      ['{駅|えき}で[[{会|あ}いましょう]]。', ['{会|あ}いましょう', '{会|あ}いました', '{会|あ}いません'], 'Let’s meet at the station.', '会います → 会いましょう.'],
    ],
  ),
  point(
    'kara',
    'Because: から・ので',
    '〜から・〜ので',
    'Give a reason: 雨だから (because it’s raining). ので is softer and more polite.',
    [
      'Put から after the reason, then the result: 雨だから、行かない (It’s raining, so I won’t go). It works after plain or polite forms.',
      'ので means the same but sounds softer and more objective, so it’s common in polite explanations. After nouns and な-adjectives it becomes なので: 雨なので.',
    ],
    [
      ['{時間|じかん}がないから、タクシーで{行|い}きます。', 'I don’t have time, so I’ll take a taxi.'],
      ['{頭|あたま}が{痛|いた}いので、{今日|きょう}は{休|やす}みます。', 'I have a headache, so I’ll take today off.'],
    ],
    [
      ['{暑|あつ}い[[から]]、{窓|まど}を{開|あ}けてください。', ['から', 'けど', 'まで'], 'It’s hot, so please open the window.', 'から gives the reason: it’s hot, so…'],
      ['{明日|あした}は{試験|しけん}がある[[から]]、{今夜|こんや}は{勉強|べんきょう}する。', ['から', 'けど', 'まで'], 'I have an exam tomorrow, so I’ll study tonight.', 'The reason comes first, marked by から.'],
      ['{雨|あめ}[[なので]]、{試合|しあい}は{中止|ちゅうし}です。', ['なので', 'ので', 'だので'], 'Because of the rain, the match is cancelled.', 'After a noun, ので becomes なので.'],
      ['{疲|つか}れた[[ので]]、{早|はや}く{寝|ね}ます。', ['ので', 'なので', 'のに'], 'I’m tired, so I’ll go to bed early.', 'After a verb, ので attaches directly: 疲れたので.'],
      ['「どうして{来|こ}なかったの？」「{病気|びょうき}だった[[から]]。」', ['から', 'まで', 'より'], '“Why didn’t you come?” “Because I was sick.”', 'から can end an answer to どうして (why).'],
    ],
    'N4',
  ),
  point(
    'nagara',
    'While doing: 〜ながら',
    '〜ながら',
    'Do two things at once: 音楽を聞きながら (while listening to music).',
    [
      'Take the ます form, drop ます and add ながら: 聞きます → 聞きながら. The main action comes last: 音楽を聞きながら勉強する (study while listening to music).',
      'Both actions are done by the same person.',
    ],
    [
      ['テレビを{見|み}ながらご{飯|はん}を{食|た}べる。', 'I eat while watching TV.'],
      ['{歩|ある}きながら{話|はな}しましょう。', 'Let’s talk while we walk.'],
    ],
    [
      ['{音楽|おんがく}を[[{聞|き}きながら]]{勉強|べんきょう}します。', ['{聞|き}きながら', '{聞|き}くながら', '{聞|き}いてながら'], 'I study while listening to music.', 'ます-stem + ながら: 聞きます → 聞きながら.'],
      ['コーヒーを[[{飲|の}みながら]]{新聞|しんぶん}を{読|よ}みます。', ['{飲|の}みながら', '{飲|の}むながら', '{飲|の}んながら'], 'I read the newspaper while drinking coffee.', '飲みます → 飲みながら.'],
      ['{歌|うた}を[[{歌|うた}いながら]]{料理|りょうり}をする。', ['{歌|うた}いながら', '{歌|うた}うながら', '{歌|うた}ってながら'], 'I cook while singing.', '歌います → 歌いながら.'],
      ['{笑|わら}い[[ながら]]{話|はな}した。', ['ながら', 'まで', 'から'], 'She talked while laughing.', 'ながら joins two actions happening at the same time.'],
    ],
    'N4',
  ),
  point(
    'temoii',
    'May, it’s okay to: 〜てもいい',
    '〜てもいいです',
    'Ask or give permission: 入ってもいいですか (May I come in?).',
    [
      'て-form + もいい means "it’s fine to …". As a question it asks permission: 写真を撮ってもいいですか (May I take a photo?).',
      'Say yes with はい、いいですよ. A polite no is often just すみません、ちょっと…',
    ],
    [
      ['ここに{座|すわ}ってもいいですか。', 'May I sit here?'],
      ['もう{帰|かえ}ってもいいですよ。', 'You can go home now.'],
    ],
    [
      ['{写真|しゃしん}を{撮|と}って[[もいい]]ですか。', ['もいい', 'はいけない', 'ください'], 'May I take a photo?', 'て-form + もいいですか asks permission.'],
      ['この{本|ほん}を[[{借|か}りても]]いいですか。', ['{借|か}りても', '{借|か}りて', '{借|か}りるも'], 'May I borrow this book?', 'Permission needs the て-form plus も: 借りても.'],
      ['「{窓|まど}を{開|あ}けてもいいですか。」「はい、[[いい]]ですよ。」', ['いい', 'だめ', 'いけない'], '“May I open the window?” “Yes, go ahead.”', 'Giving permission: いいですよ.'],
      ['{鉛筆|えんぴつ}で{書|か}いて[[も]]いいですか。', ['も', 'は', 'が'], 'Is it okay to write in pencil?', 'The も is what makes it "it’s fine even if…".'],
    ],
    'N4',
  ),
  point(
    'tewaikenai',
    'Must not: 〜てはいけない',
    '〜てはいけません',
    'Forbid something: ここで写真を撮ってはいけません (No photos here).',
    [
      'て-form + はいけない (polite: はいけません) means "must not". It is the opposite of てもいい.',
      'In casual speech it shortens to ちゃだめ or ちゃいけない: 食べちゃだめ (don’t eat that).',
    ],
    [
      ['{図書館|としょかん}で{話|はな}してはいけません。', 'You must not talk in the library.'],
      ['{危|あぶ}ないから、{触|さわ}っちゃだめ！', 'It’s dangerous, don’t touch it!'],
    ],
    [
      ['ここでたばこを{吸|す}って[[はいけません]]。', ['はいけません', 'もいいです', 'ください'], 'You must not smoke here.', 'Prohibition: て-form + はいけません.'],
      ['{授業中|じゅぎょうちゅう}に{寝|ね}て[[は]]いけない。', ['は', 'も', 'が'], 'You must not sleep during class.', 'Prohibition is て + は + いけない.'],
      ['{夜|よる}{遅|おそ}くまで[[{遊|あそ}んでは]]いけません。', ['{遊|あそ}んでは', '{遊|あそ}びては', '{遊|あそ}ぶは'], 'You must not stay out playing until late at night.', 'The て-form of 遊ぶ is 遊んで, then は.'],
      ['この{水|みず}を{飲|の}んで[[はいけない]]よ。', ['はいけない', 'もいい', 'ください'], 'You must not drink this water.', 'Prohibition: てはいけない.'],
    ],
    'N4',
  ),
  point(
    'nakereba',
    'Must, have to: 〜なければならない',
    '〜なければなりません',
    'Say what you have to do: 行かなければならない (I have to go).',
    [
      'Take the ない form, drop い and add ければならない (polite: ければなりません): 行かない → 行かなければならない.',
      'In speech it gets shortened a lot: 行かなきゃ (I gotta go) and 行かないと.',
    ],
    [
      ['{明日|あした}は{早|はや}く{起|お}きなければなりません。', 'I have to get up early tomorrow.'],
      ['もう{帰|かえ}らなきゃ。', 'I gotta go home now.'],
    ],
    [
      ['{宿題|しゅくだい}を[[しなければ]]なりません。', ['しなければ', 'しないで', 'すれば'], 'I have to do my homework.', 'しない → しなければ + なりません = have to do.'],
      ['{毎日|まいにち}{薬|くすり}を[[{飲|の}まなければ]]ならない。', ['{飲|の}まなければ', '{飲|の}みなければ', '{飲|の}むなければ'], 'I have to take medicine every day.', 'Start from the ない form 飲まない, then なければ.'],
      ['{八時|はちじ}までに{会社|かいしゃ}に[[{行|い}かなきゃ]]。', ['{行|い}かなきゃ', '{行|い}きなきゃ', '{行|い}くなきゃ'], 'I’ve got to get to work by eight.', 'なきゃ is the casual short form of なければならない.'],
      ['{明日|あした}は{六時|ろくじ}に[[{起|お}きなければ]]なりません。', ['{起|お}きなければ', '{起|お}かなければ', '{起|お}くなければ'], 'I have to get up at six tomorrow.', '起きる is a る-verb: 起きない → 起きなければ.'],
    ],
    'N4',
  ),
  point(
    'takotogaaru',
    'Have done before: 〜たことがある',
    '〜たことがあります',
    'Talk about experiences: 日本に行ったことがある (I’ve been to Japan).',
    [
      'Past た form + ことがある means "have done at least once": 寿司を食べたことがある.',
      'ことがない means "have never": 一度も見たことがない (I’ve never seen it, not even once).',
    ],
    [
      ['{富士山|ふじさん}に{登|のぼ}ったことがあります。', 'I’ve climbed Mount Fuji.'],
      ['{納豆|なっとう}を{食|た}べたことがない。', 'I’ve never eaten natto.'],
    ],
    [
      ['{日本|にほん}に[[{行|い}った]]ことがありますか。', ['{行|い}った', '{行|い}く', '{行|い}って'], 'Have you ever been to Japan?', 'Experiences use the past た form: 行ったことがある.'],
      ['この{映画|えいが}を{見|み}た[[こと]]があります。', ['こと', 'もの', 'ところ'], 'I’ve seen this movie.', 'ことがある = have the experience of.'],
      ['{竜|りゅう}を{見|み}たことが[[ない]]。', ['ない', 'ある', 'いる'], 'I’ve never seen a dragon.', 'ことがない = have never.'],
      ['{着物|きもの}を[[{着|き}た]]ことがありますか。', ['{着|き}た', '{着|き}て', '{着|き}る'], 'Have you ever worn a kimono?', '着る → 着た + ことがある.'],
    ],
    'N4',
  ),
  point(
    'toomou',
    'I think: 〜と思う',
    '〜と思います',
    'Give an opinion or a guess: 明日は雨だと思う (I think it’ll rain tomorrow).',
    [
      'Put the thought in plain form, then と思う (polite: と思います): おいしいと思う. After a noun or な-adjective, add だ: 雨だと思う, 静かだと思う.',
      'To ask someone’s opinion: どう思いますか (What do you think?).',
    ],
    [
      ['この{本|ほん}はおもしろいと{思|おも}います。', 'I think this book is interesting.'],
      ['{彼|かれ}は{来|こ}ないと{思|おも}う。', 'I don’t think he’s coming.'],
    ],
    [
      ['{明日|あした}は{晴|は}れる[[と]]{思|おも}います。', ['と', 'を', 'が'], 'I think it’ll be sunny tomorrow.', 'The thought is marked with と before 思う.'],
      ['あの{人|ひと}は{先生|せんせい}[[だ]]と{思|おも}う。', ['だ', 'です', 'な'], 'I think that person is a teacher.', 'Before と思う, a noun takes plain だ: 先生だと思う.'],
      ['この{問題|もんだい}は[[{難|むずか}しい]]と{思|おも}います。', ['{難|むずか}しい', '{難|むずか}しいだ', '{難|むずか}しいです'], 'I think this problem is difficult.', 'い-adjectives go straight before と思う, with no だ.'],
      ['{日本語|にほんご}についてどう[[{思|おも}います]]か。', ['{思|おも}います', '{言|い}います', '{見|み}ます'], 'What do you think about Japanese?', 'どう思いますか = what do you think?'],
    ],
    'N4',
  ),
  point(
    'yori',
    'Comparing: より・のほうが',
    'AはBより〜・Bのほうが〜',
    'Compare two things: 犬より猫が好き (I like cats more than dogs).',
    [
      'AはBより + adjective means "A is more … than B": 東京は大阪より大きい.',
      'To ask which of two, use どちら: 犬と猫と、どちらが好きですか. Answer with のほうが: 猫のほうが好きです.',
    ],
    [
      ['{電車|でんしゃ}はバスより{速|はや}い。', 'Trains are faster than buses.'],
      ['{夏|なつ}と{冬|ふゆ}、どちらが{好|す}きですか。', 'Which do you like better, summer or winter?'],
    ],
    [
      ['{今日|きょう}は{昨日|きのう}[[より]]{寒|さむ}いです。', ['より', 'から', 'まで'], 'Today is colder than yesterday.', 'より marks what you compare against: than yesterday.'],
      ['{私|わたし}は{肉|にく}より{魚|さかな}の[[ほう]]が{好|す}きです。', ['ほう', 'こと', 'もの'], 'I prefer fish to meat.', 'Xのほうが = X is the one that is more so.'],
      ['コーヒーと{紅茶|こうちゃ}と、[[どちら]]がいいですか。', ['どちら', 'どれ', 'どこ'], 'Which would you like, coffee or tea?', 'Choosing between two: どちら.'],
      ['{兄|あに}は{私|わたし}[[より]]{背|せ}が{高|たか}い。', ['より', 'ほど', 'まで'], 'My older brother is taller than me.', 'より = than. ほど only works with a negative: 兄ほど高くない.'],
    ],
    'N4',
  ),
  point(
    'tsumori',
    'Plan to: 〜つもり',
    '〜つもりです',
    'Talk about plans: 来年日本に行くつもりです (I plan to go to Japan next year).',
    [
      'Dictionary form + つもり means "intend to": 勉強するつもり. Planning not to: ないつもり.',
      'It states a firm plan of your own.',
    ],
    [
      ['{来年|らいねん}、{日本|にほん}に{行|い}くつもりです。', 'I plan to go to Japan next year.'],
      ['もうお{酒|さけ}は{飲|の}まないつもりだ。', 'I don’t intend to drink anymore.'],
    ],
    [
      ['{週末|しゅうまつ}は{家|いえ}で[[{休|やす}む]]つもりです。', ['{休|やす}む', '{休|やす}んで', '{休|やす}みます'], 'I plan to rest at home this weekend.', 'つもり follows the dictionary form: 休むつもり.'],
      ['{夏休|なつやす}みに{日本語|にほんご}を{勉強|べんきょう}する[[つもり]]です。', ['つもり', 'こと', 'ほう'], 'I plan to study Japanese over the summer break.', 'Dictionary form + つもりです = plan to.'],
      ['{今日|きょう}は{何|なに}も[[{買|か}わない]]つもりだ。', ['{買|か}わない', '{買|か}わなく', '{買|か}いない'], 'I’m not planning to buy anything today.', 'Planning not to do something: ないつもり.'],
      ['{将来|しょうらい}、{冒険者|ぼうけんしゃ}に[[なる]]つもりです。', ['なる', 'なります', 'なって'], 'In the future, I intend to become an adventurer.', 'なる (become) + つもり.'],
    ],
    'N4',
  ),
  point(
    'potential',
    'Can do: the potential form',
    '食べられる・読める・できる',
    'Say what you can do: 漢字が読める (I can read kanji).',
    [
      'る-verbs: drop る and add られる (食べる → 食べられる). う-verbs: change the last kana to its え-row sound and add る (読む → 読める, 書く → 書ける).',
      'する becomes できる and 来る becomes 来られる (こられる). The thing you can do usually takes が: 日本語が話せる.',
    ],
    [
      ['{私|わたし}は{泳|およ}げます。', 'I can swim.'],
      ['{漢字|かんじ}が{少|すこ}し{読|よ}めます。', 'I can read a few kanji.'],
    ],
    [
      ['{日本語|にほんご}が[[{話|はな}せます]]か。', ['{話|はな}せます', '{話|はな}れます', '{話|はな}しれます'], 'Can you speak Japanese?', 'う-verb: 話す → 話せる (す → せ).'],
      ['ひらがなが[[{書|か}けます]]。', ['{書|か}けます', '{書|か}きれます', '{書|か}かれます'], 'I can write hiragana.', '書く → 書ける (く → け). 書かれる is the passive, "is written".'],
      ['{納豆|なっとう}が[[{食|た}べられます]]か。', ['{食|た}べられます', '{食|た}べります', '{食|た}べけます'], 'Can you eat natto?', '食べる is a る-verb: 食べられる. (Casual speech often says 食べれる.)'],
      ['{料理|りょうり}が[[できます]]か。', ['できます', 'しれます', 'されます'], 'Can you cook?', 'する becomes できる.'],
      ['{明日|あした}のパーティーに[[{来|こ}られます]]か。', ['{来|こ}られます', '{来|き}ます', '{来|く}るれます'], 'Can you come to the party tomorrow?', '来る → 来られる (こられる). 来ます would be "will you come?".'],
    ],
    'N4',
  ),
  point(
    'maeni',
    'Before and after: 〜前に・〜後で',
    '〜前に・〜た後で',
    'Put events in order: 寝る前に (before sleeping), 食べた後で (after eating).',
    [
      'Dictionary form + 前に = before doing: 寝る前に歯を磨く. With a noun: の前に (食事の前に).',
      'Past た form + 後で = after doing: 食べた後で散歩する. With a noun: の後で (授業の後で).',
    ],
    [
      ['{寝|ね}る{前|まえ}に{本|ほん}を{読|よ}みます。', 'I read before going to bed.'],
      ['{仕事|しごと}の{後|あと}で{飲|の}みに{行|い}こう。', 'Let’s go for a drink after work.'],
    ],
    [
      ['[[{食|た}べる]]{前|まえ}に{手|て}を{洗|あら}います。', ['{食|た}べる', '{食|た}べた', '{食|た}べて'], 'I wash my hands before eating.', '前に always takes the dictionary form, even about the past.'],
      ['{宿題|しゅくだい}を[[した]]{後|あと}で、ゲームをします。', ['した', 'する', 'して'], 'After doing my homework, I play games.', '後で takes the past た form.'],
      ['{授業|じゅぎょう}[[の]]{前|まえ}に{先生|せんせい}と{話|はな}した。', ['の', 'を', 'が'], 'I talked with the teacher before class.', 'A noun needs の before 前に: 授業の前に.'],
      ['{映画|えいが}を{見|み}た[[{後|あと}で]]、ご{飯|はん}を{食|た}べよう。', ['{後|あと}で', '{前|まえ}に', 'まで'], 'After watching the movie, let’s eat.', '見た + 後で = after watching.'],
    ],
    'N4',
  ),
  point(
    'tari',
    'Things like: 〜たり〜たりする',
    '〜たり〜たりします',
    'List some of the things you do: 本を読んだり、映画を見たりする.',
    [
      'Take the past た form, add り, and end the list with する: 読んだり、見たりする means "do things like reading and watching".',
      'It suggests the list isn’t complete. A single 〜たりする softens what you say: "things like that".',
    ],
    [
      ['{週末|しゅうまつ}は{掃除|そうじ}をしたり、{買|か}い{物|もの}に{行|い}ったりします。', 'On weekends I do things like cleaning and going shopping.'],
      ['{休|やす}みの{日|ひ}は{寝|ね}たりゲームをしたりする。', 'On days off I sleep, play games, that kind of thing.'],
    ],
    [
      ['{日曜日|にちようび}は{本|ほん}を[[{読|よ}んだり]]、{音楽|おんがく}を{聞|き}いたりします。', ['{読|よ}んだり', '{読|よ}みたり', '{読|よ}むたり'], 'On Sundays I read books, listen to music and so on.', 'たり attaches to the past form: 読んだ → 読んだり.'],
      ['ギルドでは{依頼|いらい}を{受|う}けたり、{仲間|なかま}と{話|はな}したり[[します]]。', ['します', 'です', 'あります'], 'At the guild I take on quests, talk with my party and so on.', 'A たり list ends with する.'],
      ['{夏休|なつやす}みは{海|うみ}で{泳|およ}いだり、{山|やま}に[[{登|のぼ}ったり]]した。', ['{登|のぼ}ったり', '{登|のぼ}りたり', '{登|のぼ}るたり'], 'Over summer break I swam in the sea, climbed mountains and so on.', '登る → 登った → 登ったり.'],
      ['{昨日|きのう}は{友達|ともだち}と{話|はな}したり、ゲームを[[したり]]しました。', ['したり', 'しったり', 'するたり'], 'Yesterday I talked with friends, played games and so on.', 'する → した → したり.'],
    ],
    'N4',
  ),
]

export const GRAMMAR_BY_ID: Record<string, GrammarPoint> = Object.fromEntries(GRAMMAR.map((g) => [g.id, g]))

export const EXERCISE_BY_ID: Record<string, GrammarExercise & { pointId: string }> = Object.fromEntries(
  GRAMMAR.flatMap((g) => g.exercises.map((e) => [e.id, { ...e, pointId: g.id }] as const)),
)
