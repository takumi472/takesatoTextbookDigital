/* =====================================================
   ひらがな HTMLインタラクティブ版 Logic & Complete Content
   ===================================================== */

const STORAGE_MEMO = "hiragana_html_yomikata_v1";

function loadMemos() {
  try { return JSON.parse(localStorage.getItem(STORAGE_MEMO) || "{}"); } catch { return {}; }
}
function saveMemo(char, val) {
  const m = loadMemos();
  m[char] = val;
  try { localStorage.setItem(STORAGE_MEMO, JSON.stringify(m)); } catch {}
}

let speechSlow = true;
let preferredJaVoice = null;

function pickJapaneseVoice() {
  if (!("speechSynthesis" in window)) return null;
  const voices = window.speechSynthesis.getVoices() || [];
  const jaVoices = voices.filter((v) => /^ja/i.test(v.lang));
  if (jaVoices.length === 0) return null;

  // Prefer clear, natural Japanese voices on macOS / Chrome / Edge
  const priorities = ["Kyoko (Enhanced)", "Kyoko", "Google 日本語", "Nanami", "O-Ren", "Haruka", "Hattori"];
  for (const name of priorities) {
    const found = jaVoices.find((v) => v.name.includes(name));
    if (found) return found;
  }
  return jaVoices.find((v) => v.localService) || jaVoices[0];
}

if ("speechSynthesis" in window) {
  preferredJaVoice = pickJapaneseVoice();
  window.speechSynthesis.onvoiceschanged = () => {
    preferredJaVoice = pickJapaneseVoice();
  };
}

function speakJa(text) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "ja-JP";
  if (!preferredJaVoice) preferredJaVoice = pickJapaneseVoice();
  if (preferredJaVoice) u.voice = preferredJaVoice;
  // Clear and slow by default (0.62x), toggleable to normal (0.85x)
  u.rate = speechSlow ? 0.62 : 0.85;
  u.pitch = 1.0;
  u.volume = 1.0;
  window.speechSynthesis.speak(u);
}

function normalizeJa(str) {
  return (str || "").trim().replace(/\s+/g, "").replace(/[。、]/g, "");
}

