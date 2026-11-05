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
  story('lost-key', 'なくした{鍵|かぎ}', 'The lost key', 'Daily life', [
    ['{朝|あさ}、{家|いえ}を{出|で}る{前|まえ}に、{鍵|かぎ}がありませんでした。', 'This morning, just before leaving the house, my key was gone.'],
    ['かばんの{中|なか}を{見|み}ました。ありません。', 'I looked in my bag. Not there.'],
    ['{机|つくえ}の{上|うえ}も{見|み}ました。ありません。', 'I looked on the desk too. Not there.'],
    ['「タマ、{知|し}らない？」と{猫|ねこ}に{聞|き}きました。', '“Tama, have you seen it?” I asked the cat.'],
    ['タマは{何|なに}も{言|い}いません。でも、ソファの{下|した}を{見|み}ています。', 'Tama says nothing. But she’s staring under the sofa.'],
    ['ソファの{下|した}に{手|て}を{入|い}れました。', 'I put my hand under the sofa.'],
    ['{鍵|かぎ}がありました！それと、{古|ふる}いおもちゃも。', 'There was the key! And an old toy, too.'],
    ['タマはおもちゃを{見|み}て、うれしそうでした。', 'Tama looked at the toy and seemed happy.'],
  ]),
  story('potion-shop', '{薬屋|くすりや}の{娘|むすめ}', 'The potion shop girl', 'Adventure', [
    ['{村|むら}に{小|ちい}さい{薬屋|くすりや}があります。', 'There’s a small potion shop in the village.'],
    ['{店|みせ}の{娘|むすめ}のミナは、{毎日|まいにち}{森|もり}で{薬草|やくそう}を{取|と}ります。', 'Mina, the shopkeeper’s daughter, gathers herbs in the forest every day.'],
    ['ある{日|ひ}、{傷|きず}だらけの{冒険者|ぼうけんしゃ}が{店|みせ}に{来|き}ました。', 'One day, an adventurer covered in wounds came into the shop.'],
    ['「{薬|くすり}をください。お{金|かね}はあまりありませんが…」', '“Some medicine, please. I don’t have much money, but…”'],
    ['ミナは{一番|いちばん}いい{薬|くすり}を{渡|わた}しました。', 'Mina handed him her best potion.'],
    ['「お{金|かね}はいりません。{元気|げんき}になってください。」', '“No need to pay. Please get well.”'],
    ['{一週間|いっしゅうかん}{後|ご}、{冒険者|ぼうけんしゃ}は{金貨|きんか}を{持|も}って{戻|もど}ってきました。', 'A week later, the adventurer came back carrying gold coins.'],
    ['「あの{薬|くすり}のおかげで、{竜|りゅう}に{勝|か}ちました！」', '“Thanks to that potion, I beat a dragon!”'],
  ]),
  story('rainy-day', '{雨|あめ}の{日|ひ}', 'A rainy day', 'Daily life', [
    ['{今日|きょう}は{朝|あさ}から{雨|あめ}です。', 'It’s been raining since this morning.'],
    ['{公園|こうえん}に{行|い}きたかったですが、{家|いえ}にいます。', 'I wanted to go to the park, but I’m staying home.'],
    ['{弟|おとうと}とゲームをしたり、{漫画|まんが}を{読|よ}んだりしました。', 'I played games with my little brother, read manga, that sort of thing.'],
    ['{昼|ひる}ご{飯|はん}は{母|はは}が{作|つく}ったラーメンでした。', 'Lunch was ramen my mother made.'],
    ['{午後|ごご}、{窓|まど}の{外|そと}を{見|み}ると、{雨|あめ}が{止|や}んでいました。', 'In the afternoon I looked out of the window, and the rain had stopped.'],
    ['{空|そら}に{大|おお}きい{虹|にじ}が{出|で}ていました。', 'A big rainbow had appeared in the sky.'],
    ['{弟|おとうと}と{一緒|いっしょ}に{写真|しゃしん}を{撮|と}りました。', 'I took a photo with my brother.'],
    ['{雨|あめ}の{日|ひ}も{悪|わる}くないですね。', 'Rainy days aren’t so bad after all.'],
  ]),
  story('isekai-skill', '{目|め}が{覚|さ}めたら', 'When I woke up', 'Adventure', [
    ['{目|め}が{覚|さ}めたら、{知|し}らない{森|もり}の{中|なか}にいました。', 'When I woke up, I was in a forest I didn’t know.'],
    ['{空|そら}には{月|つき}が{二|ふた}つありました。', 'There were two moons in the sky.'],
    ['「ここはどこ？」{誰|だれ}も{答|こた}えません。', '“Where am I?” Nobody answers.'],
    ['その{時|とき}、{目|め}の{前|まえ}に{文字|もじ}が{出|で}てきました。', 'Just then, letters appeared in front of my eyes.'],
    ['「ようこそ、{異世界|いせかい}へ。あなたのスキル：{日本語|にほんご}」', '“Welcome to another world. Your skill: Japanese.”'],
    ['「{日本語|にほんご}？それだけ？」', '“Japanese? That’s it?”'],
    ['でも、この{世界|せかい}の{魔法|まほう}の{本|ほん}は、{全部|ぜんぶ}{日本語|にほんご}で{書|か}いてありました。', 'But every book of magic in this world was written in Japanese.'],
    ['{私|わたし}は{世界|せかい}で{一番|いちばん}{強|つよ}い{魔法使|まほうつか}いになりました。', 'I became the most powerful wizard in the world.'],
  ]),
  story('konbini', 'コンビニで', 'At the convenience store', 'Daily life', [
    ['{夜|よる}{十時|じゅうじ}、おなかがすきました。', 'At ten at night, I got hungry.'],
    ['{近|ちか}くのコンビニへ{行|い}きました。', 'I went to the convenience store nearby.'],
    ['おにぎりとお{茶|ちゃ}を{買|か}いました。', 'I bought a rice ball and some tea.'],
    ['「{温|あたた}めますか。」と{店員|てんいん}さんが{聞|き}きました。', '“Shall I heat it up?” the clerk asked.'],
    ['「いいえ、{大丈夫|だいじょうぶ}です。」', '“No, that’s fine.”'],
    ['「{袋|ふくろ}はいりますか。」', '“Do you need a bag?”'],
    ['「はい、お{願|ねが}いします。」', '“Yes, please.”'],
    ['{家|いえ}に{帰|かえ}って、{日本語|にほんご}を{勉強|べんきょう}しながら{食|た}べました。', 'I went home and ate while studying Japanese.'],
  ]),
  story('f-rank', 'Fランクの{冒険者|ぼうけんしゃ}', 'The F-rank adventurer', 'Adventure', [
    ['ケンはまだFランクの{冒険者|ぼうけんしゃ}です。', 'Ken is still an F-rank adventurer.'],
    ['{他|ほか}の{冒険者|ぼうけんしゃ}は「{弱|よわ}いね」と{笑|わら}います。', 'The other adventurers laugh: “He’s so weak.”'],
    ['でも、ケンは{毎日|まいにち}{少|すこ}しずつ{練習|れんしゅう}しています。', 'But Ken practises a little every day.'],
    ['{剣|けん}を{百回|ひゃっかい}{振|ふ}って、{本|ほん}を{一|いち}ページ{読|よ}みます。', 'He swings his sword a hundred times and reads one page of a book.'],
    ['{一年|いちねん}{後|ご}、ケンはSランクになりました。', 'A year later, Ken was S-rank.'],
    ['「どうしてそんなに{強|つよ}くなったの？」', '“How did you get so strong?”'],
    ['「{毎日|まいにち}{少|すこ}しずつ。それだけだよ。」', '“A little every day. That’s all.”'],
    ['{日本語|にほんご}の{勉強|べんきょう}も{同|おな}じですね。', 'Studying Japanese is the same, isn’t it?'],
  ]),
]
