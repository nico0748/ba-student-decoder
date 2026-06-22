#!/usr/bin/env bash
# 新規追加生徒（wikiru由来）のアイコン／立ち絵を SchaleDB から取得します。
# 既存リポジトリと同じ命名規則: images/student/{icon,portrait}/<ID>.webp
# 使い方:  bash scripts/fetch-images.sh
set -euo pipefail
cd "$(dirname "$0")/.."
ICON_DIR="images/student/icon"
POR_DIR="images/student/portrait"
mkdir -p "$ICON_DIR" "$POR_DIR"
BASE="https://schaledb.com/images/student"

IDS=(
  10103
  10104
  10105
  10106
  10107
  10108
  10109
  10110
  10111
  10112
  10113
  10114
  10115
  10116
  10117
  10118
  10119
  10120
  10121
  10122
  10123
  10124
  10125
  10126
  10127
  10128
  10129
  10130
  10131
  10132
  10133
  10134
  10135
  10136
  10137
  10138
  10139
  10140
  10141
  10142
  13014
  16016
  16017
  16018
  16019
  16020
  20038
  20039
  20040
  20041
  20042
  20043
  20044
  20045
  20046
  20047
  20048
  20049
  20050
  20051
  20052
  20053
  20054
  20055
  20056
  20057
  20058
  20059
  26014
  26015
)

ok_i=0; ok_p=0; fail=0
for id in "${IDS[@]}"; do
  if [ ! -f "$ICON_DIR/$id.webp" ]; then
    if curl -fsSL "$BASE/icon/$id.webp" -o "$ICON_DIR/$id.webp"; then ok_i=$((ok_i+1)); else echo "icon NG: $id"; fail=$((fail+1)); rm -f "$ICON_DIR/$id.webp"; fi
  fi
  if [ ! -f "$POR_DIR/$id.webp" ]; then
    if curl -fsSL "$BASE/portrait/$id.webp" -o "$POR_DIR/$id.webp"; then ok_p=$((ok_p+1)); else echo "portrait NG: $id"; rm -f "$POR_DIR/$id.webp"; fi
  fi
done
echo "done. icons:$ok_i portraits:$ok_p fail:$fail"
echo "次に: cd app && npm run build で再ビルドするとゲームに反映されます。"
