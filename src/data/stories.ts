// Short graded stories for beginners. Mostly words from the Starter and
// Adventurer decks, with furigana on every kanji ({漢字|かんじ}) so new words
// never block reading. Polite style in narration, casual in some dialogue,
// as in manga.

export interface StoryLine {
  ja: string
  en: string
}

export interface Story {
  id: string
  title: string
  titleEn: string
  theme: 'Daily life' | 'Adventure'
  lines: StoryLine[]
}

type Line = [ja: string, en: string]

const story = (id: string, title: string, titleEn: string, theme: Story['theme'], lines: Line[]): Story => ({
  id,
  title,
  titleEn,
  theme,
  lines: lines.map(([ja, en]) => ({ ja, en })),
})

export const STORIES: Story[] = [
  story('hana-morning', '{花|はな}の{朝|あさ}', 'Hana’s morning', 'Daily life', [
    ['{朝|あさ}{七時|しちじ}です。', 'It’s seven in the morning.'],
    ['{花|はな}は{起|お}きて、{顔|かお}を{洗|あら}います。', 'Hana gets up and washes her face.'],
    ['{台所|だいどころ}で{母|はは}がパンを{焼|や}いています。', 'Her mother is toasting bread in the kitchen.'],
    ['「おはよう！{朝|あさ}ご{飯|はん}は{何|なに}？」', '“Morning! What’s for breakfast?”'],
    ['「パンと{卵|たまご}よ。{牛乳|ぎゅうにゅう}も{飲|の}んでね。」', '“Bread and eggs. Drink your milk too.”'],
    ['{花|はな}は{急|いそ}いで{食|た}べます。', 'Hana eats in a hurry.'],
    ['{八時|はちじ}に{家|いえ}を{出|で}て、{学校|がっこう}へ{行|い}きます。', 'At eight she leaves home and goes to school.'],
    ['{今日|きょう}もいい{天気|てんき}です。', 'It’s nice weather today too.'],
  ]),
  story('first-quest', 'はじめての{依頼|いらい}', 'The first quest', 'Adventure', [
    ['ここは{小|ちい}さい{村|むら}のギルドです。', 'This is the guild of a small village.'],
    ['{新|あたら}しい{冒険者|ぼうけんしゃ}のケンは、{掲示板|けいじばん}を{見|み}ています。', 'Ken, a new adventurer, is looking at the notice board.'],
    ['「{森|もり}のスライムを{五匹|ごひき}{倒|たお}してください。」', '“Please defeat five slimes in the forest.”'],
    ['「これにします！」とケンは{言|い}いました。', '“I’ll take this one!” said Ken.'],
    ['ケンは{剣|けん}を{持|も}って、{森|もり}へ{行|い}きました。', 'Ken took his sword and went to the forest.'],
    ['スライムは{弱|よわ}かったです。でも、{数|かず}が{多|おお}かったです。', 'The slimes were weak. But there were a lot of them.'],
    ['{夕方|ゆうがた}、ケンはギルドに{帰|かえ}りました。', 'In the evening, Ken went back to the guild.'],
    ['「お{疲|つか}れさまでした。{金貨|きんか}{三枚|さんまい}です。」', '“Good work. Here are three gold coins.”'],
  ]),
  story('station', '{駅|えき}で', 'At the station', 'Daily life', [
    ['{土曜日|どようび}、{私|わたし}は{友達|ともだち}と{駅|えき}で{会|あ}います。', 'On Saturday I’m meeting a friend at the station.'],
    ['でも、{友達|ともだち}はまだ{来|き}ていません。', 'But my friend hasn’t come yet.'],
    ['{私|わたし}は{電話|でんわ}をかけます。', 'I give her a call.'],
    ['「もしもし、{今|いま}どこ？」', '“Hello? Where are you now?”'],
    ['「ごめん！{電車|でんしゃ}が{遅|おく}れているの。」', '“Sorry! The train is late.”'],
    ['「{大丈夫|だいじょうぶ}だよ。カフェで{待|ま}ってるね。」', '“It’s fine. I’ll wait at the café.”'],
    ['{三十分|さんじゅっぷん}{後|ご}、{友達|ともだち}が{来|き}ました。', 'Thirty minutes later, my friend arrived.'],
    ['{二人|ふたり}でケーキを{食|た}べました。とてもおいしかったです。', 'We had cake together. It was really good.'],
  ]),
  story('tama', '{猫|ねこ}のタマ', 'Tama the cat', 'Daily life', [
    ['{私|わたし}の{家|いえ}には{猫|ねこ}がいます。', 'There’s a cat at my house.'],
    ['{名前|なまえ}はタマです。', 'Her name is Tama.'],
    ['タマは{白|しろ}くて、{小|ちい}さいです。', 'Tama is white and small.'],
    ['{毎日|まいにち}、{窓|まど}の{近|ちか}くで{寝|ね}ています。', 'Every day she sleeps near the window.'],
    ['{魚|さかな}が{大好|だいす}きです。でも、{野菜|やさい}は{食|た}べません。', 'She loves fish. But she doesn’t eat vegetables.'],
    ['{夜|よる}になると、{元気|げんき}になります。', 'When night comes, she gets lively.'],
    ['{私|わたし}の{本|ほん}の{上|うえ}に{座|すわ}ります。', 'She sits on my book.'],
    ['{勉強|べんきょう}ができません。でも、かわいいです。', 'I can’t study. But she’s cute.'],
  ]),
  story('dragon-mountain', '{竜|りゅう}の{山|やま}', 'The dragon’s mountain', 'Adventure', [
    ['{北|きた}の{山|やま}に{大|おお}きい{竜|りゅう}がいます。', 'A big dragon lives on the northern mountain.'],
    ['{村|むら}の{人|ひと}たちは{困|こま}っています。', 'The villagers are worried.'],
    ['{勇者|ゆうしゃ}と{三人|さんにん}の{仲間|なかま}が{山|やま}に{登|のぼ}りました。', 'The hero and three companions climbed the mountain.'],
    ['{魔法使|まほうつか}いが{呪文|じゅもん}を{唱|とな}えました。', 'The wizard chanted a spell.'],
    ['でも、{竜|りゅう}は{倒|たお}れませんでした。', 'But the dragon didn’t fall.'],
    ['「{待|ま}って！{竜|りゅう}はけがをしている！」', '“Wait! The dragon is hurt!”'],
    ['{僧侶|そうりょ}が{竜|りゅう}の{傷|きず}を{治|なお}しました。', 'The priest healed the dragon’s wound.'],
    ['{竜|りゅう}は{喜|よろこ}んで、{勇者|ゆうしゃ}たちを{背中|せなか}に{乗|の}せて{飛|と}びました。', 'The dragon was happy, and flew off with the heroes on its back.'],
  ]),
  story('curry-sunday', '{日曜日|にちようび}のカレー', 'Sunday curry', 'Daily life', [
    ['{日曜日|にちようび}、{父|ちち}と{一緒|いっしょ}にカレーを{作|つく}りました。', 'On Sunday I made curry with my dad.'],
    ['まず、スーパーで{肉|にく}と{野菜|やさい}を{買|か}いました。', 'First, we bought meat and vegetables at the supermarket.'],
    ['{父|ちち}は{玉|たま}ねぎを{切|き}りました。', 'Dad chopped the onions.'],
    ['{父|ちち}は{泣|な}いていました。', 'Dad was crying.'],
    ['{私|わたし}はじゃがいもを{洗|あら}いました。', 'I washed the potatoes.'],
    ['{一時間|いちじかん}{後|ご}、カレーができました。', 'An hour later, the curry was ready.'],
    ['「{辛|から}い！でも、おいしい！」', '“Spicy! But delicious!”'],
    ['{来週|らいしゅう}もまた{作|つく}りたいです。', 'I want to make it again next week.'],
  ]),
]
