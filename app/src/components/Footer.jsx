import React from "react";

// データ・画像の出典と免責（トップ／ゲーム両画面で共通使用）
export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-row">
        <span className="footer-key">データ出典</span>
        <span>
          <a href="https://schaledb.com/" target="_blank" rel="noopener noreferrer">SchaleDB</a>（生徒名・プロフィール）
        </span>
      </div>
      <div className="footer-row">
        <span className="footer-key">画像出典</span>
        <span>
          <a href="https://schaledb.com/" target="_blank" rel="noopener noreferrer">SchaleDB</a>（アイコン・立ち絵）
        </span>
      </div>
      <p className="footer-note">
        本ゲームはブルーアーカイブのファンによる二次創作（非公式・非公認）であり、株式会社Yostar・NEXON Games および運営とは一切関係がありません。
        「ブルーアーカイブ」および生徒名・キャラクター・画像等の権利はすべて権利者に帰属します。
        二次創作ガイドラインの範囲内での利用を意図しており、権利者からの要請があれば速やかに対応します。
      </p>
    </footer>
  );
}
