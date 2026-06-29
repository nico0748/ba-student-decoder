// Google Analytics 4（gtag.js）。Firebase が作成・連携した GA4 プロパティの
// 「測定ID（G-XXXXXXXXXX）」に接続してアクセス数などを計測する。
// 環境変数 VITE_GA_MEASUREMENT_ID が未設定なら何もしない（計測オフ）。
const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

export const analyticsEnabled = !!GA_ID;

export function initAnalytics() {
  if (!GA_ID || window.__gaInit) return;
  window.__gaInit = true;
  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag("js", new Date());
  gtag("config", GA_ID); // 初期化時に page_view を自動送信（アクセス数の基本計測）
}

// 任意のカスタムイベント送信
export function track(name, params) {
  if (!GA_ID || !window.gtag) return;
  try { window.gtag("event", name, params || {}); } catch { /* noop */ }
}
