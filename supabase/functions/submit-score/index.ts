// POST /functions/v1/submit-score
// body: { token, name, difficulty, count, clientId, turnstileToken, puzzles: Puzzle[] }
// 不正対策：
//  (1) HMAC署名トークン検証＋有効期限＋使い捨て(リプレイ防止)
//  (2) Turnstile による bot 対策
//  (3) 出題内容(confirmed/deduction/question)・回答・一意性をサーバで再検証
//  (4) 所要時間はサーバが iat→now で計測（クライアント申告は不採用）＋値域チェック
//  (5) name 長・difficulty/count のホワイトリスト
//  (6) client_id / IPハッシュ 単位のレート制限
//  書き込みは service_role 経由のみ（RLSをバイパス）。
import { json, corsHeaders, verifyToken, verifyTurnstile, ipHash, getIp, clampName, DIFFS, COUNTS } from "../_shared/util.ts";
import { validatePuzzle } from "../_shared/engine.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const HMAC_SECRET = Deno.env.get("GAME_HMAC_SECRET")!;
const IP_SALT = Deno.env.get("IP_HASH_SALT") || "schale-cipher";

const MIN_MS_PER_Q = 600;          // これより速いのは不正とみなす下限
const MAX_MS_PER_Q = 10 * 60 * 1000;

function pgHeaders(extra: Record<string, string> = {}) {
  return { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json", ...extra };
}

// 使い捨てトークン消費。既出(=リプレイ)なら false。
async function consumeNonce(nonce: string): Promise<boolean> {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/used_tokens`, {
    method: "POST", headers: pgHeaders({ Prefer: "return=minimal" }), body: JSON.stringify({ nonce }),
  });
  if (r.status === 201 || r.status === 204) return true;
  return false; // 409(重複)など
}

async function countSince(table: string, col: string, val: string, seconds: number): Promise<number> {
  const since = new Date(Date.now() - seconds * 1000).toISOString();
  const url = `${SUPABASE_URL}/rest/v1/${table}?select=id&${col}=eq.${encodeURIComponent(val)}&created_at=gte.${encodeURIComponent(since)}`;
  const r = await fetch(url, { headers: pgHeaders({ Prefer: "count=exact" }) });
  const cr = r.headers.get("content-range") || "";
  const total = cr.includes("/") ? parseInt(cr.split("/")[1]) : NaN;
  if (!Number.isNaN(total)) return total;
  const arr = await r.json().catch(() => []);
  return Array.isArray(arr) ? arr.length : 0;
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(origin) });
  if (req.method !== "POST") return json({ error: "method" }, 405, origin);
  if (!SUPABASE_URL || !SERVICE_KEY || !HMAC_SECRET) return json({ error: "server_misconfigured" }, 500, origin);

  let body: any;
  try { body = await req.json(); } catch { return json({ error: "bad_json" }, 400, origin); }

  // --- 基本パラメータ ---
  const name = clampName(body?.name);
  const difficulty = String(body?.difficulty || "");
  const count = Number(body?.count);
  const clientId = typeof body?.clientId === "string" && /^[0-9a-f-]{36}$/i.test(body.clientId) ? body.clientId : null;
  const puzzles = Array.isArray(body?.puzzles) ? body.puzzles : null;
  if (!name) return json({ error: "bad_name" }, 400, origin);
  if (!DIFFS.includes(difficulty) || !COUNTS.includes(count)) return json({ error: "bad_params" }, 400, origin);
  if (!puzzles || puzzles.length !== count) return json({ error: "bad_puzzles" }, 400, origin);

  // --- (1) トークン検証 ---
  const payload = await verifyToken(String(body?.token || ""), HMAC_SECRET);
  if (!payload) return json({ error: "bad_token" }, 401, origin);
  if (payload.difficulty !== difficulty || payload.count !== count) return json({ error: "token_mismatch" }, 401, origin);

  // --- (2) bot 対策（Turnstile）---
  const ip = getIp(req);
  if (!(await verifyTurnstile(body?.turnstileToken, ip))) return json({ error: "captcha_failed" }, 403, origin);

  // --- (6) レート制限 ---
  const iph = ip ? await ipHash(ip, IP_SALT) : "";
  if (clientId) {
    if (await countSince("submit_log", "client_id", clientId, 5) >= 1) return json({ error: "too_fast" }, 429, origin);
    if (await countSince("submit_log", "client_id", clientId, 3600) >= 30) return json({ error: "rate_limited" }, 429, origin);
  }
  if (iph) {
    if (await countSince("submit_log", "ip_hash", iph, 5) >= 3) return json({ error: "too_fast" }, 429, origin);
    if (await countSince("submit_log", "ip_hash", iph, 3600) >= 100) return json({ error: "rate_limited" }, 429, origin);
  }

  // --- (1) リプレイ防止：トークンを使い捨て消費 ---
  if (!(await consumeNonce(payload.nonce))) return json({ error: "token_used" }, 409, origin);

  // --- (3) 出題・回答・一意性の検証 ---
  for (const p of puzzles) {
    if (!validatePuzzle(p)) return json({ error: "invalid_puzzle" }, 422, origin);
  }

  // --- (4) サーバ計測時間＋値域 ---
  const timeMs = Date.now() - Number(payload.iat || 0);
  if (!(timeMs >= count * MIN_MS_PER_Q) || !(timeMs <= count * MAX_MS_PER_Q)) {
    return json({ error: "time_out_of_range" }, 422, origin);
  }

  // --- 監査ログ ---
  await fetch(`${SUPABASE_URL}/rest/v1/submit_log`, {
    method: "POST", headers: pgHeaders({ Prefer: "return=minimal" }),
    body: JSON.stringify({ client_id: clientId, ip_hash: iph || null }),
  });

  // --- 書き込み（service_role）---
  const ins = await fetch(`${SUPABASE_URL}/rest/v1/scores`, {
    method: "POST", headers: pgHeaders({ Prefer: "return=minimal" }),
    body: JSON.stringify({ name, time_ms: timeMs, difficulty, count, client_id: clientId }),
  });
  if (!(ins.status === 201 || ins.status === 204)) {
    return json({ error: "insert_failed" }, 500, origin);
  }

  return json({ ok: true, timeMs }, 200, origin);
});
