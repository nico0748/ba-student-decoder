import { useEffect, useState } from "react";
import { remoteEnabled, fetchTop } from "./leaderboard.js";
import { topRows } from "./ranking.js";

// ランキング行を返す共通フック。
//  ・remoteEnabled（Supabase設定あり）なら共有ランキングを取得し表示
//  ・未設定 or 取得失敗時は端末内（localStorage）ランキングにフォールバック
// 戻り値: { rows:[{name,time}], source:"remote"|"local", loading:boolean }
export function useLeaderboard(localRanking, difficulty, count, limit = 10, refreshKey = 0) {
  const [remote, setRemote] = useState(null); // null=未取得/失敗（=local表示）, 配列=取得成功
  const [loading, setLoading] = useState(remoteEnabled);

  useEffect(() => {
    if (!remoteEnabled) { setRemote(null); setLoading(false); return; }
    let alive = true;
    setLoading(true);
    fetchTop(difficulty, count, limit).then((rows) => {
      if (!alive) return;
      setRemote(rows); // 配列（空含む）なら共有表示、null（失敗）なら local フォールバック
      setLoading(false);
    });
    return () => { alive = false; };
  }, [difficulty, count, limit, refreshKey]);

  const useRemote = remoteEnabled && Array.isArray(remote);
  const rows = useRemote ? remote : topRows(localRanking, difficulty, count, limit);
  return { rows, source: useRemote ? "remote" : "local", loading };
}
