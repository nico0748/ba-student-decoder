// 共有ランキング（Supabase）クライアント。
// 環境変数が未設定なら enabled=false となり、アプリは従来どおり端末内ランキングで動作する。
//   VITE_SUPABASE_URL        … Supabase プロジェクト URL
//   VITE_SUPABASE_ANON_KEY   … 公開用 anon key（フロントに置いてよい鍵）
//   VITE_TURNSTILE_SITEKEY   … Cloudflare Turnstile サイトキー（任意・bot対策）
const URL = import.meta.env.VITE_SUPABASE_URL;
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY;
const TURNSTILE_SITEKEY = import.meta.env.VITE_TURNSTILE_SITEKEY;

export const remoteEnabled = !!(URL && ANON);

const headers = () => ({ apikey: ANON, Authorization: `Bearer ${ANON}`, "Content-Type": "application/json" });

// 端末ごとの匿名ID（自分の記録の同定・レート制限キー）
export function clientId() {
  try {
    let id = localStorage.getItem("schale_client_id");
    if (!id) { id = (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random()); localStorage.setItem("schale_client_id", id); }
    return id;
  } catch { return null; }
}

// --- Turnstile（任意）：トークンを1つ取得。未設定/失敗時は undefined を返す ---
let tsLoaded = null;
function loadTurnstile() {
  if (!TURNSTILE_SITEKEY) return Promise.resolve(false);
  if (tsLoaded) return tsLoaded;
  tsLoaded = new Promise((resolve) => {
    if (window.turnstile) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
    s.async = true; s.defer = true;
    s.onload = () => resolve(true); s.onerror = () => resolve(false);
    document.head.appendChild(s);
  });
  return tsLoaded;
}
async function getTurnstileToken() {
  if (!TURNSTILE_SITEKEY) return undefined;
  const ok = await loadTurnstile();
  if (!ok || !window.turnstile) return undefined;
  return await new Promise((resolve) => {
    let done = false;
    const box = document.createElement("div");
    box.style.cssText = "position:fixed;left:-9999px;top:-9999px;";
    document.body.appendChild(box);
    const finish = (tok) => { if (done) return; done = true; try { document.body.removeChild(box); } catch {} resolve(tok); };
    try {
      window.turnstile.render(box, { sitekey: TURNSTILE_SITEKEY, size: "invisible", callback: (t) => finish(t), "error-callback": () => finish(undefined) });
      setTimeout(() => finish(undefined), 8000); // タイムアウト保険
    } catch { finish(undefined); }
  });
}

// ゲーム開始：サーバから署名トークンを取得（経過時間のサーバ計測に使用）
export async function startSession(difficulty, count) {
  if (!remoteEnabled) return null;
  try {
    const r = await fetch(`${URL}/functions/v1/start-game`, { method: "POST", headers: headers(), body: JSON.stringify({ difficulty, count }) });
    if (!r.ok) return null;
    return await r.json(); // { token, iat }
  } catch { return null; }
}

// スコア送信（出題内容・回答を添えてサーバ検証）。戻り値 { ok, ... }
export async function submitScore({ token, name, difficulty, count, puzzles }) {
  if (!remoteEnabled || !token) return { ok: false, skipped: true };
  try {
    const turnstileToken = await getTurnstileToken();
    const r = await fetch(`${URL}/functions/v1/submit-score`, {
      method: "POST", headers: headers(),
      body: JSON.stringify({ token, name, difficulty, count, clientId: clientId(), turnstileToken, puzzles }),
    });
    const d = await r.json().catch(() => ({}));
    return r.ok ? { ok: true, ...d } : { ok: false, error: d.error || r.status };
  } catch (e) { return { ok: false, error: "network" }; }
}

// 上位ランキング（名前ごとのベスト・上位N件）。[{name, time}]
export async function fetchTop(difficulty, count, limit = 10) {
  if (!remoteEnabled) return null;
  try {
    const r = await fetch(`${URL}/rest/v1/rpc/get_leaderboard`, {
      method: "POST", headers: headers(),
      body: JSON.stringify({ p_difficulty: difficulty, p_count: count, p_limit: limit }),
    });
    if (!r.ok) return null;
    const rows = await r.json();
    return (rows || []).map((x) => ({ name: x.name, time: x.time_ms }));
  } catch { return null; }
}

// 自己ベスト（ms）。無ければ null
export async function fetchBest(difficulty, count, name) {
  if (!remoteEnabled) return null;
  try {
    const r = await fetch(`${URL}/rest/v1/rpc/get_best`, {
      method: "POST", headers: headers(),
      body: JSON.stringify({ p_difficulty: difficulty, p_count: count, p_name: name }),
    });
    if (!r.ok) return null;
    const v = await r.json();
    return typeof v === "number" ? v : null;
  } catch { return null; }
}
