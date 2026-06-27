// 結果焼き込みの OGP 画像（1200x630 PNG）を動的生成する Vercel Edge Function。
// 例: /api/og?d=normal&c=5&t=222180
import { ImageResponse } from "@vercel/og";

export const config = { runtime: "edge" };

const DIFFS = { easy: "EASY", normal: "NORMAL", hard: "HARD" };
const COUNTS = new Set([1, 5, 10]);

// ms -> mm:ss.cs（アプリの ranking.fmt と同じ表記）
const fmt = (ms) => {
  const s = Math.floor(ms / 1000), m = Math.floor(s / 60), cs = Math.floor((ms % 1000) / 10);
  return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
};

// 画像で使用しうる文字（サブセット取得用）。ここに無い文字は豆腐になるので注意。
const SUBSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 /:.！シャーレ暗号解読問でクリア";

// Google Fonts から必要文字だけのフォントを取得。satori は woff/ttf/otf 対応（woff2 不可）なので
// woff を返す古めの User-Agent でリクエストする。
async function loadFont(family, weight, text) {
  const url = `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, "+")}:wght@${weight}&text=${encodeURIComponent(text)}`;
  const css = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_3) AppleWebKit/537.75.14 (KHTML, like Gecko) Version/7.0.3 Safari/7046A194A" },
  }).then((r) => r.text());
  const m = css.match(/src:\s*url\(([^)]+)\)\s*format\(['"]?(woff|truetype|opentype)['"]?\)/);
  if (!m) throw new Error("font parse failed");
  return fetch(m[1]).then((r) => r.arrayBuffer());
}

const el = (type, style, children) => ({ type, props: { style, ...(children !== undefined ? { children } : {}) } });

export default async function handler(req) {
  try {
    const u = new URL(req.url);
    const dRaw = (u.searchParams.get("d") || "normal").toLowerCase();
    const d = DIFFS[dRaw] ? dRaw : "normal";
    const cRaw = parseInt(u.searchParams.get("c") || "1", 10);
    const c = COUNTS.has(cRaw) ? cRaw : 1;
    const t = Math.max(0, Math.min(3600000, parseInt(u.searchParams.get("t") || "0", 10) || 0));

    const fontData = await loadFont("Noto Sans JP", 700, SUBSET);

    const tree = el("div", {
      height: "100%", width: "100%", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: "linear-gradient(135deg, #2b5fa6 0%, #3da9fc 100%)",
      color: "#ffffff", fontFamily: "NotoJP", padding: "60px",
    }, [
      el("div", { fontSize: 30, letterSpacing: 8, opacity: 0.9, marginBottom: 10, display: "flex" }, "SCHALE CIPHER DECODER"),
      el("div", { fontSize: 78, fontWeight: 700, marginBottom: 30, display: "flex" }, "シャーレ暗号解読"),
      el("div", {
        fontSize: 42, fontWeight: 700, padding: "10px 34px", borderRadius: 999,
        background: "rgba(255,255,255,0.20)", marginBottom: 34, display: "flex",
      }, `${DIFFS[d]} / ${c}問`),
      el("div", { fontSize: 132, fontWeight: 700, lineHeight: 1, display: "flex" }, fmt(t)),
      el("div", { fontSize: 46, fontWeight: 700, marginTop: 20, color: "#ffe6a0", display: "flex" }, "でクリア！"),
    ]);

    return new ImageResponse(tree, {
      width: 1200, height: 630,
      fonts: [{ name: "NotoJP", data: fontData, weight: 700, style: "normal" }],
      headers: { "cache-control": "public, max-age=86400, s-maxage=86400" },
    });
  } catch (e) {
    return new Response("og image error", { status: 500 });
  }
}