// ==================== ALL 20 PAGES DATA ====================
const PAGES = [
  { id: 1, label: "表紙", title: "ひらがな（表紙）", type: "cover" },
  { id: 2, label: "p.1", title: "もじを さがしてください・50音表", type: "p1_seasons" },
  {
    id: 3, label: "p.2", title: "あ行・か行 の練習", type: "kana",
    subtitle: "あ・い・う・え・お ／ か・き・く・け・こ",
    chars: [
      { c: "あ", r: "a" }, { c: "い", r: "i" }, { c: "う", r: "u" }, { c: "え", r: "e" }, { c: "お", r: "o" },
      { c: "か", r: "ka" }, { c: "き", r: "ki" }, { c: "く", r: "ku" }, { c: "け", r: "ke" }, { c: "こ", r: "ko" },
    ],
  },
  {
    id: 4, label: "p.3", title: "さ行・た行 の練習", type: "kana",
    subtitle: "さ・し・す・せ・そ ／ た・ち・つ・て・と",
    chars: [
      { c: "さ", r: "sa" }, { c: "し", r: "shi" }, { c: "す", r: "su" }, { c: "せ", r: "se" }, { c: "そ", r: "so" },
      { c: "た", r: "ta" }, { c: "ち", r: "chi" }, { c: "つ", r: "tsu" }, { c: "て", r: "te" }, { c: "と", r: "to" },
    ],
  },
  {
    id: 5, label: "p.4", title: "れんしゅう 1（あ〜と）", type: "renshu",
    subtitle: "あ行〜た行の文字を使ったことばを読んで・書いて練習しましょう。",
    words: [
      { icon: "⏰", w: "とけい", r: "tokei", mean: "時計" },
      { icon: "🪑", w: "いす", r: "isu", mean: "椅子" },
      { icon: "🗺️", w: "せかい", r: "sekai", mean: "世界" },
      { icon: "🪵", w: "くし", r: "kushi", mean: "櫛" },
      { icon: "🌳", w: "き", r: "ki", mean: "木" },
      { icon: "👣", w: "あしあと", r: "ashiato", mean: "足跡" },
      { icon: "🧍", w: "おとこ", r: "otoko", mean: "男" },
      { icon: "🖥️", w: "つくえ", r: "tsukue", mean: "机" },
      { icon: "🤝", w: "あいさつ", r: "aisatsu", mean: "挨拶" },
      { icon: "☂️", w: "かさ", r: "kasa", mean: "傘" },
      { icon: "😊", w: "かお", r: "kao", mean: "顔" },
      { icon: "🐄", w: "うし", r: "ushi", mean: "牛" },
      { icon: "🐙", w: "たこ", r: "tako", mean: "蛸" },
      { icon: "🦑", w: "いか", r: "ika", mean: "烏賊" },
      { icon: "👟", w: "くつ", r: "kutsu", mean: "靴" },
      { icon: "🥁", w: "たいこ", r: "taiko", mean: "太鼓" },
    ],
  },
  {
    id: 6, label: "p.5", title: "な行・は行 の練習", type: "kana",
    subtitle: "な・に・ぬ・ね・の ／ は・ひ・ふ・へ・ほ",
    chars: [
      { c: "な", r: "na" }, { c: "に", r: "ni" }, { c: "ぬ", r: "nu" }, { c: "ね", r: "ne" }, { c: "の", r: "no" },
      { c: "は", r: "ha" }, { c: "ひ", r: "hi" }, { c: "ふ", r: "fu" }, { c: "へ", r: "he" }, { c: "ほ", r: "ho" },
    ],
  },
  {
    id: 7, label: "p.6", title: "ま行・や行 ＋ のばすおと", type: "kana",
    subtitle: "ま・み・む・め・も ／ や・ゆ・よ と長音のルール",
    chars: [
      { c: "ま", r: "ma" }, { c: "み", r: "mi" }, { c: "む", r: "mu" }, { c: "め", r: "me" }, { c: "も", r: "mo" },
      { c: "や", r: "ya" }, { c: "ゆ", r: "yu" }, { c: "よ", r: "yo" },
    ],
    extra: "nobasu",
  },
  {
    id: 8, label: "p.7", title: "れんしゅう 2（な〜よ）", type: "renshu",
    subtitle: "動物・天気・家族などのことばを練習しましょう。",
    words: [
      { icon: "🐶", w: "いぬ", r: "inu", mean: "犬" },
      { icon: "🐱", w: "ねこ", r: "neko", mean: "猫" },
      { icon: "🐬", w: "いるか", r: "iruka", mean: "海豚" },
      { icon: "🦓", w: "しまうま", r: "shimauma", mean: "縞馬" },
      { icon: "🐢", w: "かめ", r: "kame", mean: "亀" },
      { icon: "🐿️", w: "りす", r: "risu", mean: "栗鼠" },
      { icon: "🚢", w: "ふね", r: "fune", mean: "船" },
      { icon: "✈️", w: "ひこうき", r: "hikouki", mean: "飛行機" },
      { icon: "💊", w: "くすり", r: "kusuri", mean: "薬" },
      { icon: "✂️", w: "はさみ", r: "hasami", mean: "鋏" },
      { icon: "🕯️", w: "ろうそく", r: "rousoku", mean: "蝋燭" },
      { icon: "☀️", w: "はれ", r: "hare", mean: "晴れ" },
      { icon: "☁️", w: "くもり", r: "kumori", mean: "曇り" },
      { icon: "🌧️", w: "あめ", r: "ame", mean: "雨" },
      { icon: "⛈️", w: "かみなり", r: "kaminari", mean: "雷" },
      { icon: "🌅", w: "あさ", r: "asa", mean: "朝" },
      { icon: "🌞", w: "ひる", r: "hiru", mean: "昼" },
      { icon: "🌙", w: "よる", r: "yoru", mean: "夜" },
      { icon: "👦", w: "おにいさん", r: "oniisan", mean: "お兄さん（あに）" },
      { icon: "👩", w: "おねえさん", r: "oneesan", mean: "お姉さん（あね）" },
      { icon: "🧒", w: "おとうと", r: "otouto", mean: "弟" },
      { icon: "👧", w: "いもうと", r: "imouto", mean: "妹" },
      { icon: "☀️", w: "たいよう", r: "taiyou", mean: "太陽" },
      { icon: "☁️", w: "くも", r: "kumo", mean: "雲" },
      { icon: "🌙", w: "つき", r: "tsuki", mean: "月" },
      { icon: "⭐", w: "ほし", r: "hoshi", mean: "星" },
    ],
  },
  {
    id: 9, label: "p.8", title: "ら行・わ行 ＋「ん」とつまるおと", type: "kana",
    subtitle: "ら・り・る・れ・ろ ／ わ・を・ん と拍のルール",
    chars: [
      { c: "ら", r: "ra" }, { c: "り", r: "ri" }, { c: "る", r: "ru" }, { c: "れ", r: "re" }, { c: "ろ", r: "ro" },
      { c: "わ", r: "wa" }, { c: "を", r: "o (wo)" }, { c: "ん", r: "n" },
    ],
    extra: "n_tsumaru",
  },
  {
    id: 10, label: "p.9", title: "れんしゅう 3（ん・っ）", type: "renshu",
    subtitle: "「ん」や小さい「っ」が入ることばを練習しましょう。",
    words: [
      { icon: "🍊", w: "みかん", r: "mikan", mean: "蜜柑" },
      { icon: "🫖", w: "やかん", r: "yakan", mean: "薬缶" },
      { icon: "💮", w: "はんこ", r: "hanko", mean: "判子" },
      { icon: "💒", w: "けっこんしき", r: "kekkonshiki", mean: "結婚式" },
      { icon: "🚭", w: "きんえん", r: "kin'en", mean: "禁煙" },
      { icon: "🚅", w: "しんかんせん", r: "shinkansen", mean: "新幹線" },
      { icon: "📕", w: "ほん", r: "hon", mean: "本" },
      { icon: "🎌", w: "こっき", r: "kokki", mean: "国旗" },
      { icon: "👨", w: "おとうさん", r: "otousan", mean: "お父さん（ちち）" },
      { icon: "👩", w: "おかあさん", r: "okaasan", mean: "お母さん（はは）" },
      { icon: "⬅️", w: "いっぽうつうこう", r: "ippoutsuukou", mean: "一方通行" },
      { icon: "🧑‍🏫", w: "せんせい", r: "sensei", mean: "先生" },
      { icon: "🏢", w: "いっかい", r: "ikkai", mean: "1F（一階）" },
      { icon: "3️⃣", w: "みっつ", r: "mittsu", mean: "3つ" },
      { icon: "4️⃣", w: "よっつ", r: "yottsu", mean: "4つ" },
      { icon: "6️⃣", w: "むっつ", r: "muttsu", mean: "6つ" },
      { icon: "8️⃣", w: "やっつ", r: "yattsu", mean: "8つ" },
      { icon: "🫧", w: "たくさん", r: "takusan", mean: "沢山" },
      { icon: "📅", w: "さんねんかん", r: "sannenkan", mean: "三年間" },
      { icon: "🧼", w: "せっけん", r: "sekken", mean: "石鹸" },
    ],
  },
  {
    id: 11, label: "p.10", title: "濁音・半濁音（が〜ぴ）", type: "kana",
    subtitle: "点々（゛）と丸（゜）のつく文字を練習しましょう。",
    chars: [
      { c: "が", r: "ga" }, { c: "ぎ", r: "gi" }, { c: "ぐ", r: "gu" }, { c: "げ", r: "ge" }, { c: "ご", r: "go" },
      { c: "ざ", r: "za" }, { c: "じ", r: "ji" }, { c: "ず", r: "zu" }, { c: "ぜ", r: "ze" }, { c: "ぞ", r: "zo" },
      { c: "だ", r: "da" }, { c: "ぢ", r: "ji (di)" }, { c: "づ", r: "zu (du)" }, { c: "で", r: "de" }, { c: "ど", r: "do" },
      { c: "ば", r: "ba" }, { c: "び", r: "bi" }, { c: "ぶ", r: "bu" }, { c: "べ", r: "be" }, { c: "ぼ", r: "bo" },
      { c: "ぱ", r: "pa" }, { c: "ぴ", r: "pi" },
    ],
  },
  {
    id: 12, label: "p.11", title: "半濁音・拗音（ぷ〜にょ）", type: "kana",
    subtitle: "ぷ・ぺ・ぽ ／ きゃ〜にょ",
    chars: [
      { c: "ぷ", r: "pu" }, { c: "ぺ", r: "pe" }, { c: "ぽ", r: "po" },
      { c: "きゃ", r: "kya", yoon: true }, { c: "きゅ", r: "kyu", yoon: true }, { c: "きょ", r: "kyo", yoon: true },
      { c: "しゃ", r: "sha", yoon: true }, { c: "しゅ", r: "shu", yoon: true }, { c: "しょ", r: "sho", yoon: true },
      { c: "ちゃ", r: "cha", yoon: true }, { c: "ちゅ", r: "chu", yoon: true }, { c: "ちょ", r: "cho", yoon: true },
      { c: "にゃ", r: "nya", yoon: true }, { c: "にゅ", r: "nyu", yoon: true }, { c: "にょ", r: "nyo", yoon: true },
    ],
  },
  {
    id: 13, label: "p.12", title: "れんしゅう 4（濁音・半濁音）", type: "renshu",
    subtitle: "濁音・半濁音や計算のことばを練習しましょう。",
    words: [
      { icon: "💍", w: "ゆびわ", r: "yubiwa", mean: "指輪" },
      { icon: "👓", w: "めがね", r: "megane", mean: "眼鏡" },
      { icon: "☎️", w: "でんわ", r: "denwa", mean: "電話" },
      { icon: "🧤", w: "てぶくろ", r: "tebukuro", mean: "手袋" },
      { icon: "🍲", w: "なべ", r: "nabe", mean: "鍋" },
      { icon: "✏️", w: "えんぴつ", r: "enpitsu", mean: "鉛筆" },
      { icon: "🚬", w: "たばこ", r: "tabako", mean: "煙草" },
      { icon: "🗻", w: "ふじさん", r: "fujisan", mean: "富士山" },
      { icon: "⛄", w: "ゆきだるま", r: "yukidaruma", mean: "雪だるま" },
      { icon: "✉️", w: "てがみ", r: "tegami", mean: "手紙" },
      { icon: "🗾", w: "にほんちず", r: "nihonchizu", mean: "日本地図" },
      { icon: "🎏", w: "こいのぼり", r: "koinobori", mean: "鯉のぼり" },
      { icon: "🥚", w: "ゆでたまご", r: "yudetamago", mean: "茹で卵" },
      { icon: "🍙", w: "おにぎり", r: "onigiri", mean: "お握り" },
      { icon: "🎩", w: "ぼうし", r: "boushi", mean: "帽子" },
      { icon: "👴", w: "おじいさん", r: "ojiisan", mean: "お爺さん" },
      { icon: "👵", w: "おばあさん", r: "obaasan", mean: "お婆さん" },
      { icon: "🌼", w: "たんぽぽ", r: "tanpopo", mean: "蒲公英" },
      { icon: "➕", w: "たしざん", r: "tashizan", mean: "2 + 3" },
      { icon: "➖", w: "ひきざん", r: "hikizan", mean: "8 - 5" },
      { icon: "✖️", w: "かけざん", r: "kakezan", mean: "7 × 6" },
      { icon: "➗", w: "わりざん", r: "warizan", mean: "9 ÷ 3" },
    ],
  },
  {
    id: 14, label: "p.13", title: "拗音つづき（ひゃ〜じゅ）", type: "kana",
    subtitle: "ひゃ〜ひょ ／ みゃ〜みょ ／ りゃ〜りょ ／ ぎゃ〜ぎょ ／ じゃ・じゅ",
    chars: [
      { c: "ひゃ", r: "hya", yoon: true }, { c: "ひゅ", r: "hyu", yoon: true }, { c: "ひょ", r: "hyo", yoon: true },
      { c: "みゃ", r: "mya", yoon: true }, { c: "みゅ", r: "myu", yoon: true }, { c: "みょ", r: "myo", yoon: true },
      { c: "りゃ", r: "rya", yoon: true }, { c: "りゅ", r: "ryu", yoon: true }, { c: "りょ", r: "ryo", yoon: true },
      { c: "ぎゃ", r: "gya", yoon: true }, { c: "ぎゅ", r: "gyu", yoon: true }, { c: "ぎょ", r: "gyo", yoon: true },
      { c: "じゃ", r: "ja", yoon: true }, { c: "じゅ", r: "ju", yoon: true },
    ],
  },
  {
    id: 15, label: "p.14", title: "拗音＋助詞・似ている文字と音", type: "kana",
    subtitle: "じょ・びゃ〜ぴょ ／「じ・ぢ」「は・を・へ」／ 似ている文字と音",
    chars: [
      { c: "じょ", r: "jo", yoon: true },
      { c: "びゃ", r: "bya", yoon: true }, { c: "びゅ", r: "byu", yoon: true }, { c: "びょ", r: "byo", yoon: true },
      { c: "ぴゃ", r: "pya", yoon: true }, { c: "ぴゅ", r: "pyu", yoon: true }, { c: "ぴょ", r: "pyo", yoon: true },
    ],
    extra: "p14_rules",
  },
  {
    id: 16, label: "p.15", title: "れんしゅう 5（拗音のことば）", type: "renshu",
    subtitle: "小さい「ゃ・ゅ・ょ」が入ることばを練習しましょう。",
    words: [
      { icon: "🥒", w: "きゅうり", r: "kyuuri", mean: "胡瓜" },
      { icon: "🎃", w: "かぼちゃ", r: "kabocha", mean: "南瓜" },
      { icon: "🔪", w: "ほうちょう", r: "houchou", mean: "包丁" },
      { icon: "🍚", w: "ちゃわん", r: "chawan", mean: "茶碗" },
      { icon: "🫖", w: "こうちゃ", r: "koucha", mean: "紅茶" },
      { icon: "🥛", w: "ぎゅうにゅう", r: "gyuunyuu", mean: "牛乳" },
      { icon: "👶", w: "あかちゃん", r: "akachan", mean: "赤ちゃん" },
      { icon: "⛪", w: "きょうかい", r: "kyoukai", mean: "教会" },
      { icon: "🦋", w: "ちょうちょ", r: "choucho", mean: "蝶々" },
      { icon: "📐", w: "さんかくじょうぎ", r: "sankakujougi", mean: "三角定規" },
      { icon: "📌", w: "がびょう", r: "gabyou", mean: "画鋲" },
      { icon: "♟️", w: "しょうぎ", r: "shougi", mean: "将棋" },
      { icon: "🥋", w: "じゅうどう", r: "juudou", mean: "柔道" },
      { icon: "🧳", w: "りょこう", r: "ryokou", mean: "旅行" },
      { icon: "🚃", w: "でんしゃ", r: "densha", mean: "電車" },
      { icon: "🚲", w: "じてんしゃ", r: "jitensha", mean: "自転車" },
      { icon: "🚑", w: "きゅうきゅうしゃ", r: "kyuukyuusha", mean: "救急車" },
      { icon: "👨‍⚕️", w: "おいしゃさん", r: "oishasan", mean: "お医者さん" },
    ],
  },
  {
    id: 17, label: "p.16", title: "れんしゅう 6（まとめ・文）", type: "renshu",
    subtitle: "場所のことばや、短い日本語の文を読んで・書いてみましょう。",
    words: [
      { icon: "🏫", w: "がっこう", r: "gakkou", mean: "学校" },
      { icon: "🏣", w: "ゆうびんきょく", r: "yuubinkyoku", mean: "郵便局" },
      { icon: "🏢", w: "かいしゃ", r: "kaisha", mean: "会社" },
      { icon: "🚒", w: "しょうぼうしょ", r: "shoubousho", mean: "消防署" },
      { icon: "🏥", w: "びょういん", r: "byouin", mean: "病院" },
      { icon: "🅿️", w: "ちゅうしゃじょう", r: "chuushajou", mean: "駐車場" },
      { icon: "🪙", w: "さんびゃくえん", r: "sanbyakuen", mean: "300円" },
      { icon: "✊✌️🖐️", w: "じゃんけんぽん", r: "jankenpon", mean: "じゃんけん" },
      { icon: "☕", w: "おはようございます。", r: "ohayou gozaimasu.", mean: "朝のあいさつ" },
      { icon: "🍎🍊", w: "りんごと、みかんをかいました。", r: "ringo to, mikan o kaimashita.", mean: "買いました" },
      { icon: "🗼", w: "とうきょうへいきます。", r: "toukyou e ikimasu.", mean: "東京へ行きます" },
      { icon: "🎅", w: "このひとはだれですか。", r: "kono hito wa dare desu ka.", mean: "この人は誰ですか" },
    ],
  },
  { id: 18, label: "p.17", title: "すうじ・ひづけ", type: "p17_numbers" },
  { id: 19, label: "p.18", title: "とくべつのかきかた・印刷と筆記体", type: "p18_special" },
];

