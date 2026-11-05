// The kanji in the deck words: a short English meaning, the main on'yomi
// (Chinese-derived readings, in katakana) and kun'yomi (native readings, in
// hiragana, with the okurigana in brackets). Only the common readings.

export interface KanjiInfo {
  kanji: string
  meaning: string
  on: string[]
  kun: string[]
}

const RAW = `
私|I, private|シ|わたし
人|person|ジン・ニン|ひと
何|what|カ|なに・なん
今|now|コン・キン|いま
日|day, sun|ニチ・ジツ|ひ・か
食|eat, food|ショク|た(べる)
飲|drink|イン|の(む)
行|go, carry out|コウ・ギョウ|い(く)・おこな(う)
来|come|ライ|く(る)・き(ます)・こ(ない)
見|see|ケン|み(る)
水|water|スイ|みず
学|study, learning|ガク|まな(ぶ)
生|life, birth|セイ・ショウ|い(きる)・う(まれる)・なま
先|ahead, previous|セン|さき
友|friend|ユウ|とも
達|plural; reach|タツ|たち
明|bright|メイ・ミョウ|あか(るい)
昨|previous (yesterday)|サク|
時|time, hour|ジ|とき
間|interval, between|カン・ケン|あいだ・ま
誰|who||だれ
本|book, origin|ホン|もと
語|language, word|ゴ|かた(る)
家|house, home|カ・ケ|いえ・や
校|school|コウ|
駅|station|エキ|
電|electricity|デン|
車|car, vehicle|シャ|くるま
会|meet; society|カイ・エ|あ(う)
社|company; shrine|シャ|やしろ
仕|serve, do|シ|つか(える)
事|thing, matter|ジ|こと
分|part, minute; understand|ブン・フン・ブ|わ(かる)・わ(ける)
話|talk, story|ワ|はな(す)・はなし
聞|hear, ask|ブン|き(く)
言|say, word|ゲン・ゴン|い(う)・こと
読|read|ドク|よ(む)
書|write|ショ|か(く)
買|buy|バイ|か(う)
待|wait|タイ|ま(つ)
名|name|メイ・ミョウ|な
前|front, before|ゼン|まえ
大|big|ダイ・タイ|おお(きい)
小|small|ショウ|ちい(さい)・こ
高|tall, expensive|コウ|たか(い)
安|cheap, peaceful|アン|やす(い)
新|new|シン|あたら(しい)
古|old|コ|ふる(い)
好|like|コウ|す(き)
楽|fun; music|ラク・ガク|たの(しい)
難|difficult|ナン|むずか(しい)
毎|every|マイ|
天|heaven, sky|テン|あま
気|spirit, mood|キ・ケ|
雨|rain|ウ|あめ
猫|cat|ビョウ|ねこ
犬|dog|ケン|いぬ
店|shop|テン|みせ
金|gold, money|キン・コン|かね
朝|morning|チョウ|あさ
飯|meal, cooked rice|ハン|めし
母|mother|ボ|はは
父|father|フ|ちち
丈|length; sturdy|ジョウ|たけ
夫|husband, man|フ・フウ|おっと
当|hit, right|トウ|あ(たる)
夜|night|ヤ|よる・よ
起|rise, wake up|キ|お(きる)
寝|sleep|シン|ね(る)
帰|return|キ|かえ(る)
作|make|サク・サ|つく(る)
使|use|シ|つか(う)
思|think|シ|おも(う)
遊|play|ユウ|あそ(ぶ)
歩|walk|ホ|ある(く)
走|run|ソウ|はし(る)
休|rest|キュウ|やす(む)
兄|older brother|ケイ・キョウ|あに
姉|older sister|シ|あね
弟|younger brother|ダイ・テイ|おとうと
妹|younger sister|マイ|いもうと
子|child|シ・ス|こ
供|attend, offer|キョウ・ク|とも・そな(える)
一|one|イチ・イツ|ひと(つ)
緒|cord; beginning|ショ・チョ|お
少|few, little|ショウ|すく(ない)・すこ(し)
全|all, whole|ゼン|まった(く)
部|part, section|ブ|
料|fee, materials|リョウ|
理|reason, logic|リ|
肉|meat|ニク|
魚|fish|ギョ|さかな・うお
野|field|ヤ|の
菜|vegetable, greens|サイ|な
茶|tea|チャ・サ|
手|hand|シュ|て
目|eye|モク|め
頭|head|トウ・ズ|あたま
体|body|タイ|からだ
病|illness|ビョウ|や(む)
屋|roof, shop, house|オク|や
道|road, way|ドウ|みち
町|town|チョウ|まち
山|mountain|サン|やま
海|sea|カイ|うみ
空|sky, empty|クウ|そら・あ(く)
花|flower|カ|はな
映|reflect, project|エイ|うつ(る)
画|picture|ガ・カク|
音|sound|オン|おと
写|copy, photograph|シャ|うつ(す)
真|true, reality|シン|ま
勉|effort|ベン|
強|strong|キョウ|つよ(い)
週|week|シュウ|
末|end|マツ|すえ
年|year|ネン|とし
暑|hot (weather)|ショ|あつ(い)
寒|cold|カン|さむ(い)
早|early|ソウ|はや(い)
遅|late, slow|チ|おそ(い)・おく(れる)
多|many|タ|おお(い)
長|long; chief|チョウ|なが(い)
短|short|タン|みじか(い)
近|near|キン|ちか(い)
遠|far|エン|とお(い)
忙|busy|ボウ|いそが(しい)
静|quiet|セイ|しず(か)
元|origin|ゲン・ガン|もと
上|up, above|ジョウ|うえ・あ(がる)
下|down, below|カ・ゲ|した・さ(がる)
嫌|dislike|ケン|きら(い)・いや
紙|paper|シ|かみ
昼|noon, daytime|チュウ|ひる
泳|swim|エイ|およ(ぐ)
冒|risk, brave|ボウ|おか(す)
険|steep, danger|ケン|けわ(しい)
者|person (-er)|シャ|もの
勇|courage|ユウ|いさ(む)
魔|demon, magic|マ|
法|law, method|ホウ|
剣|sword|ケン|つるぎ
敵|enemy|テキ|かたき
仲|relationship|チュウ|なか
物|thing|ブツ・モツ|もの
弱|weak|ジャク|よわ(い)
戦|war, fight|セン|たたか(う)
倒|topple|トウ|たお(す)・たお(れる)
守|protect|シュ|まも(る)
逃|escape|トウ|に(げる)
助|help|ジョ|たす(ける)
王|king|オウ|
竜|dragon|リュウ|たつ
武|military|ブ・ム|
器|tool, container|キ|うつわ
盾|shield|ジュン|たて
攻|attack|コウ|せ(める)
撃|strike, shoot|ゲキ|う(つ)
弓|bow|キュウ|ゆみ
鎧|armor|ガイ|よろい
呪|curse, spell|ジュ|のろ(う)
文|writing, sentence|ブン・モン|ふみ
経|pass through|ケイ|へ(る)
験|test, effect|ケン|
値|value, price|チ|ね・あたい
力|power|リョク・リキ|ちから
宝|treasure|ホウ|たから
箱|box||はこ
貨|goods, coin|カ|
依|depend on|イ|
頼|request, rely on|ライ|たの(む)・たよ(る)
地|ground, land|チ・ジ|
図|map, drawing|ズ・ト|はか(る)
鍵|key|ケン|かぎ
薬|medicine|ヤク|くすり
傷|wound|ショウ|きず
命|life; command|メイ・ミョウ|いのち
死|death|シ|し(ぬ)
危|danger|キ|あぶ(ない)
村|village|ソン|むら
城|castle|ジョウ|しろ
森|forest|シン|もり
旅|trip, journey|リョ|たび
世|world, generation|セイ・セ|よ
界|world, boundary|カイ|
異|different|イ|こと(なる)
`

const split = (s: string) => (s ? s.split('・') : [])

export const KANJI: Record<string, KanjiInfo> = Object.fromEntries(
  RAW.trim()
    .split('\n')
    .map((line) => {
      const [kanji, meaning, on, kun] = line.split('|')
      return [kanji, { kanji, meaning, on: split(on), kun: split(kun) }]
    }),
)
