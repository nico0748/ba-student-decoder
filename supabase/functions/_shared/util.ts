// CORS / HMAC / 値域チェックなどの共通ユーティリティ

// 許可オリジン（カンマ区切り）を環境変数 ALLOWED_ORIGINS で設定。未設定なら "*"。
const ALLOWED = (Deno.env.get("ALLOWED_ORIGINS") || "*").split(",").map((s) => s.trim());

export function corsHeaders(origin: string | null): Record<string, string> {
  const allow = ALLOWED.includes("*") ? "*" : (origin && ALLOWED.includes(origin) ? origin : ALLOWED[0] || "*");
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Vary": "Origin",
  };
}

export function json(body: unknown, status: number, origin: string | null) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
  });
}

const enc = new TextEncoder();
const b64u = (buf: ArrayBuffer) =>
  btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

async function hmacKey(secret: string) {
  return await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

// payload(JSON) を HMAC 署名して "base64url(payload).base64url(sig)" のトークンを発行
export async function signToken(payload: object, secret: string): Promise<string> {
  const body = b64u(enc.encode(JSON.stringify(payload)).buffer);
  const key = await hmacKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(body));
  return `${body}.${b64u(sig)}`;
}

// トークン検証（署名一致＋有効期限）。OKなら payload を返す。
export async function verifyToken(token: string, secret: string): Promise<any | null> {
  try {
    const [body, sig] = token.split(".");
    if (!body || !sig) return null;
    const key = await hmacKey(secret);
    const expected = await crypto.subtle.sign("HMAC", key, enc.encode(body));
    if (b64u(expected) !== sig) return null;
    const payload = JSON.parse(atob(body.replace(/-/g, "+").replace(/_/g, "/")));
    if (!payload.exp || Date.now() > payload.exp) return null; // 期限切れ
    return payload;
  } catch {
    return null;
  }
}

// IPの簡易ハッシュ（生IPを保存しないため）
export async function ipHash(ip: string, salt: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", enc.encode(salt + "|" + ip));
  return b64u(buf).slice(0, 22);
}

// Cloudflare Turnstile 検証（フロントの site key とペアの secret を TURNSTILE_SECRET に設定）
export async function verifyTurnstile(token: string | undefined, ip: string): Promise<boolean> {
  const secret = Deno.env.get("TURNSTILE_SECRET");
  if (!secret) return true; // 未設定なら bot対策スキップ（開発用）。本番は必ず設定推奨。
  if (!token) return false;
  const form = new URLSearchParams();
  form.set("secret", secret);
  form.set("response", token);
  if (ip) form.set("remoteip", ip);
  const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: form });
  const d = await r.json().catch(() => ({}));
  return !!d.success;
}

export const DIFFS = ["easy", "normal", "hard"];
export const COUNTS = [1, 5, 10];

// 名前のサニタイズ：トリム・連続空白圧縮・12文字・制御文字除外
export function clampName(name: unknown): string | null {
  if (typeof name !== "string") return null;
  const n = name.trim().replace(/\s+/g, " ").slice(0, 12);
  if (n.length < 1) return null;
  if (/[\u0000-\u001f\u007f]/.test(n)) return null;
  return n;
}

export function getIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for") || "";
  return (xff.split(",")[0] || req.headers.get("x-real-ip") || "").trim();
}