// ==================== APP STATE ====================
let currentIndex = 0;

const els = {
  tocSidebar: document.getElementById("toc-sidebar"),
  tocToggleBtn: document.getElementById("toc-toggle-btn"),
  tocCloseBtn: document.getElementById("toc-close-btn"),
  tocList: document.getElementById("toc-list"),
  pageContainer: document.getElementById("page-container"),
  prevSecBtn: document.getElementById("prev-sec-btn"),
  nextSecBtn: document.getElementById("next-sec-btn"),
  pageIndicator: document.getElementById("page-indicator"),
  toggleSpeedBtn: document.getElementById("toggle-speed-btn"),
  toggleRomajiBtn: document.getElementById("toggle-romaji-btn"),
};

function saveBookProgress(pageNum) {
  try {
    const map = JSON.parse(localStorage.getItem("kasukabe_textbook_progress_v1") || "{}");
    map["01-hiragana"] = pageNum;
    localStorage.setItem("kasukabe_textbook_progress_v1", JSON.stringify(map));
    localStorage.setItem("kasukabe_textbook_last_v1", JSON.stringify({ bookId: "01-hiragana", page: pageNum, updatedAt: Date.now() }));
  } catch {}
}

function init() {
  renderTOC();
  bindGlobalEvents();
  const hashNum = Number((window.location.hash || "").replace("#p", ""));
  if (hashNum >= 1 && hashNum <= PAGES.length) {
    currentIndex = hashNum - 1;
  }
  renderPage(currentIndex);
}

