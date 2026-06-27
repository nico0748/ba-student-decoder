// サーバ側の出題検証エンジン（フロント engine.js と同等の一意性ソルバ）
// 生徒名は data.js の NAMES と同期させること（変更時は両方更新）。
export const NAMES: string[] = ["アイリ","アオバ","アカネ","アカリ","アコ","アスナ","アズサ","アツコ","アヤネ","アリス","アル","イオリ","イズナ","イズミ","イチカ","イブキ","イロハ","ウイ","ウタハ","ウミカ","エイミ","エリ","エリカ","オトギ","カエデ","カスミ","カズサ","カノエ","カホ","カヨコ","カリン","カンナ","キキョウ","キサキ","キララ","キリノ","クルミ","ケイ","ココナ","コタマ","コトリ","コノカ","コハル","コユキ","サオリ","サキ","サクラコ","サツキ","サヤ","シグレ","シズコ","シミコ","シュン","シロコ","ジュリ","ジュンコ","スズミ","スバル","スミレ","セイア","セナ","セリカ","セリナ","タカネ","チアキ","チェリノ","チセ","チナツ","チヒロ","ツクヨ","ツバキ","ツルギ","トキ","トモエ","ナギサ","ナグサ","ナツ","ニコ","ニヤ","ネル","ノア","ノゾミ","ノドカ","ノノミ","ハスミ","ハナエ","ハナコ","ハルカ","ハルナ","ハレ","ヒカリ","ヒナ","ヒナタ","ヒビキ","ヒフミ","ヒマリ","ヒヨリ","フィーナ","フウカ","フブキ","フユ","ホシノ","マキ","マコト","マシロ","マリナ","マリー","ミカ","ミク","ミサキ","ミチル","ミドリ","ミナ","ミネ","ミノリ","ミモリ","ミヤコ","ミユ","ミヨ","ムツキ","メグ","メル","モエ","モミジ","モモイ","ヤクモ","ユウカ","ユカリ","ユズ","ヨシミ","ラブ","リオ","リツ","ルミ","レイ","レイサ","レイジョ","レナ","レンゲ","ワカモ"];

export const chars = (s: string) => Array.from(s);

const BYLEN = (() => {
  const m = new Map<number, string[]>();
  for (const n of NAMES) { const L = chars(n).length; if (!m.has(L)) m.set(L, []); m.get(L)!.push(n); }
  return m;
})();

const NAMESET = new Set(NAMES);

// 与えられた確定マップ・傍受データ列・問題列から「全ヒント＆答えが実在名になる」整合解を全探索し答え候補集合を返す
export function solveQuestion(deductionSeqs: string[], questionSeq: string, confirmedMap: Record<string, string>): Set<string> {
  const results = new Set<string>();
  const d2c: Record<string, string> = {}, c2d: Record<string, string> = {};
  for (const [ch, dg] of Object.entries(confirmedMap)) { d2c[dg] = ch; c2d[ch] = dg; }
  const tryAssign = (seq: string, name: string, d2c: Record<string, string>, c2d: Record<string, string>) => {
    const cs = chars(name);
    if (cs.length !== seq.length) return null;
    const nd2c = { ...d2c }, nc2d = { ...c2d };
    for (let k = 0; k < seq.length; k++) {
      const dg = seq[k], ch = cs[k];
      if (nd2c[dg] !== undefined) { if (nd2c[dg] !== ch) return null; }
      else { if (nc2d[ch] !== undefined && nc2d[ch] !== dg) return null; nd2c[dg] = ch; nc2d[ch] = dg; }
    }
    return [nd2c, nc2d] as const;
  };
  const rec = (i: number, d2c: Record<string, string>, c2d: Record<string, string>) => {
    if (i === deductionSeqs.length) {
      for (const name of (BYLEN.get(questionSeq.length) || [])) { if (tryAssign(questionSeq, name, d2c, c2d)) results.add(name); }
      return;
    }
    for (const name of (BYLEN.get(deductionSeqs[i].length) || [])) {
      const r = tryAssign(deductionSeqs[i], name, d2c, c2d);
      if (r) rec(i + 1, r[0], r[1]);
    }
  };
  rec(0, d2c, c2d);
  return results;
}

// 1問の妥当性検証：confirmed/deduction/question/answer の整合・一意性・実在名チェック
export function validatePuzzle(p: {
  confirmed: { seq: string; name: string };
  confirmedMap: Record<string, string>;
  deductionSeqs: string[];
  questionSeq: string;
  answer: string;
  userAnswer?: string;
}): boolean {
  if (!p || !p.confirmed || !p.answer) return false;
  if (!NAMESET.has(p.confirmed.name) || !NAMESET.has(p.answer)) return false;
  // confirmedMap と confirmed.name/seq の整合
  const cs = chars(p.confirmed.name);
  if (cs.length !== p.confirmed.seq.length) return false;
  for (let i = 0; i < cs.length; i++) {
    if (p.confirmedMap[cs[i]] !== p.confirmed.seq[i]) return false;
  }
  // すべての数字がヒント側に出現（当てずっぽう不可）
  const shown = new Set<string>();
  chars(p.confirmed.seq).forEach((d) => shown.add(d));
  p.deductionSeqs.forEach((s) => chars(s).forEach((d) => shown.add(d)));
  for (const d of chars(p.questionSeq)) if (!shown.has(d)) return false;
  // 一意性＋答え一致
  const res = solveQuestion(p.deductionSeqs, p.questionSeq, p.confirmedMap);
  if (res.size !== 1 || !res.has(p.answer)) return false;
  // ユーザの解答が正しいこと
  if (p.userAnswer !== undefined && p.userAnswer.trim() !== p.answer) return false;
  return true;
}
