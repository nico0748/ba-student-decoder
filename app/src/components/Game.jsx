import React, { useEffect, useMemo, useRef, useState } from "react";
import { generatePuzzle, chars } from "../engine.js";
import { addRecord, fmt, bestTime, setRank } from "../ranking.js";
import { useLeaderboard } from "../useLeaderboard.js";
import { portraitOf, hintOf } from "../data.js";
import { toKatakana } from "../kana.js";
import { fireConfetti } from "../confetti.js";
import Footer from "./Footer.jsx";
import CardTitle from "./CardTitle.jsx";
import { remoteEnabled, startSession, submitScore, clientId } from "../leaderboard.js";
import { track } from "../analytics.js";

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
  const [hintLevel, setHintLevel] = useState(0); // 公開済みヒント段数（問題ごとにリセット）
  const [start, setStart] = useState(Date.now()); // セッション開始時刻（問題が変わってもリセットしない）
  const [now, setNow] = useState(Date.now());
  const [finalTime, setFinalTime] = useState(0);
  const [boardRefresh, setBoardRefresh] = useState(0); // 共有ランキング再取得トリガ
  const timerRef = useRef(null);
  const tokenRef = useRef(null);      // サーバ発行の開始トークン（共有ランキング用）
  const solvedRef = useRef([]);       // 検証用に各問の出題内容を収集

  // 1問だけ生成（タイマーは触らない）
  const loadPuzzle = () => {
    let p = generatePuzzle(difficulty); let g = 0;
    while (!p && g++ < 3) p = generatePuzzle(difficulty);
    setPuzzle(p);
    const init = {}; if (p) for (const [ch, dg] of Object.entries(p.confirmedMap)) init[dg] = ch;
    setMemo(init);
    setAnswer(""); setStatus("playing"); setHintLevel(0);
  };

  // セッション開始（タイマーリセット＋1問目）
  const newSession = () => {
    setSolved(0); setFinalTime(0);
    setStart(Date.now()); setNow(Date.now());
    solvedRef.current = []; tokenRef.current = null;
    if (remoteEnabled) startSession(difficulty, target).then((s) => { if (s) tokenRef.current = s.token; });
    track("game_start", { difficulty, count: target });
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

  const { rows: rankRows, source: rankSource, loading: rankLoading } = useLeaderboard(ranking, difficulty, target, 10, boardRefresh);
  const myBest = useMemo(() => bestTime(ranking, difficulty, target, user || "先生"), [ranking, difficulty, target, user]);

  if (!puzzle) return <div style={{ padding: 40, textAlign: "center" }}>生成中...</div>;

  const fixedMap = {}; for (const [ch, dg] of Object.entries(puzzle.confirmedMap)) fixedMap[dg] = ch;
  const allDigits = new Set();
  [puzzle.confirmed.seq, ...puzzle.deductionSeqs, puzzle.questionSeq].forEach((s) => chars(s).forEach((d) => allDigits.add(d)));
  const display = (d) => (fixedMap[d] !== undefined ? fixedMap[d] : (memo[d] || ""));

  // ローマ字／ひらがなをカタカナへ自動変換。1セル=1文字なので確定済みカタカナは末尾1文字だけ残し、
  // 入力途中のローマ字（例: "sh"）は温存して次のキーで確定させる。
  const setMemoDigit = (d, v) => {
    const conv = toKatakana(v);
    const pending = (conv.match(/[a-zA-Z]+$/) || [""])[0];
    const kataPart = conv.slice(0, conv.length - pending.length);
    const lastKata = kataPart ? chars(kataPart).slice(-1).join("") : "";
    setMemo((m) => ({ ...m, [d]: lastKata + pending }));
  };

  const submit = () => {
    if (status !== "playing" && status !== "wrong") return;
    if (normalize(answer) === normalize(puzzle.answer)) {
      // 検証用にこの問の出題内容を収集
      solvedRef.current.push({
        confirmed: puzzle.confirmed, confirmedMap: puzzle.confirmedMap,
        deductionSeqs: puzzle.deductionSeqs, questionSeq: puzzle.questionSeq,
        answer: puzzle.answer, userAnswer: puzzle.answer,
      });
      const newSolved = solved + 1;
      setSolved(newSolved);
      if (newSolved >= target) {
        clearInterval(timerRef.current);
        const final = Date.now() - start; setFinalTime(final);
        setStatus("done"); fireConfetti();
        track("game_clear", { difficulty, count: target, time_ms: final });
        const entry = { name: user || "先生", time: final, difficulty, count: target, answer: puzzle.answer, date: Date.now(), clientId: clientId() };
        setRanking(addRecord(entry)); // 端末内（即時表示＆オフライン）
        // 共有ランキングへ送信（サーバが時間計測＋出題/回答を検証）
        if (remoteEnabled && tokenRef.current) {
          submitScore({ token: tokenRef.current, name: user || "先生", difficulty, count: target, puzzles: solvedRef.current })
            .then((res) => { if (res && res.ok) setBoardRefresh((k) => k + 1); }); // 送信成功後に共有ランキングを再取得
        }
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

  // リザルトを X（旧Twitter）へ共有。共有URLは /api/share（結果焼き込みOGP画像を返す）を指す。
  const shareToX = () => {
    const text = `シャーレ暗号解読 [${difficulty.toUpperCase()} / ${target}問] を ${fmt(finalTime)} でクリア！🎉\n#シャーレ暗号解読 #ブルアカ`;
    const origin = (typeof window !== "undefined") ? window.location.origin : "";
    const shareUrl = origin ? `${origin}/api/share?d=${difficulty}&c=${target}&t=${finalTime}` : "";
    const intent = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}${shareUrl ? `&url=${encodeURIComponent(shareUrl)}` : ""}`;
    if (typeof window !== "undefined") window.open(intent, "_blank", "noopener,noreferrer");
  };

  // ヒント（答えの生徒の 所属学園 → 学年/レアリティ の順に段階公開）
  const hint = hintOf(puzzle.answer);
  const hintSteps = [];
  if (hint?.school) hintSteps.push({ label: "所属学園", value: hint.school });
  if (hint?.grade) hintSteps.push({ label: "学年", value: hint.grade });
  const revealedHints = hintSteps.slice(0, hintLevel);
  const canHint = (status === "playing" || status === "wrong") && hintLevel < hintSteps.length;

  return (
    <div className="screen-narrow">
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
        <CardTitle icon="signal">傍受通信ログ <span className="tag" style={{ marginLeft: 6 }}>第 {Math.min(solved + 1, target)} 問</span></CardTitle>
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
        <CardTitle icon="table">対応表メモ <span className="small" style={{ fontWeight: 600, letterSpacing: 0, marginLeft: 6 }}>気づいた数字→文字を書き込もう</span></CardTitle>
        <div className="memo">
          {"0123456789".split("").map((d) => {
            const used = allDigits.has(d); const fixed = fixedMap[d] !== undefined;
            return (
              <div key={d} className={"memocell " + (fixed ? "fixed" : used ? "used" : "idle")}>
                <div className="d">{d}</div>
                <input value={fixed ? fixedMap[d] : (memo[d] || "")} disabled={fixed || !used}
                  maxLength={4} placeholder={used ? "？" : "-"} inputMode="text" autoComplete="off"
                  onChange={(e) => setMemoDigit(d, e.target.value)} />
              </div>
            );
          })}
        </div>
      </div>

      <div className="card">
        <CardTitle icon="pencil">解答</CardTitle>
        <div className="row">
          <input className="txt" style={{ maxWidth: 280 }} placeholder="生徒名（カタカナ）" value={answer}
            onChange={(e) => { setAnswer(e.target.value); if (status === "wrong") setStatus("playing"); }}
            onKeyDown={(e) => e.key === "Enter" && submit()} disabled={status !== "playing" && status !== "wrong"} />
          <button className="btn" onClick={submit} disabled={(status !== "playing" && status !== "wrong") || !answer.trim()}>解読する</button>
          {status === "solved" && <button className="btn gold" onClick={loadPuzzle}>次の問題へ →</button>}
          {canHint && (
            <button className="btn ghost" onClick={() => setHintLevel((l) => l + 1)}>
              💡 ヒント（{hintSteps[hintLevel].label}）
            </button>
          )}
          <div className="spacer"></div>
          {inProgress && <button className="link" onClick={giveUp}>降参（記録なしで終了）</button>}
        </div>

        {revealedHints.length > 0 && status !== "done" && status !== "gaveup" && (
          <div className="banner" style={{ background: "#eef6ff", color: "#1b4f86", border: "1.5px solid var(--ba-blue)", fontSize: 16 }}>
            💡 ヒント：{revealedHints.map((h) => `${h.label} = ${h.value}`).join("　/　")}
          </div>
        )}

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
            <span>★ {target}問 解読成功！　最後の答えは <span className="halo">{puzzle.answer}</span><br /><span style={{ fontWeight: 700, fontSize: 15 }}>{target}問 合計タイム {fmt(finalTime)}</span></span>
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
            {status === "done" && (
              <button className="btn" style={{ background: "#000", boxShadow: "0 4px 12px rgba(0,0,0,.25)" }} onClick={shareToX}>
                𝕏 で共有
              </button>
            )}
            <button className="btn ghost" onClick={onExit}>← トップへ</button>
          </div>
        )}
      </div>

      <div className="card">
        <CardTitle icon="trophy">解読タイム ランキング
          <span className="tag" style={{ marginLeft: 6 }}>{difficulty.toUpperCase()} / {target}問</span>
          <span className="tag" style={{ marginLeft: 6, background: rankSource === "remote" ? "#e7f6ee" : "#eef4fb", color: rankSource === "remote" ? "#0d8b56" : "var(--ba-blue-d)" }}>
            {rankSource === "remote" ? "🌐 共有" : "📱 端末内"}
          </span>
        </CardTitle>
        {rankRows.length === 0
          ? <p className="small">{rankLoading ? "読み込み中…" : "まだ記録がありません。最初の解読者になろう。"}</p>
          : <table className="rank">
            <thead><tr><th style={{ width: 48 }}>順位</th><th>先生</th><th>タイム</th>{rankSource === "local" && <th>解読</th>}</tr></thead>
            <tbody>
              {rankRows.map((r, i) => (
                <tr key={i} className={r.name === (user || "先生") ? "me" : ""}>
                  <td className="medal">{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}</td>
                  <td>{r.name}</td>
                  <td style={{ fontVariantNumeric: "tabular-nums", fontWeight: 800 }}>{fmt(r.time)}</td>
                  {rankSource === "local" && <td className="small">{r.answer}</td>}
                </tr>
              ))}
            </tbody>
          </table>}
        <div className="row" style={{ marginTop: 10 }}>
          <button className="link" onClick={() => { if (confirm("この端末のランキング記録を消去しますか？")) { setRank([]); setRanking([]); } }}>記録をリセット</button>
        </div>
      </div>

      <Footer />
    </div>
  );
}