function bindGlobalEvents() {
  els.tocToggleBtn.addEventListener("click", () => els.tocSidebar.classList.toggle("open"));
  els.tocCloseBtn.addEventListener("click", () => els.tocSidebar.classList.remove("open"));

  els.prevSecBtn.addEventListener("click", () => goTo(currentIndex - 1));
  els.nextSecBtn.addEventListener("click", () => goTo(currentIndex + 1));

  els.toggleSpeedBtn.addEventListener("click", () => {
    speechSlow = !speechSlow;
    els.toggleSpeedBtn.classList.toggle("active", speechSlow);
    els.toggleSpeedBtn.textContent = speechSlow ? "音声：ゆっくり" : "音声：ふつう";
  });

  els.toggleRomajiBtn.addEventListener("click", () => {
    const hidden = document.body.classList.toggle("hide-romaji");
    els.toggleRomajiBtn.classList.toggle("active", !hidden);
    els.toggleRomajiBtn.textContent = hidden ? "ローマ字 OFF" : "ローマ字 ON";
  });
}

function renderTOC() {
  els.tocList.innerHTML = "";
  PAGES.forEach((p, idx) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "toc-item";
    btn.dataset.idx = String(idx);
    btn.innerHTML = `<span class="toc-pnum">${p.label}</span><span>${p.title}</span>`;
    btn.addEventListener("click", () => {
      goTo(idx);
      els.tocSidebar.classList.remove("open");
    });
    els.tocList.appendChild(btn);
  });
}

