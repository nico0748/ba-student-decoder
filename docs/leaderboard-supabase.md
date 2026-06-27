# 共有ランキング（Supabase）セットアップ手順

端末内ローカルから、ネット越しの共有ランキングへ切り替える手順です。
未設定のままでも、アプリは従来どおり端末内ランキングで動作します（環境変数を入れた時だけ有効化）。

## 構成

- フロント：既存の静的ビルド（GitHub Pages 等）
- API：Supabase Edge Functions（`start-game` / `submit-score`）
- DB：Supabase Postgres（`scores` ほか）＋ RLS
- bot対策：Cloudflare Turnstile（任意）

```
supabase/
  schema.sql                       … テーブル / RLS / ランキング関数
  functions/
    _shared/engine.ts              … 出題検証エンジン（data.js の NAMES と同期）
    _shared/util.ts                … CORS / HMAC / Turnstile / レート制限補助
    start-game/index.ts            … 開始トークン(HMAC)発行
    submit-score/index.ts          … 検証＋サーバ計測＋書き込み
app/src/leaderboard.js             … フロントのクライアント
app/.env.example                   … フロント用の公開環境変数の見本
```

## 1. プロジェクト作成 & DB

1. supabase.com でプロジェクトを作成。
2. SQL Editor で `supabase/schema.sql` を実行（テーブル・RLS・`get_leaderboard` 等）。

## 2. Edge Functions のデプロイ

Supabase CLI を使います（`npm i -g supabase`、`supabase login`、`supabase link --project-ref <ref>`）。

```bash
# 関数のシークレット（フロントには出ません）
supabase secrets set GAME_HMAC_SECRET="$(openssl rand -hex 32)"
supabase secrets set IP_HASH_SALT="$(openssl rand -hex 16)"
supabase secrets set ALLOWED_ORIGINS="https://<your-pages-origin>"   # 例: https://nico0748.github.io
supabase secrets set TURNSTILE_SECRET="<Turnstileのsecret>"          # 任意（未設定ならbot対策スキップ）
# SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY は Supabase が自動注入するので設定不要

supabase functions deploy start-game
supabase functions deploy submit-score
```

> anon key は JWT なので、関数の `verify_jwt`（既定ON）でもフロントからの呼び出しは通ります。
> 通らない場合は `--no-verify-jwt` を付けてデプロイしてください（apikey ヘッダで認可）。

## 3. フロントの環境変数

`app/.env`（`.env.example` をコピー）に**公開してよい値のみ**設定し、ビルドします。

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=<anon public key>
VITE_TURNSTILE_SITEKEY=<Turnstile site key>   # 任意
```

```bash
cd app && npm run build   # 値が埋め込まれ、共有ランキングが有効化される
```

設定が無い場合、ビルド時に remote コードは除去され、端末内ランキングのみで動作します。

## 不正対策（実装済み）

スコアはクライアント発なので完全防止は不可能ですが、要望の対策を実装しています。

- **値域チェック**：`time_ms` の下限/上限（1問あたり 600ms〜10分）、`name` 長（1〜12）、`difficulty`/`count` のホワイトリスト。DB の CHECK 制約でも二重に担保。
- **レート制限**：`client_id`（端末UUID）と IPハッシュ単位。直近5秒・1時間の送信数で制限（`submit_log`）。生IPは保存せずソルト付きハッシュのみ。
- **bot対策**：Cloudflare Turnstile を `submit-score` で検証（secret 未設定なら開発用にスキップ）。
- **出題内容/回答/一意性のサーバ検証**：送られた各問の確定情報・傍受データ・問題・回答を `engine.ts` の一意性ソルバで再検証。実在生徒名・整合・一意・正解一致を満たさなければ拒否。
- **ゲーム開始トークン（サーバ発行）＋HMAC署名**：`start-game` が nonce・発行時刻(iat)・有効期限を HMAC 署名。`submit-score` が署名と期限を検証し、**所要時間は iat→現在時刻でサーバ計測**（クライアント申告は不採用）。
- **リプレイ防止**：トークンの nonce は `used_tokens` で1回だけ消費。

### 残存リスク（より厳密にする場合）

出題はクライアント生成のため、スクリプトで「開始→自動求解→即送信」すると下限(600ms/問)付近の好タイムを作れる余地があります。完全に防ぐには **サーバ側で出題を生成・署名して配布**し、クライアントはそれを解くだけにする設計が必要です（実装コスト増）。カジュアル用途では現状の対策で十分なことが多いです。

## メンテ時の注意

- 生徒を追加して `data.js` の `NAMES` を更新したら、`supabase/functions/_shared/engine.ts` の `NAMES` も同じ内容に更新し、`submit-score` を再デプロイしてください（出題検証の整合のため）。
