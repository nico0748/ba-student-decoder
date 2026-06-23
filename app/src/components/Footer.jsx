import React from "react";
import { NAMES } from "../data.js";

// 簡素なテキストフッター（出典・免責）
export default function Footer() {
  return (
    <footer className="footer">
      <p>本サイトは非公式のファン制作ゲームです。株式会社Yostar／NEXON Games をはじめとする『ブルーアーカイブ』の権利者・運営とは一切関係ありません。</p>
      <p>『ブルーアーカイブ』の二次創作ガイドラインの範囲内での利用を意図しており、公式から許諾・後援・提携を受けたものではありません。生徒名・キャラクター等の著作権は原権利者に帰属します。問題がある場合は速やかに対応・公開を停止します。</p>
      <p className="footer-src">
        データ出典：<a href="https://schaledb.com/" target="_blank" rel="noopener noreferrer">SchaleDB</a> ／ 収録 {NAMES.length} 名
      </p>
    </footer>
  );
}
