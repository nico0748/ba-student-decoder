import React, { useMemo } from "react";
import { bestTime, fmt } from "../ranking.js";
import { useLeaderboard } from "../useLeaderboard.js";
import CardTitle from "./CardTitle.jsx";

export default function HomeRanking({ ranking, difficulty, count, user }) {
  const { rows, source, loading } = useLeaderboard(ranking, difficulty, count, 5);
  const me = user || "先生";
  const best = useMemo(() => bestTime(ranking, difficulty, count, me), [ranking, difficulty, count, me]);

  return (
    <div className="card">
      <CardTitle icon="trophy">ランキング
        <span className="tag" style={{ marginLeft: 6 }}>{difficulty.toUpperCase()} / {count}問</span>
        <span className="tag" style={{ marginLeft: 6, background: source === "remote" ? "#e7f6ee" : "#eef4fb", color: source === "remote" ? "#0d8b56" : "var(--ba-blue-d)" }}>
          {source === "remote" ? "🌐 共有" : "📱 端末内"}
        </span>
      </CardTitle>
      <div className="row" style={{ marginBottom: 8 }}>
        <span className="tag">自己ベスト {best ? fmt(best) : "--:--.--"}</span>
      </div>
      {rows.length === 0
        ? <p className="small">{loading ? "読み込み中…" : "まだ記録がありません。最初の解読者になろう。"}</p>
        : <table className="rank">
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className={r.name === me ? "me" : ""}>
                  <td className="medal" style={{ width: 30 }}>{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}</td>
                  <td>{r.name}</td>
                  <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 800 }}>{fmt(r.time)}</td>
                </tr>
              ))}
            </tbody>
          </table>}
      <p className="small" style={{ marginTop: 8 }}>選んだ難易度・問題数で集計</p>
    </div>
  );
}
