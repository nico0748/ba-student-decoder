import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// PWA: Service Worker 登録（base 相対。GitHub Pages のサブパスでも動作）
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    const swUrl = (import.meta.env.BASE_URL || "./") + "sw.js";
    navigator.serviceWorker.register(swUrl).catch(() => { /* 登録失敗時は通常のWebとして動作 */ });
  });
}
