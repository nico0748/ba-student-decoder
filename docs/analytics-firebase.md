# アクセス計測（Firebase Analytics / Google Analytics 4）

「Firebase Analytics」は実体が **Google Analytics 4（GA4）** です。Firebaseプロジェクトを作ると
GA4プロパティが連携され、**測定ID `G-XXXXXXXXXX`** が発行されます。本アプリはこの測定IDに
`gtag.js` で接続してアクセス数（page_view）などを計測します（Firebase SDK は不要・軽量）。

## 1. Firebase / GA4 を用意
1. https://console.firebase.google.com で「プロジェクトを追加」。途中の
   **「このプロジェクトで Google アナリティクスを有効にする」を ON**（GA4が紐づく）。
2. プロジェクト → 「ウェブアプリを追加（</>）」でウェブアプリを登録。
3. 表示される `firebaseConfig` の中、または
   「プロジェクトの設定 → 全般 → マイアプリ」の **measurementId（`G-XXXXXXXXXX`）** を控える。
   - すでにGA4だけ使う場合は、GA4管理画面「管理 → データストリーム → ウェブ」でも測定IDを確認できます。

## 2. 環境変数を設定（Vercel）
- Vercel → プロジェクト → Settings → Environment Variables（Production/Preview）に追加：
  - `VITE_GA_MEASUREMENT_ID` = `G-XXXXXXXXXX`
- 追加後 **Redeploy**（`VITE_*` はビルド時に埋め込み）。
- ローカルで試すなら `app/.env` に同じ値を入れて `npm run build`。

未設定なら計測は完全オフ（コードは何もしません）。

## 3. 計測内容
- **page_view（アクセス数）**：初期化時に自動送信。GA4の「リアルタイム」「レポート」で確認。
- **カスタムイベント**：
  - `game_start`（パラメータ：difficulty, count）
  - `game_clear`（difficulty, count, time_ms）
  - 追加したい場合は `import { track } from "./analytics.js"; track("event_name", {...})`。

## 4. 動作確認
1. デプロイ後にサイトを開く。
2. GA4 →「リアルタイム」に自分のアクセスが出れば接続OK。
3. DevTools「Network」で `https://www.googletagmanager.com/gtag/js?id=G-...` の読み込み、
   `google-analytics.com/g/collect` への送信が見えれば送れています。
   （広告ブロッカーが有効だと送信がブロックされる点に注意）

## メモ
- 測定ID（`G-...`）や Firebaseのウェブ設定値は**公開前提**の値です（フロントに入れてOK）。
  秘密鍵ではありません。
- Cookie同意バナーを将来出す場合は、同意が取れるまで `initAnalytics()` を遅延させる実装に
  変更してください（現状は即時計測）。
