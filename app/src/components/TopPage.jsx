import React, { useState } from "react";
import { setUserLS, bestTime, fmt } from "../ranking.js";
import { NAMES, iconOf } from "../data.js";
import Footer from "./Footer.jsx";

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

export default function TopPage({ difficulty, setDifficulty, count, setCount, user, setUser, ranking, onStart }) {
  const [name, setName] = useState(user || "");
  const [showRoster, setShowRoster] = useState(false);

  const commitName = () => {
    const u = (name || "").trim().slice(0, 12) || "先生";
    setName(u); setUser(u); setUserLS(u);
  };
  const start = () => { commitName(); onStart(); };

  const best = bestTime(ranking, difficulty, count, user || "先生");

  return (
    <div>
      <div className="hero">
        <div className="badge">SCHALE&nbsp;CIPHER&nbsp;DECODER</div>
        <h1>シャーレ暗号解読</h1>
        <div className="en">KIVOTOS &nbsp;ENCRYPTED &nbsp;TRANSMISSION</div>
        <p>
          キヴォトスの暗号通信を傍受した。数字に隠された生徒名の対応規則を見抜き、
          最後の問いが指す生徒を解読せよ──先生。タイムは端末ランキングに刻まれる。
        </p>
      </div>

      <div className="card">
        <h2><span className="bar"></span>先生のお名前</h2>
        <div className="row">
          <input className="txt" style={{ maxWidth: 260 }} placeholder="ニックネーム（任意）"
            value={name} maxLength={12}
            onChange={(e) => setName(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => e.key === "Enter" && commitName()} />
          <span className="small">※ログイン不要・この端末に記録されます</span>
        </div>
      </div>

      <div className="card">
        <h2><span className="bar"></span>難易度を選択</h2>
        <div className="diffcards">
          {DIFFS.map((d) => (
            <button key={d.key} className={"diffcard" + (difficulty === d.key ? " sel" : "")}
              onClick={() => setDifficulty(d.key)}>
              <div className="dstar">{d.stars}</div>
              <div className="dname">{d.name}</div>
              <div className="ddesc">{d.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <h2><span className="bar"></span>問題数を選択</h2>
        <div className="diffcards">
          {COUNTS.map((c) => (
            <button key={c.key} className={"diffcard" + (count === c.key ? " sel" : "")}
              onClick={() => setCount(c.key)}>
              <div className="dname">{c.name}</div>
              <div className="ddesc">{c.desc}</div>
            </button>
          ))}
        </div>
        <div className="row" style={{ marginTop: 14, justifyContent: "center" }}>
          <span className="tag">{difficulty.toUpperCase()} / {count}問 自己ベスト {best ? fmt(best) : "--:--.--"}</span>
        </div>
        <div className="row" style={{ marginTop: 14, justifyContent: "center" }}>
          <button className="btn lg gold" onClick={start}>▶ ゲームスタート</button>
        </div>
      </div>

      <div className="card">
        <h2><span className="bar"></span>遊び方</h2>
        <ol className="howto">
          <li>「確定情報」から、数字とカタカナの対応がいくつか分かる。</li>
          <li>「傍受データ」の数字列はすべて実在の生徒名。照合して文字を特定。</li>
          <li>「問題」の数字列が誰かを推理し、カタカナで解答する。</li>
          <li>答えは必ず1つに定まる設計。最速タイムを目指そう。</li>
        </ol>
      </div>

      <div className="card">
        <h2><span className="bar"></span>生徒名簿 <span className="small" style={{ fontWeight: 600, letterSpacing: 0, marginLeft: 6 }}>{NAMES.length}名 / 知らない名前のヒントに</span></h2>
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

      <Footer />
    </div>
  );
}