function goTo(idx) {
  if (idx < 0 || idx >= PAGES.length) return;
  currentIndex = idx;
  history.replaceState(null, "", `#p${PAGES[idx].id}`);
  renderPage(idx);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderPage(idx) {
  const page = PAGES[idx];
  saveBookProgress(idx + 1);
  els.tocList.querySelectorAll(".toc-item").forEach((el) => {
    el.classList.toggle("active", Number(el.dataset.idx) === idx);
  });
  els.prevSecBtn.disabled = idx === 0;
  els.nextSecBtn.disabled = idx === PAGES.length - 1;
  els.pageIndicator.textContent = `${page.label}（${idx + 1} / ${PAGES.length}）`;

  if (page.type === "cover") renderCover(page);
  else if (page.type === "p1_seasons") renderP1Seasons(page);
  else if (page.type === "kana") renderKanaPage(page);
  else if (page.type === "renshu") renderRenshuPage(page);
  else if (page.type === "p17_numbers") renderP17Numbers(page);
  else if (page.type === "p18_special") renderP18Special(page);
}

// ==================== PAGE RENDERERS ====================
function pageHeaderHTML(page, subtitle = "") {
  return `
    <div class="page-header-row">
      <div>
        <h2 class="page-heading">${page.title}</h2>
        ${subtitle ? `<p class="page-sub">${subtitle}</p>` : ""}
      </div>
      <span class="page-tag">${page.label}</span>
    </div>
  `;
}

function renderCover(page) {
  const rows = [
    ["あ", "い", "う", "え", "お"],
    ["か", "き", "く", "け", "こ"],
    ["さ", "し", "す", "せ", "そ"],
    ["た", "ち", "つ", "て", "と"],
    ["な", "に", "ぬ", "ね", "の"],
    ["は", "ひ", "ふ", "へ", "ほ"],
    ["ま", "み", "む", "め", "も"],
    ["や", "(い)", "ゆ", "(え)", "よ"],
    ["ら", "り", "る", "れ", "ろ"],
    ["わ", "(い)", "(う)", "(え)", "を"],
    ["ん", "", "", "", ""],
  ];

  els.pageContainer.innerHTML = `
    <div class="cover-hero">
      <h2 class="cover-title">ひらがな</h2>
      <p class="page-sub" style="margin-bottom:16px">文字をクリックすると発音を聞くことができます 🔊</p>
      <div class="cover-grid" id="cover-grid"></div>
    </div>
    <div class="staff-note">
      <h3>スタッフの方へ ……使用上の注意……</h3>
      <ol>
        <li>「よみかた」の欄に母国語で記入してテキストを完成させて下さい。</li>
        <li>仮名は書いてある通りに読めばいいと考えがちですが、清音・濁音以外はかなり複雑です。長音（のばす音）・促音（つまる音）・拗音（きゃ・きゅ・きょなど）・助詞（を・は・へ）などは丁寧に指導してください。<br /><small>注：「時計」「先生」などは「トケー」「センセー」でなく、「トケイ」「センセイ」あるいは「イ」と「エ」の中間の音で発音する人も多いようですが、このテキストでは長音として扱いました。</small></li>
        <li>仮名文字と拍の関係について必ず説明しましょう。特に半母音「ん」は外国語では1拍分として数えられていないことが多く、書くときに忘れることが多いようです。また、促音（ちいさい「っ」）・長音（のばす音）も同様に聞き取り、書き取りで間違えやすいもののひとつです。</li>
      </ol>
    </div>
  `;

  const grid = document.getElementById("cover-grid");
  rows.flat().forEach((cell) => {
    if (!cell) {
      grid.appendChild(document.createElement("div"));
    } else if (cell.startsWith("(")) {
      const span = document.createElement("span");
      span.className = "cover-char small-muted";
      span.textContent = cell.slice(1, -1);
      grid.appendChild(span);
    } else {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "cover-char";
      btn.textContent = cell;
      btn.addEventListener("click", () => speakJa(cell));
      grid.appendChild(btn);
    }
  });
}

function renderP1Seasons(page) {
  const seasons = [
    { emoji: "🌸", romaji: "h a  r u", ans: "はる", label: "春" },
    { emoji: "🏄", romaji: "n a  t u", ans: "なつ", label: "夏" },
    { emoji: "🍁", romaji: "a  k i", ans: "あき", label: "秋" },
    { emoji: "⛄", romaji: "h u  y u", ans: "ふゆ", label: "冬" },
  ];

  const tableRows = [
    ["", ["あ","a"], ["い","i"], ["う","u"], ["え","e"], ["お","o"]],
    ["k", ["か","ka"], ["き","ki"], ["く","ku"], ["け","ke"], ["こ","ko"]],
    ["s", ["さ","sa"], ["し","shi"], ["す","su"], ["せ","se"], ["そ","so"]],
    ["t", ["た","ta"], ["ち","chi"], ["つ","tsu"], ["て","te"], ["と","to"]],
    ["n", ["な","na"], ["に","ni"], ["ぬ","nu"], ["ね","ne"], ["の","no"]],
    ["h", ["は","ha"], ["ひ","hi"], ["ふ","fu"], ["へ","he"], ["ほ","ho"]],
    ["m", ["ま","ma"], ["み","mi"], ["む","mu"], ["め","me"], ["も","mo"]],
    ["y", ["や","ya"], null, ["ゆ","yu"], null, ["よ","yo"]],
    ["r", ["ら","ra"], ["り","ri"], ["る","ru"], ["れ","re"], ["ろ","ro"]],
    ["w", ["わ","wa"], null, null, null, ["を","o"]],
  ];

  els.pageContainer.innerHTML = `
    ${pageHeaderHTML(page, "《スタッフへ》50音図のしくみ、および発音と文字の関係、1音と1字が対応していること・音の長さは同じことなども教えてあげましょう")}
    <div class="season-grid" id="season-grid"></div>
    <div class="check-bar" style="margin-top:0; margin-bottom:24px;">
      <button id="check-seasons-btn" class="btn primary" type="button">答え合わせ</button>
      <button id="show-seasons-btn" class="btn" type="button">答えを見る</button>
      <span id="season-score" class="score-badge"></span>
    </div>

    <h3 style="margin:0 0 8px; font-family:var(--font-round); color:var(--primary)">50音表（クリックで音声再生 🔊）</h3>
    <table class="gojuon-table">
      <thead>
        <tr><th></th><th>a</th><th>i</th><th>u</th><th>e</th><th>o</th></tr>
      </thead>
      <tbody id="gojuon-body"></tbody>
    </table>
    <div style="text-align:right; margin-top:10px;">
      <button type="button" class="action-pill" id="n-sound-btn" style="font-family:var(--font-kyokasho); font-size:20px;">（ん）🔊</button>
    </div>
  `;

  const sGrid = document.getElementById("season-grid");
  const inputs = [];
  seasons.forEach((s) => {
    const card = document.createElement("div");
    card.className = "season-card";
    card.innerHTML = `
      <div class="season-emoji">${s.emoji}</div>
      <div class="season-romaji">${s.romaji}</div>
      <input type="text" class="season-input" placeholder="ひらがな" maxlength="4" />
    `;
    const inp = card.querySelector("input");
    inputs.push({ inp, ans: s.ans });
    sGrid.appendChild(card);
  });

  document.getElementById("check-seasons-btn").addEventListener("click", () => {
    let ok = 0;
    inputs.forEach(({ inp, ans }) => {
      const right = normalizeJa(inp.value) === ans;
      inp.classList.toggle("correct", right);
      inp.classList.toggle("wrong", !right);
      if (right) ok++;
    });
    document.getElementById("season-score").textContent = `${ok} / ${inputs.length} 問せいかい！`;
  });

  document.getElementById("show-seasons-btn").addEventListener("click", () => {
    inputs.forEach(({ inp, ans }) => {
      inp.value = ans;
      inp.classList.add("correct");
      inp.classList.remove("wrong");
    });
  });

  const tbody = document.getElementById("gojuon-body");
  tableRows.forEach((row) => {
    const tr = document.createElement("tr");
    const th = document.createElement("th");
    th.textContent = row[0];
    tr.appendChild(th);
    for (let i = 1; i <= 5; i++) {
      const td = document.createElement("td");
      const cell = row[i];
      if (cell) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "kana-sound-btn";
        btn.innerHTML = `<span>${cell[0]}</span><span class="romaji">${cell[1]}</span>`;
        btn.addEventListener("click", () => speakJa(cell[0]));
        td.appendChild(btn);
      }
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  });

  document.getElementById("n-sound-btn").addEventListener("click", () => speakJa("ん"));
}

function renderKanaPage(page) {
  const memos = loadMemos();
  els.pageContainer.innerHTML = `
    ${pageHeaderHTML(page, page.subtitle + "（文字クリックで発音・マス目に直接なぞり書き練習ができます）")}
    <div class="kana-practice-list" id="kana-list"></div>
    <div id="kana-extra"></div>
  `;

  const list = document.getElementById("kana-list");
  const padItems = page.chars.map((it) => {
    const st = window.getExpectedStrokes ? window.getExpectedStrokes(it.c) : null;
    return {
      char: it.c,
      strokes: st,
      sub: `よみ：${it.r}${st ? ` ／ ${st}画` : ""}`,
      extra: memos[it.c] ? `メモ：${memos[it.c]}` : "書き順（1・2・3…）を意識して書いてみましょう",
      speak: it.c,
      isYoon: Boolean(it.yoon || it.c.length > 1),
    };
  });

  page.chars.forEach((item, charIdx) => {
    const card = document.createElement("div");
    card.className = "kana-card";
    const yClass = item.yoon ? " yoon" : "";
    const stCount = window.getExpectedStrokes ? window.getExpectedStrokes(item.c) : null;
    card.innerHTML = `
      <div class="kana-card-top">
        <button type="button" class="kana-big-btn${yClass}" title="発音を聞く">${item.c}</button>
        <div class="kana-meta">
          <div class="kana-meta-row">
            <span class="kana-romaji-tag romaji">${item.r}</span>
            ${stCount ? `<span class="stroke-badge">${stCount}画</span>` : ""}
            <button type="button" class="speak-mini-btn">🔊 きく</button>
          </div>
          <input type="text" class="yomikata-input" placeholder="よみかた（母国語メモ）" value="${(memos[item.c] || "").replace(/"/g, "&quot;")}" />
        </div>
      </div>
      <div class="tracing-row">
        ${[true, true, false, false].map((hasGuide) => `
          <div class="trace-box">
            ${hasGuide ? `<span class="trace-guide${yClass}">${item.c}</span>` : ""}
            <canvas class="trace-canvas" width="136" height="136"></canvas>
          </div>
        `).join("")}
        <button type="button" class="write-open-btn" data-role="open-pad">✍️ 大きく書く</button>
        <button type="button" class="trace-clear-btn">けす</button>
      </div>
      <div class="mobile-write-footer">
        <button type="button" class="write-open-btn" data-role="open-pad-mobile">✍️ 「${item.c}」を大きく書く練習</button>
      </div>
    `;

    card.querySelector(".kana-big-btn").addEventListener("click", () => speakJa(item.c));
    card.querySelector(".speak-mini-btn").addEventListener("click", () => speakJa(item.c));
    card.querySelector(".yomikata-input").addEventListener("input", (e) => {
      saveMemo(item.c, e.target.value);
      padItems[charIdx].extra = e.target.value ? `メモ：${e.target.value}` : "指やペンで大きく書いて練習しましょう";
    });

    const openThisPad = () => window.openWritingPad?.(padItems, charIdx, speakJa);
    card.querySelector('[data-role="open-pad"]').addEventListener("click", openThisPad);
    card.querySelector('[data-role="open-pad-mobile"]').addEventListener("click", openThisPad);

    const canvases = card.querySelectorAll(".trace-canvas");
    canvases.forEach((cv) => setupTraceCanvas(cv));
    card.querySelector(".trace-clear-btn").addEventListener("click", () => {
      canvases.forEach((cv) => cv.getContext("2d").clearRect(0, 0, cv.width, cv.height));
    });

    list.appendChild(card);
  });

  const extraEl = document.getElementById("kana-extra");
  if (page.extra === "nobasu") renderNobasuExtra(extraEl);
  if (page.extra === "n_tsumaru") renderNTsumaruExtra(extraEl);
  if (page.extra === "p14_rules") renderP14Rules(extraEl);
}

function setupTraceCanvas(canvas) {
  const ctx = canvas.getContext("2d");
  ctx.strokeStyle = "#1d5b79";
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  let drawing = false;

  const pos = (e) => {
    const r = canvas.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * canvas.width, y: ((e.clientY - r.top) / r.height) * canvas.height };
  };

  canvas.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    canvas.setPointerCapture(e.pointerId);
    drawing = true;
    const p = pos(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!drawing) return;
    e.preventDefault();
    const p = pos(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  });
  canvas.addEventListener("pointerup", () => (drawing = false));
  canvas.addEventListener("pointercancel", () => (drawing = false));
}

function makePairGrid(pairs) {
  const grid = document.createElement("div");
  grid.className = "pair-grid";
  pairs.forEach(([a, b]) => {
    const card = document.createElement("div");
    card.className = "pair-card";
    const btnA = document.createElement("button");
    btnA.type = "button";
    btnA.className = "pair-word-btn";
    btnA.textContent = a;
    btnA.addEventListener("click", () => speakJa(a));

    const arrow = document.createElement("span");
    arrow.className = "pair-arrow";
    arrow.textContent = "⇔";

    const btnB = document.createElement("button");
    btnB.type = "button";
    btnB.className = "pair-word-btn";
    btnB.textContent = b;
    btnB.addEventListener("click", () => speakJa(b));

    card.append(btnA, arrow, btnB);
    grid.appendChild(card);
  });
  return grid;
}

