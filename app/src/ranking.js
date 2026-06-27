// ログイン不要・端末キャッシュ（localStorage）によるユーザ名／ランキング保存
const LS_USER = "schale_username";
const LS_RANK = "schale_ranking";

export const getUser = () => { try { return localStorage.getItem(LS_USER) || ""; } catch { return ""; } };
export const setUserLS = (v) => { try { localStorage.setItem(LS_USER, v); } catch { /* noop */ } };
export const getRank = () => { try { return JSON.parse(localStorage.getItem(LS_RANK) || "[]"); } catch { return []; } };
export const setRank = (r) => { try { localStorage.setItem(LS_RANK, JSON.stringify(r)); } catch { /* noop */ } };

// 問題数(count)。旧レコードは1問記録として扱う。
export const recordCount = (r) => r.count || 1;

// 同じ (ユーザ名 × 難易度 × 問題数) は1レコードに集約し、より速いタイムのときだけ更新する。
// （再挑戦のたびに重複レコードが積み上がらないようにするため。既存の重複も best 1件へ集約）
export const addRecord = (entry) => {
  const all = getRank();
  const sameKey = (x) => x.name === entry.name && x.difficulty === entry.difficulty && recordCount(x) === recordCount(entry);
  const others = all.filter((x) => !sameKey(x));
  let best = entry;
  for (const x of all.filter(sameKey)) { if (x.time < best.time) best = x; } // 既存ベストの方が速ければ温存
  const r = [...others, best];
  setRank(r);
  return r;
};

export const fmt = (ms) => {
  const s = Math.floor(ms / 1000), m = Math.floor(s / 60);
  return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}.${String(Math.floor((ms % 1000) / 10)).padStart(2, "0")}`;
};

export const bestTime = (ranking, difficulty, count, name) => {
  const mine = ranking.filter((r) => r.difficulty === difficulty && recordCount(r) === count && r.name === name);
  return mine.length ? Math.min(...mine.map((r) => r.time)) : null;
};

// 難易度×問題数 の上位ランキング行（名前ごとにベスト1件へ集約）。
// 過去に蓄積された重複レコードがあっても1ユーザ1行で表示する。
export const topRows = (ranking, difficulty, count, limit = 10) => {
  const bestByName = new Map();
  for (const r of ranking) {
    if (r.difficulty !== difficulty || recordCount(r) !== count) continue;
    const cur = bestByName.get(r.name);
    if (!cur || r.time < cur.time) bestByName.set(r.name, r);
  }
  return [...bestByName.values()].sort((a, b) => a.time - b.time).slice(0, limit);
};
