// 共有用ランディングページ。X等のクローラには OGP メタタグ（結果焼き込み画像）を返し、
// 人間はアプリ本体(/)へリダイレクトする Vercel Edge Function。
// 例: /api/share?d=normal&c=5&t=222180
export const config = { runtime: "edge" };

const DIFFS = { easy: "EASY", normal: "NORMAL", hard: "HARD" };
const COUNTS = new Set([1, 5, 10]);

const fmt = (ms) => {
  const s = Math.floor(ms / 1000), m = Math.floor(s / 60), cs = Math.floor((ms % 1000) / 10);
  return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
};

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export default function handler(req) {
  const u = new URL(req.url);
  const dRaw = (u.searchParams.get("d") || "normal").toLowerCase();
  const d = DIFFS[dRaw] ? dRaw : "normal";
  const cRaw = parseInt(u.searchParams.get("c") || "1", 10);
  const c = COUNTS.has(cRaw) ? cRaw : 1;
  const t = Math.max(0, Math.min(3600000, parseInt(u.searchParams.get("t") || "0", 10) || 0));

  const origin = u.origin;
  const img = `${origin}/api/og?d=${d}&c=${c}&t=${t}`;
  const title = `シャーレ暗号解読 [${DIFFS[d]} / ${c}問] を ${fmt(t)} でクリア！`;
  const desc = "数字に隠された生徒名を解読する暗号パズル。あなたも挑戦してタイムを競おう。";

  const html = `<!doctype html><html lang="ja"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${esc(img)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:url" content="${esc(origin)}/">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${esc(img)}">
<meta http-equiv="refresh" content="0; url=/">
</head><body style="font-family:sans-serif;text-align:center;padding:48px;color:#1a2233">
<p>${esc(title)}</p>
<p><a href="/">▶ シャーレ暗号解読をプレイ</a></p>
<script>location.replace('/')</script>
</body></html>`;

  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=300" } });
}