function renderNobasuExtra(container) {
  const box = document.createElement("div");
  box.className = "grammar-box";
  box.innerHTML = `
    <h3>のばすおと（長音）</h3>
    <p>お<u>かあ</u>さん・と<u>けい</u>・おは<u>よう</u> のようなことばには「のばすおと」がはいっています。そのおとをあらわすのには：</p>
    <ul class="rule-list">
      <li><strong>あだん</strong>では <strong>「あ」</strong> をつけて</li>
      <li><strong>いだん</strong>では <strong>「い」</strong> をつけて</li>
      <li><strong>うだん</strong>では <strong>「う」</strong> をつけて</li>
      <li><strong>えだん</strong>では <strong>「い」</strong> または <strong>「え」</strong> をつけて</li>
      <li><strong>おだん</strong>では <strong>「う」</strong> または <strong>「お」</strong> をつけて あらわします。</li>
    </ul>
    <p class="page-sub">ことばをクリックして音の違いを聞き比べてみましょう 🔊</p>
  `;
  box.appendChild(makePairGrid([
    ["いえ", "いいえ"], ["おの", "おおの"], ["よい", "ようい"], ["とり", "とおり"],
    ["は", "はあ"], ["と", "とお"], ["め", "めい"], ["こい", "こうい"],
    ["せき", "せいき"], ["へや", "へいや"], ["つち", "つうち"], ["かいて", "かいてい"],
    ["くろ", "くうろ"], ["います", "いいます"], ["きてください", "きいてください"],
  ]));
  container.appendChild(box);
}

function renderNTsumaruExtra(container) {
  const box1 = document.createElement("div");
  box1.className = "grammar-box";
  box1.innerHTML = `
    <h3>「ん」はひとつのおとです</h3>
    <p>ほかのもじと おなじながさで はつおんします。たとえば「みかん」は「み／かん」ではなく「み／か／ん」のように <strong>3ぱく</strong> になります。<br />また、はつおんは [n・m・ŋ] の3とおりありますが、おなじ「ん」です。</p>
  `;
  box1.appendChild(makePairGrid([
    ["あな", "あんな"], ["こな", "こんな"], ["かせい", "かんせい"],
    ["たにん", "たんにん"], ["さま", "さんま"], ["ひめい", "ひんめい"],
  ]));

  const box2 = document.createElement("div");
  box2.className = "grammar-box";
  box2.innerHTML = `
    <h3>つまるおと（促音）</h3>
    <p>ちいさな「っ」はつまるおと、1ぱくぶん やすむ しるしです。「おと」は2はく、「おっと」は3ぱくになります。</p>
  `;
  box2.appendChild(makePairGrid([
    ["おと", "おっと"], ["きて", "きって"], ["さか", "さっか"],
    ["はか", "はっか"], ["にし", "にっし"], ["いせい", "いっせい"],
  ]));

  container.append(box1, box2);
}

function renderP14Rules(container) {
  const box1 = document.createElement("div");
  box1.className = "grammar-box";
  box1.innerHTML = `
    <h3>「じ」と「ぢ」、「ず」と「づ」</h3>
    <p>はつおんはおなじです。ふつうは「じ」と「ず」をつかいます。ふたつのことばから できたことばや おなじおとのつづいているときは「ぢ」「づ」をつかいます。</p>
    <p><strong>（れい）</strong> はなぢ ／ みかづき ／ ちぢむ ／ つづく</p>
  `;

  const box2 = document.createElement("div");
  box2.className = "grammar-box";
  box2.innerHTML = `
    <h3>じょし「は」、「を」、「へ」</h3>
    <ul class="rule-list">
      <li>じょしの「は」は <strong>&lt;わ&gt;</strong> とよみます。（れい）きょう<u>は</u> いいてんきです。</li>
      <li>じょしの「を」は <strong>&lt;お&gt;</strong> とよみます。（れい）てれび<u>を</u> みます。</li>
      <li>じょしの「へ」は <strong>&lt;え&gt;</strong> とよみます。（れい）こうみんかん<u>へ</u> いきます。</li>
    </ul>
    <p><strong>ひらがなで かいてください。</strong></p>
    <div class="quiz-list" id="joshi-quiz"></div>
    <div class="check-bar">
      <button id="check-joshi-btn" class="btn primary" type="button">答え合わせ</button>
      <button id="show-joshi-btn" class="btn" type="button">答えを見る</button>
      <span id="joshi-score" class="score-badge"></span>
    </div>
  `;

  const joshiItems = [
    { prompt: "1) Hana wa sakimashitaka?", ans: "はなはさきましたか" },
    { prompt: "2) Omotya o kaimasita.", ans: "おもちゃをかいました" },
    { prompt: "3) Achira no heya e dôzo.", ans: "あちらのへやへどうぞ" },
  ];
  const jQuiz = box2.querySelector("#joshi-quiz");
  const jInputs = [];
  joshiItems.forEach((it) => {
    const row = document.createElement("div");
    row.className = "quiz-row";
    row.innerHTML = `<span class="quiz-prompt">${it.prompt}</span><input type="text" class="quiz-input" style="flex:1" placeholder="ひらがなで入力..." />`;
    jInputs.push({ inp: row.querySelector("input"), ans: it.ans });
    jQuiz.appendChild(row);
  });

  box2.querySelector("#check-joshi-btn").addEventListener("click", () => {
    let ok = 0;
    jInputs.forEach(({ inp, ans }) => {
      const right = normalizeJa(inp.value).replace(/[？?]/g, "") === ans;
      inp.classList.toggle("correct", right);
      inp.classList.toggle("wrong", !right);
      if (right) ok++;
    });
    box2.querySelector("#joshi-score").textContent = `${ok} / ${jInputs.length} 問せいかい！`;
  });
  box2.querySelector("#show-joshi-btn").addEventListener("click", () => {
    jInputs.forEach(({ inp, ans }) => {
      inp.value = ans;
      inp.classList.add("correct");
      inp.classList.remove("wrong");
    });
  });

  const box3 = document.createElement("div");
  box3.className = "grammar-box";
  box3.innerHTML = `<h3>にているもじ（似ている文字）</h3>`;
  box3.appendChild(makePairGrid([
    ["い", "り"], ["し", "つ"], ["け", "は"], ["さ", "き"],
    ["れ", "わ"], ["め", "ぬ"], ["は", "ほ"], ["む", "お"],
  ]));

  const box4 = document.createElement("div");
  box4.className = "grammar-box";
  box4.innerHTML = `<h3>にているおと（似ている音）🔊</h3>`;
  box4.appendChild(makePairGrid([
    ["ちち", "つち"], ["すいか", "ついか"], ["しま", "ひま"], ["すみれ", "つみれ"],
    ["しも", "ひも"], ["かす", "かつ"], ["しこく", "ちこく"], ["くち", "くつ"],
    ["せんぱい", "せんばい"], ["がっこう", "かっこう"], ["たいきん", "だいきん"], ["とうじ", "どうじ"],
    ["にんじん", "にんしん"], ["いと", "いど"], ["きん", "ぎん"], ["けんこう", "げんこう"],
  ]));

  container.append(box1, box2, box3, box4);
}

