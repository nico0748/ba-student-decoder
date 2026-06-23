// ===== 暗号生成 + 一意性ソルバ =====
import { NAMES } from "./data.js";

export const chars = (s) => Array.from(s);

const groupByLen = (names) => {
  const m = new Map();
  for (const n of names) { const L = chars(n).length; if (!m.has(L)) m.set(L, []); m.get(L).push(n); }
  return m;
};

const POOL = NAMES;
const BYLEN = groupByLen(POOL);

const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const sample = (a) => a[Math.floor(Math.random() * a.length)];

// プレイヤー視点で「全ヒント＆答えが実在の生徒名になる」整合解を全探索し、問題の答え候補集合を返す
export function solveQuestion(deductionSeqs, questionSeq, confirmedMap) {
  const results = new Set();
  const d2c = {}, c2d = {};
  for (const [ch, dg] of Object.entries(confirmedMap)) { d2c[dg] = ch; c2d[ch] = dg; }
  const tryAssign = (seq, name, d2c, c2d) => {
    const cs = chars(name);
    if (cs.length !== seq.length) return null;
    const nd2c = { ...d2c }, nc2d = { ...c2d };
    for (let k = 0; k < seq.length; k++) {
      const dg = seq[k], ch = cs[k];
      if (nd2c[dg] !== undefined) { if (nd2c[dg] !== ch) return null; }
      else { if (nc2d[ch] !== undefined && nc2d[ch] !== dg) return null; nd2c[dg] = ch; nc2d[ch] = dg; }
    }
    return [nd2c, nc2d];
  };
  const rec = (i, d2c, c2d) => {
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

// 文字を共有する名前集合を連結構築（チェーン推理用）
function buildConnectedSet(targetNames, maxDistinct) {
  for (let a = 0; a < 200; a++) {
    const start = sample(POOL);
    const set = [start];
    const used = new Set(chars(start));
    for (const n of shuffle([...POOL])) {
      if (set.includes(n)) continue;
      const cs = chars(n);
      if (!cs.some((c) => used.has(c))) continue;
      const nu = new Set(used); cs.forEach((c) => nu.add(c)); if (nu.size > maxDistinct) continue;
      set.push(n); cs.forEach((c) => used.add(c)); if (set.length >= targetNames) break;
    }
    if (set.length >= targetNames) return { set, used: [...used] };
  }
  return null;
}

export const DIFF_CONFIG = {
  easy: { names: 4, hints: 2, maxDistinct: 9 },
  normal: { names: 5, hints: 3, maxDistinct: 10 },
  hard: { names: 6, hints: 3, maxDistinct: 10 },
};

export function generatePuzzle(difficulty = "normal") {
  const cfg = DIFF_CONFIG[difficulty];
  for (let a = 0; a < 4000; a++) {
    const built = buildConnectedSet(cfg.names, cfg.maxDistinct); if (!built) continue;
    const { set, used } = built; if (used.length > 10) continue;
    const digits = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, used.length).map(String);
    const charDigit = {}; used.forEach((c, i) => (charDigit[c] = digits[i]));
    const encode = (name) => chars(name).map((c) => charDigit[c]).join("");
    // チェーン推理を成立させるため、確定情報をチェーンの起点(set[0])に固定。
    // buildConnectedSet は set[i] が set[0..i-1] と必ず文字を共有する順序で構築するので、
    // 傍受データ(set[1..hints]) は確定情報＋先行する傍受データと連鎖する。
    const confirmed = set[0];
    const confirmedMap = {}; chars(confirmed).forEach((c) => (confirmedMap[c] = charDigit[c]));
    const rest = set.slice(1); if (rest.length < cfg.hints) continue;
    const deduction = rest.slice(0, cfg.hints);
    const usedSet = new Set(used); const shown = new Set([confirmed, ...deduction]);
    const qc = POOL.filter((n) => !shown.has(n) && chars(n).every((c) => usedSet.has(c)));
    if (!qc.length) continue;
    for (const question of shuffle(qc)) {
      const questionSeq = encode(question); const deductionSeqs = deduction.map(encode);
      const qD = new Set(chars(question).map((c) => charDigit[c]));
      const cD = new Set(Object.values(confirmedMap));                // 確定情報に出る数字
      const dD = new Set(); deductionSeqs.forEach((s) => chars(s).forEach((d) => dD.add(d))); // 傍受データに出る数字
      // 当てずっぽう防止：問題の数字はすべて「確定情報 or 傍受データ」に出現していること
      // （どのヒントにも無い数字が混ざると、その文字は推理不能になってしまう）
      if ([...qD].some((d) => !cD.has(d) && !dD.has(d))) continue;
      const confirmedInQ = [...qD].filter((d) => cD.has(d)).length;                 // 確定情報で直接分かる数字の数
      const deducibleInQ = [...qD].filter((d) => !cD.has(d) && dD.has(d)).length;   // 傍受データから推理する数字の数
      // 難易度別の出題条件
      if (difficulty === "easy" && confirmedInQ < 1) continue;        // easy: 確定情報の文字を必ず含む
      if (difficulty === "normal" && (confirmedInQ < 1 || deducibleInQ < 1)) continue; // normal: 確定＋傍受の両方を使う
      if (difficulty === "hard" && confirmedInQ > 0) continue;        // hard: 確定情報の数字は含まない（すべて傍受データから推理）
      const res = solveQuestion(deductionSeqs, questionSeq, confirmedMap);
      if (res.size === 1 && res.has(question)) {
        return { difficulty, confirmed: { seq: encode(confirmed), name: confirmed }, confirmedMap, deductionSeqs, questionSeq, answer: question };
      }
    }
  }
  return null;
}
