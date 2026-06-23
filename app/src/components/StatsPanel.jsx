import React, { useMemo } from "react";
import { recordCount } from "../ranking.js";
import CardTitle from "./CardTitle.jsx";

const dayKey = (ts) => new Date(ts).toLocaleDateString("sv"); // YYYY-MM-DD（ローカル）

export default function StatsPanel({ ranking }) {
  const stats = useMemo(() => {
    const plays = ranking.length;
    const solved = ranking.reduce((a, r) => a + recordCount(r), 0);
    const days = new Set(ranking.map((r) => dayKey(r.date)));
    let streak = 0;
    const d = new Date();
    if (!days.has(dayKey(d.getTime()))) d.setDate(d.getDate() - 1);
    while (days.has(dayKey(d.getTime()))) { streak++; d.setDate(d.getDate() - 1); }
    return { plays, solved, streak };
  }, [ranking]);

  return (
    <div className="card">
      <CardTitle icon="chart">プレイ統計</CardTitle>
      <div className="stat-grid">
        <div className="stat"><div className="stat-num">{stats.solved}</div><div className="stat-lab">解読した問題</div></div>
        <div className="stat"><div className="stat-num">{stats.plays}</div><div className="stat-lab">プレイ回数</div></div>
        <div className="stat"><div className="stat-num">{stats.streak}</div><div className="stat-lab">連続プレイ日数</div></div>
      </div>
    </div>
  );
}