function renderRenshuPage(page) {
  let testMode = false;
  let allRevealed = false;
  let onlyUnlearned = false;
  const checkedSet = new Set();
  const LEARNED_KEY = `hiragana_words_learned_p${page.id}_v1`;
  const loadLearned = () => {
    try { return new Set(JSON.parse(localStorage.getItem(LEARNED_KEY) || "[]")); } catch { return new Set(); }
  };
  const learnedSet = loadLearned();
  const saveLearned = () => {
    try { localStorage.setItem(LEARNED_KEY, JSON.stringify([...learnedSet])); } catch {}
  };

  const padItems = page.words.map((item) => ({
    char: item.w,
    icon: item.icon || "🎧",
    sub: item.r,
    extra: "音声をきいて手で書いてみましょう",
    speak: item.w,
    testMode: true,
    wide: true,
  }));

  const draw = () => {
    els.pageContainer.innerHTML = `
      ${pageHeaderHTML(page, page.subtitle)}
      <div class="renshu-toolbar">
        <div class="mode-switch">
          <button type="button" class="mode-btn ${!testMode ? "active" : ""}" id="mode-study">言葉チェック</button>
          <button type="button" class="mode-btn ${testMode ? "active" : ""}" id="mode-test">聞き取りテスト（手書き）</button>
        </div>
        ${testMode ? `
          <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
            <button type="button" class="btn primary" id="reveal-all-btn">${allRevealed ? "ぜんぶ答えを隠す" : "ぜんぶ答えを見る"}</button>
            <button type="button" class="btn" id="clear-all-btn">ぜんぶけす</button>
            <span id="vocab-score" class="score-badge">できた：${checkedSet.size} / ${page.words.length}</span>
          </div>
        ` : `
          <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
            <button type="button" class="btn ${onlyUnlearned ? "primary" : ""}" id="filter-unlearned-btn">${onlyUnlearned ? "すべて表示" : "まだの言葉だけ"}</button>
            <span id="learned-score" class="score-badge">おぼえた：${learnedSet.size} / ${page.words.length}</span>
          </div>
        `}
      </div>
      <div class="vocab-grid" id="vocab-grid"></div>
    `;

    document.getElementById("mode-study").addEventListener("click", () => { testMode = false; draw(); });
    document.getElementById("mode-test").addEventListener("click", () => { testMode = true; draw(); });

    if (!testMode) {
      document.getElementById("filter-unlearned-btn").addEventListener("click", () => {
        onlyUnlearned = !onlyUnlearned;
        draw();
      });
    }

    const grid = document.getElementById("vocab-grid");
    const allCanvases = [];
    const allReveals = [];

    const updateScore = () => {
      const sc = document.getElementById("vocab-score");
      if (sc) sc.textContent = `できた：${checkedSet.size} / ${page.words.length}`;
    };

    page.words.forEach((item, wordIdx) => {
      if (!testMode && onlyUnlearned && learnedSet.has(item.w)) return;
      const card = document.createElement("div");
      card.className = "vocab-card";
      if (!testMode) {
        const isLearned = learnedSet.has(item.w);
        card.classList.toggle("is-learned", isLearned);
        card.innerHTML = `
          <div class="vocab-top">
            <span class="vocab-icon">${item.icon}</span>
            <button type="button" class="speak-mini-btn">🔊 きく</button>
          </div>
          <div class="vocab-word">${item.w}</div>
          <div class="vocab-hint"><span class="romaji">${item.r} ／ </span>${item.mean}</div>
          <button type="button" class="word-check-btn ${isLearned ? "learned" : ""}">${isLearned ? "☑️ おぼえた！" : "☐ おぼえた"}</button>
        `;
        card.querySelector(".speak-mini-btn").addEventListener("click", () => speakJa(item.w));
        const chkBtn = card.querySelector(".word-check-btn");
        chkBtn.addEventListener("click", () => {
          if (learnedSet.has(item.w)) {
            learnedSet.delete(item.w);
            chkBtn.classList.remove("learned");
            chkBtn.textContent = "☐ おぼえた";
            card.classList.remove("is-learned");
          } else {
            learnedSet.add(item.w);
            chkBtn.classList.add("learned");
            chkBtn.textContent = "☑️ おぼえた！";
            card.classList.add("is-learned");
          }
          saveLearned();
          const lsc = document.getElementById("learned-score");
          if (lsc) lsc.textContent = `おぼえた：${learnedSet.size} / ${page.words.length}`;
          if (onlyUnlearned && learnedSet.has(item.w)) card.remove();
        });
      } else {
        const isDone = checkedSet.has(wordIdx);
        card.classList.toggle("checked-ok", isDone);
        card.innerHTML = `
          <div class="vocab-top">
            <span class="vocab-icon">${item.icon}</span>
            <button type="button" class="speak-mini-btn">🔊 きく</button>
          </div>
          <div class="vocab-test-romaji">${item.r}</div>
          <div class="vocab-write-box">
            <canvas class="vocab-write-canvas" width="420" height="184"></canvas>
          </div>
          <div class="vocab-write-actions">
            <button type="button" class="vocab-mini-btn primary vocab-open-pad-btn">✍️ 大きく書く</button>
            <button type="button" class="vocab-mini-btn vocab-clear-inline" data-act="judge">✓ 判定</button>
            <button type="button" class="vocab-mini-btn vocab-clear-inline" data-act="clear">けす</button>
            <button type="button" class="vocab-mini-btn" data-act="toggle-ans">答え</button>
            <button type="button" class="vocab-mini-btn ${isDone ? "done" : ""}" data-act="done">${isDone ? "⭕ できた" : "○ できた"}</button>
          </div>
          <div class="vocab-judge-msg hidden"></div>
          <div class="answer-reveal ${allRevealed ? "" : "hidden"}">${item.w}</div>
        `;

        card.querySelector(".speak-mini-btn").addEventListener("click", () => speakJa(item.w));
        const cv = card.querySelector(".vocab-write-canvas");
        setupTraceCanvas(cv);
        allCanvases.push(cv);

        const revealEl = card.querySelector(".answer-reveal");
        const judgeEl = card.querySelector(".vocab-judge-msg");
        const doneBtn = card.querySelector('[data-act="done"]');

        const markDone = () => {
          checkedSet.add(wordIdx);
          doneBtn.classList.add("done");
          doneBtn.textContent = "⭕ できた";
          card.classList.add("checked-ok");
          updateScore();
        };

        card.querySelector(".vocab-open-pad-btn").addEventListener("click", () => {
          window.openWritingPad?.(padItems, wordIdx, speakJa, (passedIdx) => {
            checkedSet.add(passedIdx);
            updateScore();
            if (passedIdx === wordIdx) markDone();
          });
        });

        card.querySelector('[data-act="judge"]').addEventListener("click", () => {
          if (!window.evaluateHandwritingCanvas) return;
          const res = window.evaluateHandwritingCanvas(cv, item.w, true);
          judgeEl.textContent = res.message;
          judgeEl.className = `vocab-judge-msg is-${res.status}`;
          if (res.status !== "empty") {
            revealEl.classList.remove("hidden");
            if (res.passed) {
              markDone();
              speakJa(item.w);
            }
          }
        });

        card.querySelector('[data-act="clear"]').addEventListener("click", () => {
          cv.getContext("2d").clearRect(0, 0, cv.width, cv.height);
          judgeEl.className = "vocab-judge-msg hidden";
        });

        allReveals.push(revealEl);
        card.querySelector('[data-act="toggle-ans"]').addEventListener("click", () => {
          revealEl.classList.toggle("hidden");
        });

        doneBtn.addEventListener("click", () => {
          if (checkedSet.has(wordIdx)) {
            checkedSet.delete(wordIdx);
            doneBtn.classList.remove("done");
            doneBtn.textContent = "○ できた";
            card.classList.remove("checked-ok");
            updateScore();
          } else {
            markDone();
          }
        });
      }
      grid.appendChild(card);
    });

    if (testMode) {
      document.getElementById("reveal-all-btn").addEventListener("click", () => {
        allRevealed = !allRevealed;
        allReveals.forEach((r) => r.classList.toggle("hidden", !allRevealed));
        document.getElementById("reveal-all-btn").textContent = allRevealed ? "ぜんぶ答えを隠す" : "ぜんぶ答えを見る";
      });
      document.getElementById("clear-all-btn").addEventListener("click", () => {
        allCanvases.forEach((cv) => cv.getContext("2d").clearRect(0, 0, cv.width, cv.height));
      });
    }
  };

  draw();
}

