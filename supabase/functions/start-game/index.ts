// POST /functions/v1/start-game  { difficulty, count } -> { token, iat }
// ゲーム開始時にサーバが HMAC 署名トークンを発行。submit-score はこのトークンの
// 発行時刻(iat)から経過時間をサーバ側で計測するため、クライアントは所要時間を詐称できない。
import { json, corsHeaders, signToken, DIFFS, COUNTS, getIp } from "../_shared/util.ts";

const MAX_MS_PER_Q = 10 * 60 * 1000; // 1問あたり上限10分

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(origin) });
  if (req.method !== "POST") return json({ error: "method" }, 405, origin);

  const secret = Deno.env.get("GAME_HMAC_SECRET");
  if (!secret) return json({ error: "server_misconfigured" }, 500, origin);

  let body: any;
  try { body = await req.json(); } catch { return json({ error: "bad_json" }, 400, origin); }

  const difficulty = String(body?.difficulty || "");
  const count = Number(body?.count);
  if (!DIFFS.includes(difficulty) || !COUNTS.includes(count)) return json({ error: "bad_params" }, 400, origin);

  const iat = Date.now();
  const exp = iat + count * MAX_MS_PER_Q + 60_000;
  const nonce = crypto.randomUUID();
  const token = await signToken({ nonce, iat, exp, difficulty, count }, secret);

  // ip は記録しない（開始時点では不要）。レート制限は submit 側で実施。
  void getIp(req);
  return json({ token, iat }, 200, origin);
});
