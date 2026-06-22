import React, { useEffect, useState } from "react";

// 3 → 2 → 1 → START のカウントダウン。完了で onDone() を呼ぶ。
export default function Countdown({ onDone }) {
  const [n, setN] = useState(3);

  useEffect(() => {
    if (n <= -1) { onDone(); return; }
    const t = setTimeout(() => setN((v) => v - 1), n === 0 ? 700 : 850);
    return () => clearTimeout(t);
  }, [n, onDone]);

  const label = n > 0 ? n : "START";
  return (
    <div className="cdwrap">
      <div className="cdlabel">解読開始まで</div>
      <div className="cdring cdpulse" key={n}></div>
      <div className={"cdnum cdpulse" + (n === 0 ? " go" : "")} key={"num" + n}>
        {label}
      </div>
    </div>
  );
}
