// ログイン不要・端末キャッシュ（localStorage）によるユーザ名／ランキング保存
const LS_USER = "schale_username";
const LS_RANK = "schale_ranking";

export const getUser = () => { try { return localStorage.getItem(LS_USER) || ""; } catch { return ""; } };
export const setUserLS = (v) => { try { localStorage.setItem(LS_USER, v); } catch { /* noop */ } };
export const getRank = () => { try { return JSON.parse(localStorage.getItem(LS_RANK) || "[]"); } catch { return []; } };
export const setRank = (r) => { try { localStorage.setItem(LS_RANK, JSON.stringify(r)); } catch { /* noop */ } };

// 問題数(count)。旧レコードは1問記録として扱う。
export const recordCount = (r) => r.count || 1;

// 所有者キー：client_id を優先（名前を変えても同じ端末＝同じ所有者として同定）。
// client_id が無い旧レコードは名前で識別する。
export const ownerKey = (r) => (r.clientId ? `cid:${r.clientId}` : `name:${r.name}`);

// 同じ (所有者 × 難易度 × 問題数) は1レコードに集約。ベストタイムは保持しつつ、名前は最新の入力に更新する。
// （名前変更後の再挑戦でも client_id が同じなら既存レコードを更新し、重複を作らない）
export const addRecord = (entry) => {
  const all = getRank();
  const sameKey = (x) => ownerKey(x) === ownerKey(entry) && x.difficulty === entry.difficulty && recordCount(x) === recordCount(entry);
  const others = all.filter((x) => !sameKey(x));
  let best = entry.time;
  for (const x of all.filter(sameKey)) { if (x.time < best) best = x.time; } // 既存ベストの方が速ければ温存
  const merged = { ...entry, time: best }; // 名前など他項目は最新(entry)を採用、タイムだけベスト保持
  const r = [...others, merged];
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

// 難易度×問題数 の上位ランキング行（所有者ごとにベスト1件へ集約）。
// client_id 単位で集約し、ベストタイム＋最新の名前で表示する（過去の重複・旧名も1行に統合）。
export const topRows = (ranking, difficulty, count, limit = 10) => {
  const byOwner = new Map();
  for (const r of ranking) {
    if (r.difficulty !== difficulty || recordCount(r) !== count) continue;
    const k = ownerKey(r);
    const cur = byOwner.get(k);
    if (!cur) { byOwner.set(k, { ...r }); continue; }
    const best = r.time < cur.time ? r.time : cur.time;              // ベストタイム
    const latest = (r.date || 0) > (cur.date || 0) ? r : cur;        // 最新の名前
    byOwner.set(k, { ...latest, time: best });
  }
  return [...byOwner.values()].sort((a, b) => a.time - b.time).slice(0, limit);
};
