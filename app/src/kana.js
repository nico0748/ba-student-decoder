// ローマ字／ひらがな → カタカナ 変換（対応表メモの自動カタカナ入力用）
// 例: "き" → "キ" / "ki" → "キ" / "shi" → "シ"

// ひらがな(U+3041-3096) → カタカナ(+0x60)
const hiraToKata = (s) => s.replace(/[ぁ-ゖ]/g, (c) => String.fromCharCode(c.charCodeAt(0) + 0x60));

// ローマ字 → カタカナ（最長3文字一致）。確定しない末尾のローマ字は温存して次の入力で確定させる。
const ROMAJI = {
  a: "ア", i: "イ", u: "ウ", e: "エ", o: "オ",
  ka: "カ", ki: "キ", ku: "ク", ke: "ケ", ko: "コ",
  ga: "ガ", gi: "ギ", gu: "グ", ge: "ゲ", go: "ゴ",
  sa: "サ", si: "シ", shi: "シ", su: "ス", se: "セ", so: "ソ",
  za: "ザ", zi: "ジ", ji: "ジ", zu: "ズ", ze: "ゼ", zo: "ゾ",
  ta: "タ", ti: "チ", chi: "チ", tu: "ツ", tsu: "ツ", te: "テ", to: "ト",
  da: "ダ", di: "ヂ", du: "ヅ", de: "デ", do: "ド",
  na: "ナ", ni: "ニ", nu: "ヌ", ne: "ネ", no: "ノ",
  ha: "ハ", hi: "ヒ", hu: "フ", fu: "フ", he: "ヘ", ho: "ホ",
  ba: "バ", bi: "ビ", bu: "ブ", be: "ベ", bo: "ボ",
  pa: "パ", pi: "ピ", pu: "プ", pe: "ペ", po: "ポ",
  ma: "マ", mi: "ミ", mu: "ム", me: "メ", mo: "モ",
  ya: "ヤ", yu: "ユ", yo: "ヨ",
  ra: "ラ", ri: "リ", ru: "ル", re: "レ", ro: "ロ",
  wa: "ワ", wo: "ヲ", nn: "ン",
  // 拗音
  kya: "キャ", kyu: "キュ", kyo: "キョ",
  gya: "ギャ", gyu: "ギュ", gyo: "ギョ",
  sha: "シャ", shu: "シュ", sho: "ショ", sya: "シャ", syu: "シュ", syo: "ショ",
  ja: "ジャ", ju: "ジュ", jo: "ジョ", jya: "ジャ", jyu: "ジュ", jyo: "ジョ", zya: "ジャ", zyu: "ジュ", zyo: "ジョ",
  cha: "チャ", chu: "チュ", cho: "チョ", tya: "チャ", tyu: "チュ", tyo: "チョ",
  nya: "ニャ", nyu: "ニュ", nyo: "ニョ",
  hya: "ヒャ", hyu: "ヒュ", hyo: "ヒョ",
  bya: "ビャ", byu: "ビュ", byo: "ビョ",
  pya: "ピャ", pyu: "ピュ", pyo: "ピョ",
  mya: "ミャ", myu: "ミュ", myo: "ミョ",
  rya: "リャ", ryu: "リュ", ryo: "リョ",
  fa: "ファ", fi: "フィ", fe: "フェ", fo: "フォ",
  va: "ヴァ", vi: "ヴィ", vu: "ヴ", ve: "ヴェ", vo: "ヴォ",
  // 長音・小書き
  "-": "ー",
  xa: "ァ", xi: "ィ", xu: "ゥ", xe: "ェ", xo: "ォ", la: "ァ", li: "ィ", lu: "ゥ", le: "ェ", lo: "ォ",
  xtu: "ッ", xtsu: "ッ", ltu: "ッ",
  xya: "ャ", xyu: "ュ", xyo: "ョ", lya: "ャ", lyu: "ュ", lyo: "ョ",
};

export function toKatakana(input) {
  const s = hiraToKata(input);
  let out = "";
  let i = 0;
  while (i < s.length) {
    const ch = s[i];
    if (/[a-zA-Z-]/.test(ch)) {
      let matched = false;
      for (let L = Math.min(3, s.length - i); L >= 1; L--) {
        const key = s.substr(i, L).toLowerCase();
        if (ROMAJI[key]) { out += ROMAJI[key]; i += L; matched = true; break; }
      }
      if (!matched) { out += ch.toLowerCase(); i++; } // 未確定のローマ字は温存
    } else {
      out += ch; i++; // カタカナ等はそのまま
    }
  }
  return out;
}
