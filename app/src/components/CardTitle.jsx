import React from "react";
import Icon from "./Icon.jsx";

// カード見出し：左端のブロックをセクション別ピクトグラム（アイコンタイル）に置換
export default function CardTitle({ icon, children }) {
  return (
    <h2>
      <span className="titleicon"><Icon name={icon} /></span>
      {children}
    </h2>
  );
}
