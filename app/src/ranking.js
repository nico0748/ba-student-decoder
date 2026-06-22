// ログイン不要・端末キャッシュ（localStorage）によるユーザ名／ランキング保存
const LS_USER = "schale_username";
const LS_RANK = "schale_ranking";

export const getUser = () => { try { return localStorage.getItem(LS_USER) || ""; } catch { return ""; } };
export const setUserLS = (v) => { try { localStorage.setItem(LS_USER, v); } catch { /* noop */ } };
export const getRank = () => { try { return JSON.parse(localStorage.getItem(LS_RANK) || "[]"); } catch { return []; } };
export const setRank = (r) => { try { localStorage.setItem(LS_RANK, JSON.stringify(r)); } catch { /* noop */ } };

export const addRecord = (entry) => { const r = [...getRank(), entry]; setRank(r); return r; };

export const fmt = (ms) => {
  const s = Math.floor(ms / 1000), m = Math.floor(s / 60);
  return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}.${String(Math.floor((ms % 1000) / 10)).padStart(2, "0")}`;
};

// 問題数(count)。旧レコードは1問記録として扱う。
export const recordCount = (r) => r.count || 1;

export const bestTime = (ranking, difficulty, count, name) => {
  const mine = ranking.filter((r) => r.difficulty === difficulty && recordCount(r) === count && r.name === name);
  return mine.length ? Math.min(...mine.map((r) => r.time)) : null;
};

// 難易度×問題数 の上位ランキング行
export const topRows = (ranking, difficulty, count, limit = 10) =>
  ranking.filter((r) => r.difficulty === difficulty && recordCount(r) === count)
    .sort((a, b) => a.time - b.time).slice(0, limit);
