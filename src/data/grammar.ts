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

export interface GrammarPoint {
  id: string
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
): GrammarPoint {
  return {
    id,
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
]

export const GRAMMAR_BY_ID: Record<string, GrammarPoint> = Object.fromEntries(GRAMMAR.map((g) => [g.id, g]))

export const EXERCISE_BY_ID: Record<string, GrammarExercise & { pointId: string }> = Object.fromEntries(
  GRAMMAR.flatMap((g) => g.exercises.map((e) => [e.id, { ...e, pointId: g.id }] as const)),
)
