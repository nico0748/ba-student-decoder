import React from "react";

// 見出し用の軽量SVGピクトグラム（24x24・stroke=currentColor）
const PATHS = {
  user: <><circle cx="12" cy="8" r="3.4" /><path d="M5.5 19c.6-3.4 3.3-5 6.5-5s5.9 1.6 6.5 5" /></>,
  gauge: <><path d="M4 15a8 8 0 0 1 16 0" /><path d="M12 15l3.5-3.2" /><circle cx="12" cy="15" r="1" /></>,
  list: <><path d="M9 7h10M9 12h10M9 17h10" /><circle cx="5" cy="7" r="1" /><circle cx="5" cy="12" r="1" /><circle cx="5" cy="17" r="1" /></>,
  idcard: <><rect x="3.5" y="5.5" width="17" height="13" rx="2.5" /><circle cx="8.5" cy="11" r="2" /><path d="M5.8 16c.4-1.4 1.5-2.2 2.7-2.2s2.3.8 2.7 2.2" /><path d="M14 10h4M14 13.5h4" /></>,
  sparkle: <><path d="M12 3.5l1.7 4.8 4.8 1.7-4.8 1.7L12 16.5l-1.7-4.8L5.5 10l4.8-1.7z" /><path d="M18.5 15.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z" /></>,
  chart: <><path d="M5 19V11M12 19V5M19 19v-6" /></>,
  trophy: <><path d="M8 4h8v4a4 4 0 0 1-8 0V4z" /><path d="M8 5H5v1.5A2.5 2.5 0 0 0 7.5 9H8M16 5h3v1.5A2.5 2.5 0 0 1 16.5 9H16" /><path d="M10 12.5h4M12 12.5V16M9.5 19.5h5M10.5 16h3" /></>,
  book: <><path d="M12 6.5C10.5 5.3 8.5 5 4.5 5v12c4 0 6 .3 7.5 1.5C13.5 17.3 15.5 17 19.5 17V5c-4 0-6 .3-7.5 1.5z" /><path d="M12 6.5V18.5" /></>,
  signal: <><circle cx="12" cy="16" r="1.4" /><path d="M8.5 13a5 5 0 0 1 7 0M6 10.2a9 9 0 0 1 12 0" /></>,
  table: <><rect x="4" y="5" width="16" height="14" rx="2" /><path d="M4 10h16M4 14.5h16M9.5 10v9M14.5 10v9" /></>,
  pencil: <><path d="M14.5 5.5l4 4L9 19l-4.5 1 1-4.5z" /><path d="M13 7l4 4" /></>,
  check: <><path d="M5 12.5l4.5 4.5L19 7" /></>,
  home: <><path d="M4 11.5L12 5l8 6.5" /><path d="M6 10.5V19h12v-8.5" /><path d="M10 19v-4.5h4V19" /></>,
  play: <><path d="M8 5.5l11 6.5-11 6.5z" /></>,
};

export default function Icon({ name, size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {PATHS[name] || PATHS.list}
    </svg>
  );
}
