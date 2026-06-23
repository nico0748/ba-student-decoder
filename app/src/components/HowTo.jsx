import React, { useState } from "react";
import Icon from "./Icon.jsx";

const STEPS = [
  { n: 1, icon: "signal", title: "対応を見つける", text: "「確定情報」（例：【①②③】＝カンナ）から、数字とカタカナの対応をいくつか割り出す。" },
  { n: 2, icon: "table", title: "文字を特定する", text: "「傍受データ」の数字列はすべて実在の生徒名。照らし合わせて残りの文字を埋めていく。" },
  { n: 3, icon: "check", title: "解答する", text: "「問題」の数字列が誰を指すか推理し、カタカナで解答！ 答えは必ず1つに定まる。" },
];

export default function HowTo() {
  const [open, setOpen] = useState(false);

  return (
    <section className="howto-sec card">
      <div className="howto-head">
        <h2 className="howto-title"><span className="titleicon"><Icon name="book" /></span>遊び方</h2>
        <button className="more-btn" onClick={() => setOpen((o) => !o)}>
          {open ? "とじる" : "もっとみる"} <span className="more-ar">›</span>
        </button>
      </div>

      <div className="steps">
        {STEPS.map((s) => (
          <div className="step" key={s.n}>
            <span className="step-badge">STEP{s.n}</span>
            <div className="step-body">
              <div className="step-ico"><Icon name={s.icon} size={80} /></div>
              <div className="step-main">
                <div className="step-name">{s.title}</div>
                <p className="step-text">{s.text}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {open && (
        <div className="howto-ex">
          <div className="howto-ex-h">解いてみよう（例題）</div>
          <p className="howto-ex-p">
            <b>【①②③】＝カンナ</b> のとき、傍受データ <b>【④⑤③】【⑥⑤③】【⑦①⑤】</b> から
            <b>【⑦⑥⑤】</b> は誰？
          </p>
          <p className="howto-ex-p">
            ④⑤③・⑥⑤③ は <b>セリナ／マリナ</b>（⑤=リ, ③=ナ）、⑦①⑤ は <b>ヒカリ</b>（⑦=ヒ）。
            すると ⑦⑥⑤ は「ヒ◯リ」。⑥=マ なら <b>ヒマリ</b>（実在）、⑥=セ なら「ヒセリ」（不在）。
            よって答えは <b className="halo">ヒマリ</b> に一意に定まる。
          </p>
        </div>
      )}
    </section>
  );
}
