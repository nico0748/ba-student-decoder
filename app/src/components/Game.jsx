import React, { useEffect, useMemo, useRef, useState } from "react";
import { generatePuzzle, chars } from "../engine.js";
import { addRecord, fmt, bestTime, topRows, setRank } from "../ranking.js";
import { portraitOf } from "../data.js";
import { fireConfetti } from "../confetti.js";

const normalize = (s) => (s || "").trim().replace(/\s/g, "");

function Chip({ digit, kana, kind }) {
  return (
    <div className={"chip" + (kind ? " " + kind : "")}>
      <span className="num">{digit}</span>
      <span className={"kana" + (kana ? "" : " empty")}>{kana || "・"}</span>
    </div>
  );
}

export default function Game({ difficulty, count, user, ranking, setRanking, onExit }) {
  const target = count || 1;
  const [puzzle, setPuzzle] = useState(null);
  const [memo, setMemo] = useState({});
  const [answer, setAnswer] = useState("");
  // playing: 解答中 / wrong: 誤答 / solved: 当該問題クリア(次へ待ち) / done: 全問クリア(記録済) / gaveup: 降参(記録なし)
  const [status, setStatus] = useState("playing");
  const [solved, setSolved] = useState(0); // セッション内で解いた問題数
  const [start, setStart] = useState(Date.now()); // セッション開始時刻（問題が変わってもリセットしない）
  const [now, setNow] = useState(Date.now());
  const [finalTime, setFinalTime] = useState(0);
  const timerRef = useRef(null);

  // 1問だけ生成（タイマーは触らない）
  const loadPuzzle = () => {
    let p = generatePuzzle(difficulty); let g = 0;
    while (!p && g++ < 3) p = generatePuzzle(difficulty);
    setPuzzle(p);
    const init = {}; if (p) for (const [ch, dg] of Object.entries(p.confirmedMap)) init[dg] = ch;
    setMemo(init);
    setAnswer(""); setStatus("playing");
  };

  // セッション開始（タイマーリセット＋1問目）
  const newSession = () => {
    setSolved(0); setFinalTime(0);
    setStart(Date.now()); setNow(Date.now());
    loadPuzzle();
  };

  // 初回（カウントダウン直後にマウント）
  useEffect(() => { newSession(); /* eslint-disable-next-line */ }, []);

  const inProgress = status === "playing" || status === "wrong" || status === "solved";

  useEffect(() => {
    if (inProgress) timerRef.current = setInterval(() => setNow(Date.now()), 50);
    return () => clearInterval(timerRef.current);
  }, [status, puzzle]);

  const elapsed = inProgress ? now - start : finalTime;

  const rankRows = useMemo(() => topRows(ranking, difficulty, target), [ranking, difficulty, target]);
  const myBest = useMemo(() => bestTime(ranking, difficulty, target, user || "先生"), [ranking, difficulty, target, user]);

  if (!puzzle) return <div style={{ padding: 40, textAlign: "center" }}>生成中...</div>;

  const fixedMap = {}; for (const [ch, dg] of Object.entries(puzzle.confirmedMap)) fixedMap[dg] = ch;
  const allDigits = new Set();
  [puzzle.confirmed.seq, ...puzzle.deductionSeqs, puzzle.questionSeq].forEach((s) => chars(s).forEach((d) => allDigits.add(d)));
  const display = (d) => (fixedMap[d] !== undefined ? fixedMap[d] : (memo[d] || ""));

  const setMemoDigit = (d, v) => { const v2 = chars(v).slice(-1).join(""); setMemo((m) => ({ ...m, [d]: v2 })); };

  const submit = () => {
    if (status !== "playing" && status !== "wrong") return;
    if (normalize(answer) === normalize(puzzle.answer)) {
      const newSolved = solved + 1;
      setSolved(newSolved);
      if (newSolved >= target) {
        clearInterval(timerRef.current);
        const final = Date.now() - start; setFinalTime(final);
        setStatus("done"); fireConfetti();
        const entry = { name: user || "先生", time: final, difficulty, count: target, answer: puzzle.answer, date: Date.now() };
        setRanking(addRecord(entry));
      } else {
        setStatus("solved"); // 次の問題へ待ち（タイマーは継続）
      }
    } else { setStatus("wrong"); }
  };

  const giveUp = () => {
    if (!inProgress) return;
    clearInterval(timerRef.current);
    setStatus("gaveup");
  };

  return (
    <div>
      <div className="hdr">
        <h1 className="title"><span className="plus"></span>シャーレ暗号解読</h1>
      </div>
      <div className="logo">SCHALE&nbsp;&nbsp;CIPHER&nbsp;DECODER</div>
      <p className="sub">数字に隠された生徒名を解読せよ、先生。</p>

      <div className="topbar">
        <div>
          <div className="lab">解読タイム　<span className="tag">{Math.min(solved + (inProgress ? 1 : 0), target)} / {target} 問</span></div>
          <div className="timer">{fmt(elapsed)}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="lab">{difficulty.toUpperCase()} / {target}問　自己ベスト {myBest ? fmt(myBest) : "--:--.--"}</div>
          <button className="pill" style={{ marginTop: 6 }} onClick={onExit}>← トップへ</button>
        </div>
      </div>

      <div className="card">
        <h2><span className="bar"></span>傍受通信ログ <span className="tag" style={{ marginLeft: 6 }}>第 {Math.min(solved + 1, target)} 問</span></h2>
        <div className="seqline">
          <span className="seqlabel">確定情報</span>
          <div className="chips">{chars(puzzle.confirmed.seq).map((d, i) => <Chip key={i} digit={d} kana={fixedMap[d]} kind="fixed" />)}</div>
          <span className="eq">＝</span>
          <span className="ansname">{puzzle.confirmed.name}</span>
        </div>
        {puzzle.deductionSeqs.map((seq, si) => (
          <div className="seqline" key={si}>
            <span className="seqlabel">{si === 0 ? "傍受データ" : ""}</span>
            <div className="chips">{chars(seq).map((d, i) => <Chip key={i} digit={d} kana={display(d)} kind={fixedMap[d] !== undefined ? "fixed" : ""} />)}</div>
          </div>
        ))}
        <div className="seqline" style={{ marginTop: 14, paddingTop: 12, borderTop: "1.5px dashed var(--ba-line)" }}>
          <span className="seqlabel" style={{ color: "var(--ba-green)" }}>問題</span>
          <div className="chips">{chars(puzzle.questionSeq).map((d, i) => <Chip key={i} digit={d} kana={display(d)} kind="q" />)}</div>
          <span className="eq">＝</span>
          <span className="qmark">？</span>
        </div>
      </div>

      <div className="card">
        <h2><span className="bar"></span>対応表メモ <span className="small" style={{ fontWeight: 600, letterSpacing: 0, marginLeft: 6 }}>気づいた数字→文字を書き込もう</span></h2>
        <div className="memo">
          {"0123456789".split("").map((d) => {
            const used = allDigits.has(d); const fixed = fixedMap[d] !== undefined;
            return (
              <div key={d} className={"memocell " + (fixed ? "fixed" : used ? "used" : "idle")}>
                <div className="d">{d}</div>
                <input value={fixed ? fixedMap[d] : (memo[d] || "")} disabled={fixed || !used}
                  maxLength={2} placeholder={used ? "？" : "-"}
                  onChange={(e) => setMemoDigit(d, e.target.value)} />
              </div>
            );
          })}
        </div>
      </div>

      <div className="card">
        <h2><span className="bar"></span>解答</h2>
        <div className="row">
          <input className="txt" style={{ maxWidth: 280 }} placeholder="生徒名（カタカナ）" value={answer}
            onChange={(e) => { setAnswer(e.target.value); if (status === "wrong") setStatus("playing"); }}
            onKeyDown={(e) => e.key === "Enter" && submit()} disabled={status !== "playing" && status !== "wrong"} />
          <button className="btn" onClick={submit} disabled={(status !== "playing" && status !== "wrong") || !answer.trim()}>解読する</button>
          {status === "solved" && <button className="btn gold" onClick={loadPuzzle}>次の問題へ →</button>}
          <div className="spacer"></div>
          {inProgress && <button className="link" onClick={giveUp}>降参（記録なしで終了）</button>}
        </div>

        {status === "solved" && (
          <div className="banner ok">
            ★ 第 {solved} 問 解読！　残り {target - solved} 問。「次の問題へ →」で続行（タイマー継続中）。
          </div>
        )}

        {status === "done" && (
          <div className="banner ok" style={{ flexDirection: "row", alignItems: "center" }}>
            {portraitOf(puzzle.answer) &&
              <img src={portraitOf(puzzle.answer)} alt={puzzle.answer}
                onError={(e) => { e.target.style.display = "none"; }}
                style={{ width: 64, height: 64, borderRadius: 12, objectFit: "cover", objectPosition: "top", border: "2px solid var(--ba-green)", flex: "0 0 auto" }} />}
            <span>★ {target}問 解読成功！　最後の答えは <span className="halo">{puzzle.answer}</span><br /><span style={{ fontWeight: 700, fontSize: 13 }}>{target}問 合計タイム {fmt(finalTime)}</span></span>
          </div>
        )}

        {status === "wrong" && <div className="banner ng">… 通信ノイズ。もう一度確認を、先生。</div>}

        {status === "gaveup" && (
          <div className="banner ng" style={{ background: "#fff8e0", color: "#8a6d00", borderColor: "var(--ba-yellow)" }}>
            降参しました（記録なし）。この問題の答え：<span style={{ fontWeight: 800 }}>{puzzle.answer}</span>
          </div>
        )}

        {(status === "done" || status === "gaveup") && (
          <div className="row" style={{ marginTop: 12 }}>
            <button className="btn gold" onClick={newSession}>もう一度（{target}問）</button>
            <button className="btn ghost" onClick={onExit}>← トップへ</button>
          </div>
        )}
      </div>

      <div className="card">
        <h2><span className="bar"></span>解読タイム ランキング <span className="tag" style={{ marginLeft: 6 }}>{difficulty.toUpperCase()} / {target}問</span></h2>
        {rankRows.length === 0 ? <p className="small">まだ記録がありません。最初の解読者になろう。</p> :
          <table className="rank">
            <thead><tr><th style={{ width: 48 }}>順位</th><th>先生</th><th>タイム</th><th>解読</th></tr></thead>
            <tbody>
              {rankRows.map((r, i) => (
                <tr key={i} className={r.name === (user || "先生") ? "me" : ""}>
                  <td className="medal">{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}</td>
                  <td>{r.name}</td>
                  <td style={{ fontVariantNumeric: "tabular-nums", fontWeight: 800 }}>{fmt(r.time)}</td>
                  <td className="small">{r.answer}</td>
                </tr>
              ))}
            </tbody>
          </table>}
        <div className="row" style={{ marginTop: 10 }}>
          <button className="link" onClick={() => { if (confirm("この端末のランキング記録を消去しますか？")) { setRank([]); setRanking([]); } }}>記録をリセット</button>
        </div>
      </div>
    </div>
  );
}
