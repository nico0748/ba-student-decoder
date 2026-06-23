import React, { useMemo, useState } from "react";
import { STUDENTS_DETAIL, studentDetail, iconOf } from "../data.js";
import CardTitle from "./CardTitle.jsx";

// アイコン（正方形・統一フレーム）が存在する基準生徒のみを対象にする
const POOL = Object.keys(STUDENTS_DETAIL).filter((n) => iconOf(n));

export default function StudentOfDay() {
  // 「今日の生徒」: 日付シードで決定（同じ日は同じ生徒）。「別の生徒」でランダム切替。
  const todayIndex = useMemo(() => {
    const day = Math.floor(Date.now() / 86400000);
    let h = day * 2654435761 % POOL.length;
    return ((h % POOL.length) + POOL.length) % POOL.length;
  }, []);
  const [idx, setIdx] = useState(todayIndex);
  const [noimg, setNoimg] = useState(false);

  const name = POOL[idx];
  const d = studentDetail(name) || {};
  const shuffle = () => { let n = idx; while (n === idx && POOL.length > 1) n = Math.floor(Math.random() * POOL.length); setIdx(n); setNoimg(false); };

  const src = iconOf(name);

  return (
    <div className="card sod">
      <CardTitle icon="sparkle">今日の生徒</CardTitle>
      <div className="sod-body">
        <div className="sod-img">
          {src && !noimg
            ? <img src={src} alt={name} onError={() => setNoimg(true)} />
            : <span className="sod-noimg">No Image</span>}
        </div>
        <div className="sod-name">
          {d.f && <span className="sod-fam">{d.f}</span>}
          <span className="sod-given">{name}</span>
        </div>
        <dl className="sod-prof">
          {d.s && <><dt>学校</dt><dd>{d.s}{d.y ? `・${d.y}` : ""}</dd></>}
          {d.cv && <><dt>CV</dt><dd>{d.cv}</dd></>}
          {d.b && <><dt>誕生日</dt><dd>{d.b}{d.a ? `（${d.a}）` : ""}</dd></>}
          {d.h && <><dt>趣味</dt><dd>{d.h}</dd></>}
        </dl>
        <button className="link" onClick={shuffle}>別の生徒を見る</button>
      </div>
    </div>
  );
}