function renderP17Numbers(page) {
  const numQs = [
    ["ななじゅう", "70"], ["ひゃく", "100"], ["にじゅうご", "25"],
    ["ろくじゅうはち", "68"], ["さんじゅうよん", "34"], ["きゅうひゃくいち", "901"],
    ["せん", "1000"], ["はっせんにひゃくじゅうなな", "8217"],
    ["いちまんごひゃく", "10500"], ["よんじゅうろくまんせんななひゃくごじゅうに", "461752"],
    ["ひゃくまん", "1000000"],
  ];
  const dateQs = [
    ["しがつ ここのか（れい）", "4/9", true],
    ["しちがつ じゅうごにち", "7/15", false],
    ["いちがつ じゅうににち", "1/12", false],
    ["ごがつ いつか", "5/5", false],
    ["くがつ とおか", "9/10", false],
    ["じゅうがつ ついたち", "10/1", false],
    ["じゅういちがつ みっか", "11/3", false],
    ["じゅうにがつ さんじゅういちにち", "12/31", false],
  ];

  els.pageContainer.innerHTML = `
    ${pageHeaderHTML(page, "ひらがなを読んで、数字や日付を入力して答え合わせをしましょう。")}
    <h3 style="margin:0 0 10px; font-family:var(--font-round); color:var(--primary)">すうじ（0〜9 の読み方）🔊</h3>
    <div style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom:20px;" id="digits-bar"></div>

    <h3 style="margin:0 0 8px; font-family:var(--font-round); color:var(--primary)">すうじクイズ（数字で入力）</h3>
    <div class="quiz-list" id="num-quiz"></div>

    <h3 style="margin:26px 0 8px; font-family:var(--font-round); color:var(--primary)">ひづけクイズ（例：4/9 のように入力）</h3>
    <div class="quiz-list" id="date-quiz"></div>

    <div class="check-bar">
      <button id="check-p17-btn" class="btn primary" type="button">答え合わせ</button>
      <button id="show-p17-btn" class="btn" type="button">答えを見る</button>
      <span id="p17-score" class="score-badge"></span>
    </div>
  `;

  const digits = [
    ["1","いち"],["2","に"],["3","さん"],["4","よん・し"],["5","ご"],
    ["6","ろく"],["7","なな・しち"],["8","はち"],["9","きゅう・く"],["0","ぜろ・れい"],
  ];
  const dBar = document.getElementById("digits-bar");
  digits.forEach(([d, r]) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "action-pill";
    b.innerHTML = `<strong>${d}</strong> ${r} 🔊`;
    b.addEventListener("click", () => speakJa(r.split("・")[0]));
    dBar.appendChild(b);
  });

  const allInputs = [];
  const nList = document.getElementById("num-quiz");
  numQs.forEach(([q, ans]) => {
    const row = document.createElement("div");
    row.className = "quiz-row";
    row.innerHTML = `
      <span class="quiz-prompt">${q} <button type="button" class="speak-mini-btn">🔊</button></span>
      <input type="text" class="quiz-input" inputmode="numeric" placeholder="数字" />
    `;
    row.querySelector("button").addEventListener("click", () => speakJa(q));
    allInputs.push({ inp: row.querySelector("input"), ans });
    nList.appendChild(row);
  });

  const dtList = document.getElementById("date-quiz");
  dateQs.forEach(([q, ans, isEx]) => {
    const row = document.createElement("div");
    row.className = "quiz-row";
    row.innerHTML = `
      <span class="quiz-prompt">${q} <button type="button" class="speak-mini-btn">🔊</button></span>
      <input type="text" class="quiz-input" placeholder="月/日" value="${isEx ? ans : ""}" ${isEx ? "readonly" : ""} />
    `;
    row.querySelector("button").addEventListener("click", () => speakJa(q.replace("（れい）", "")));
    if (!isEx) allInputs.push({ inp: row.querySelector("input"), ans });
    dtList.appendChild(row);
  });

  document.getElementById("check-p17-btn").addEventListener("click", () => {
    let ok = 0;
    allInputs.forEach(({ inp, ans }) => {
      const val = inp.value.trim().replace(/,/g, "");
      const right = val === ans;
      inp.classList.toggle("correct", right);
      inp.classList.toggle("wrong", !right);
      if (right) ok++;
    });
    document.getElementById("p17-score").textContent = `${ok} / ${allInputs.length} 問せいかい！`;
  });

  document.getElementById("show-p17-btn").addEventListener("click", () => {
    allInputs.forEach(({ inp, ans }) => {
      inp.value = ans;
      inp.classList.add("correct");
      inp.classList.remove("wrong");
    });
  });
}

function renderP18Special(page) {
  const compareChars = ["い","う","お","き","け","さ","せ","た","な","に","は","ふ","ほ","も","や","ら","り","を"];

  els.pageContainer.innerHTML = `
    ${pageHeaderHTML(page, "ひらがなの特別な書き方と、印刷文字・手書き文字の違い")}

    <div class="grammar-box" style="margin-top:0">
      <h3>1） 「言う」は「ゆう」とはつおんするが「いう」とかく</h3>
      <p>《いう》　<u>＊いわない</u>　いいます　<u>＊いって</u>　<u>＊いった</u><br />
      <small>＊は「い」「ゆ」どちらのはつおんでもよい</small></p>
    </div>

    <div class="grammar-box">
      <h3>2） のばすおと（しょきゅう の ばあい）</h3>
      <ul class="rule-list">
        <li><strong>えだん</strong> の のばすおとは：「ええ、おねえさん」のほかは <strong>「い」</strong> をつかう</li>
        <li><strong>おだん</strong> の のばすおとは：「とお、とおか、とおり、とおる、とおい、おおい、おおきい、こおり」のほかは <strong>「う」</strong> をつかう</li>
      </ul>
    </div>

    <div class="grammar-box">
      <h3>3） くとうてん（1じぶんのスペースをつかってかく）</h3>
      <ul class="rule-list">
        <li><strong>。</strong> …… 「まる」または「くてん」 ぶんのおわりにつかう。</li>
        <li><strong>、</strong> …… 「てん」または「とうてん」 ぶんのとちゅうにつかう。</li>
        <li><strong>「」</strong> …… 「かぎかっこ」 おもに はなしことばをあらわす。</li>
      </ul>
    </div>

    <div class="grammar-box">
      <h3>いんさつのもじ と ひっきたい</h3>
      <p class="page-sub">だいたいおなじですが、ちょっとちがいます（左：印刷体 ／ 右：手書き・教科書体）</p>
      <div class="compare-grid" id="compare-grid"></div>
    </div>
  `;

  const grid = document.getElementById("compare-grid");
  compareChars.forEach((ch) => {
    const card = document.createElement("div");
    card.className = "compare-card";
    card.innerHTML = `<span class="char-print">${ch}</span><span class="pair-arrow">⇔</span><span class="char-hand">${ch}</span>`;
    card.addEventListener("click", () => speakJa(ch));
    grid.appendChild(card);
  });
}

init();
