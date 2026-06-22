#!/usr/bin/env bash
# 全キャラの立ち絵を wikiru から取得します。
# 取得先一覧: images/student/wiki/manifest.tsv （<保存名>\t<URLパス>）
# 保存先: images/student/wiki/<キャラ名>.png|.jpg
# 使い方:  bash scripts/fetch-tachie.sh
set -uo pipefail
cd "$(dirname "$0")/.."
DIR="images/student/wiki"
HOST="https://bluearchive.wikiru.jp"
mkdir -p "$DIR"

ok=0; skip=0; fail=0
while IFS=$'\t' read -r save url; do
  [ -z "${save:-}" ] && continue
  out="$DIR/$save"
  if [ -f "$out" ]; then skip=$((skip+1)); continue; fi
  if curl -fsSL --retry 2 -A "Mozilla/5.0" "$HOST$url" -o "$out"; then
    ok=$((ok+1))
  else
    echo "NG: $save  ($url)"; rm -f "$out"; fail=$((fail+1))
  fi
done < "$DIR/manifest.tsv"
echo "done. 取得:$ok 既存スキップ:$skip 失敗:$fail"
echo "保存先: $DIR/"
