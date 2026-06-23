import React, { useState } from "react";
import { setUserLS, bestTime, fmt } from "../ranking.js";
import { NAMES, iconOf } from "../data.js";
import Footer from "./Footer.jsx";
import StudentOfDay from "./StudentOfDay.jsx";
import StatsPanel from "./StatsPanel.jsx";
import HomeRanking from "./HomeRanking.jsx";
import CardTitle from "./CardTitle.jsx";
import HowTo from "./HowTo.jsx";
import Icon from "./Icon.jsx";

const DIFFS = [
  { key: "easy", name: "EASY", stars: "★☆☆", desc: "4名・ヒント2つ。まずは規則に慣れよう。" },
  { key: "normal", name: "NORMAL", stars: "★★☆", desc: "5名・ヒント3つ。連鎖推理で解読。" },
  { key: "hard", name: "HARD", stars: "★★★", desc: "6名・複数の未確定数字。絞り込みが鍵。" },
];
const COUNTS = [
  { key: 1, name: "1問", desc: "一発解読。最速タイムを狙う。" },
  { key: 5, name: "5問", desc: "5問連続。安定感が問われる。" },
  { key: 10, name: "10問", desc: "10問連続。真の解読者へ。" },
];
const NAV = [
  { id: null, icon: "home", label: "ホーム" },
  { id: "sec-play", icon: "play", label: "挑戦設定" },
  { id: "sec-today", icon: "sparkle", label: "今日の生徒" },
  { id: "sec-rank", icon: "trophy", label: "ランキング" },
  { id: "sec-stats", icon: "chart", label: "プレイ統計" },
  { id: "sec-howto", icon: "book", label: "遊び方" },
  { id: "sec-roster", icon: "idcard", label: "生徒名簿" },
];

const goto = (id) => {
  if (!id) { window.scrollTo({ top: 0, behavior: "smooth" }); return; }
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
};

export default function TopPage({ difficulty, setDifficulty, count, setCount, user, setUser, ranking, onStart }) {
  const [name, setName] = useState(user || "");
  const [showRoster, setShowRoster] = useState(false);

  const commitName = () => { const u = (name || "").trim().slice(0, 12) || "先生"; setName(u); setUser(u); setUserLS(u); };
  const start = () => { commitName(); onStart(); };
  const best = bestTime(ranking, difficulty, count, user || "先生");

  return (
    <>
    <div className="layout">
      {/* ===== 左サイドメニュー ===== */}
      <aside className="sidebar">
        <div className="side-brand">
          <span className="plus"></span>
          <div>
            <div className="side-brand-jp">シャーレ暗号解読</div>
            <div className="side-brand-en">SCHALE CIPHER</div>
          </div>
        </div>

        <div className="card side-acc">
          <div className="side-acc-h">先生のお名前</div>
          <input className="txt" placeholder="ニックネーム（任意）" value={name} maxLength={12}
            onChange={(e) => setName(e.target.value)} onBlur={commitName}
            onKeyDown={(e) => e.key === "Enter" && commitName()} />
          <div className="side-acc-best"><span className="tag">{difficulty.toUpperCase()} / {count}問 自己ベスト {best ? fmt(best) : "--:--.--"}</span></div>
          <span className="small">※ログイン不要・この端末に記録されます</span>
        </div>

        <nav className="side-nav">
          {NAV.map((n, i) => (
            <button key={i} onClick={() => goto(n.id)}>
              <span className="nav-ico"><Icon name={n.icon} size={18} /></span>{n.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* ===== メイン ===== */}
      <main className="main">
        <div className="hero hero-big">
          <div className="badge">SCHALE&nbsp;CIPHER&nbsp;DECODER</div>
          <h1>シャーレ暗号解読</h1>
          <div className="en">KIVOTOS &nbsp;ENCRYPTED &nbsp;TRANSMISSION</div>
          <p>
            数字に隠されたブルーアーカイブの生徒名を、対応規則から解き明かす暗号パズル。
            最後の問いが指す生徒を解読せよ──先生。
          </p>
          <div className="hero-tags">
            <span><Icon name="idcard" size={15} />全{NAMES.length}名から出題</span>
            <span><Icon name="gauge" size={15} />難易度3段階</span>
            <span><Icon name="trophy" size={15} />端末ランキング</span>
          </div>
          <button className="hero-cta" onClick={start}><Icon name="play" size={20} /> いますぐ挑戦する</button>
        </div>

        {/* 挑戦設定 */}
        <div className="card" id="sec-play">
          <CardTitle icon="play">挑戦設定</CardTitle>
          <div className="set-block">
            <div className="set-label">難易度</div>
            <div className="diffcards">
              {DIFFS.map((d) => (
                <button key={d.key} className={"diffcard d-" + d.key + (difficulty === d.key ? " sel" : "")} onClick={() => setDifficulty(d.key)}>
                  <div className="dstar">{d.stars}</div>
                  <div className="dname">{d.name}</div>
                  <div className="ddesc">{d.desc}</div>
                </button>
              ))}
            </div>
          </div>
          <div className="set-block">
            <div className="set-label">問題数</div>
            <div className="diffcards">
              {COUNTS.map((c) => (
                <button key={c.key} className={"diffcard" + (count === c.key ? " sel" : "")} onClick={() => setCount(c.key)}>
                  <div className="dname">{c.name}</div>
                  <div className="ddesc">{c.desc}</div>
                </button>
              ))}
            </div>
          </div>
          <div className="start-row">
            <button className="btn lg gold start-cta" onClick={start}>▶ ゲームスタート</button>
            <span className="tag">{difficulty.toUpperCase()} / {count}問 自己ベスト {best ? fmt(best) : "--:--.--"}</span>
          </div>
        </div>

        {/* 今日の生徒 ＋ ランキング/統計 */}
        <div className="main-row">
          <div id="sec-today"><StudentOfDay /></div>
          <div className="main-col">
            <div id="sec-rank"><HomeRanking ranking={ranking} difficulty={difficulty} count={count} user={user} /></div>
            <div id="sec-stats"><StatsPanel ranking={ranking} /></div>
          </div>
        </div>

        {/* 遊び方 */}
        <div id="sec-howto"><HowTo /></div>

        {/* 生徒名簿 */}
        <div className="card" id="sec-roster">
          <CardTitle icon="idcard">生徒名簿 <span className="small" style={{ fontWeight: 600, letterSpacing: 0, marginLeft: 6 }}>{NAMES.length}名</span></CardTitle>
          <button className="btn ghost" onClick={() => setShowRoster((s) => !s)}>{showRoster ? "名簿を閉じる" : "名簿を開く"}</button>
          <div className={"roster" + (showRoster ? " open" : "")} style={{ marginTop: showRoster ? 10 : 0 }}>
            {showRoster && NAMES.slice().sort().map((n) => (
              <span key={n} className="rname">
                {iconOf(n) && <img src={iconOf(n)} alt="" onError={(e) => { e.target.style.display = "none"; }}
                  style={{ width: 22, height: 22, borderRadius: 5, objectFit: "cover" }} />}
                {n}
              </span>
            ))}
          </div>
        </div>
      </main>
    </div>

    <Footer />
    </>
  );
}
