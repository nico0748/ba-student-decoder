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
    const sh = shuffle([...set]); const confirmed = sh[0];
    const confirmedMap = {}; chars(confirmed).forEach((c) => (confirmedMap[c] = charDigit[c]));
    const rest = sh.slice(1); if (rest.length < cfg.hints) continue;
    const deduction = rest.slice(0, cfg.hints);
    const usedSet = new Set(used); const shown = new Set([confirmed, ...deduction]);
    const qc = POOL.filter((n) => !shown.has(n) && chars(n).every((c) => usedSet.has(c)));
    if (!qc.length) continue;
    for (const question of shuffle(qc)) {
      const questionSeq = encode(question); const deductionSeqs = deduction.map(encode);
      const qD = new Set(chars(question).map((c) => charDigit[c]));
      const cD = new Set(Object.values(confirmedMap));
      const unknownInQ = [...qD].filter((d) => !cD.has(d)).length;
      if (difficulty === "hard" && unknownInQ < 2) continue;
      if (difficulty === "normal" && unknownInQ < 1) continue;
      const res = solveQuestion(deductionSeqs, questionSeq, confirmedMap);
      if (res.size === 1 && res.has(question)) {
        return { difficulty, confirmed: { seq: encode(confirmed), name: confirmed }, confirmedMap, deductionSeqs, questionSeq, answer: question };
      }
    }
  }
  return null;
}
