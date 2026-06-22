# ba-student-decoder — シャーレ暗号解読 / SCHALE CIPHER

ブルーアーカイブの生徒名を題材にした **暗号解読パズル**（React / Vite 製）です。
数字の並び（暗号）と確定ヒントから「数字 ↔ カタカナ」の対応規則を見つけ、最終的な問いの生徒名を推理します。

Topページ → カウントダウン（3・2・1・START）→ ゲーム という流れで、解答スピードを端末内ランキングで競えます。

## 画面の流れ

1. **Topページ** … タイトル、遊び方、難易度選択（EASY / NORMAL / HARD）、ニックネーム入力、生徒名簿。
2. **カウントダウン** … 「ゲームスタート」後に 3 → 2 → 1 → START の演出。
3. **ゲーム** … 暗号の解読、対応表メモ、解答判定（正解で立ち絵＋紙吹雪）、ランキング表示。

## 遊び方

- 「確定情報」（例：`【123】＝カンナ`）から数字と文字の対応が分かります。
- 「傍受データ」の数字列はすべて実在の生徒名。照合して連鎖的に文字を特定します。
- 「問題」の数字列が誰かを推理し、カタカナで解答。答えは必ず1つに定まる設計です。
- 知らない生徒名は「生徒名簿」（140名・アイコン付き）で確認できます。

## ルール仕様

- 1つの数字にカタカナ1文字が1対1で対応（重複割り当て禁止）。
- 確定ヒントを最低1つ提示。問題は既出の数字のみで構成。
- **一意性ソルバ**で答えが一意に定まる問題だけを出題（曖昧問題を自動排除）。

例題：`【123】=カンナ`、`【453】/【653】/【715】` のとき `【765】` は？
→ `453`/`653` は セリナ・マリナ（5=リ, 3=ナ）、`715` は ヒカリ（7=ヒ）と分かり、
`765` は「ヒ◯リ」。6=マ なら **ヒマリ**（実在）、6=セ なら「ヒセリ」（不在）なので **ヒマリ** に一意確定。

## 開発・ビルド

ソースは `app/` 配下（Vite + React）。ビルド成果物（`index.html` + `assets/`）はリポジトリ直下に出力され、
`images/` や `data/` をそのまま相対参照します（GitHub Pages 対応）。

```bash
cd app
npm install
npm run dev      # 開発サーバ（http://localhost:5173）
npm run build    # 本番ビルド → リポジトリ直下に index.html / assets を出力
npm run preview  # ビルド結果をローカル配信して確認
```

> ⚠️ ビルド済み `index.html` は ES Modules を使うため、ファイルを直接ダブルクリック（file://）では動きません。
> `npm run preview` などの静的配信、または GitHub Pages 経由で開いてください。

## ディレクトリ構成

```
app/
  index.html              ... Vite エントリ（テンプレート）
  vite.config.js          ... base:'./', publicDir/outDir をリポジトリ直下向けに設定
  src/
    main.jsx              ... エントリポイント
    App.jsx               ... 画面遷移（top → countdown → playing）
    components/
      TopPage.jsx         ... Topページ
      Countdown.jsx       ... 3・2・1・START カウントダウン
      Game.jsx            ... ゲーム本体（暗号表示・メモ・判定・ランキング）
    engine.js            ... 暗号生成エンジン＋一意性ソルバ
    data.js              ... 生徒名(140) / 生徒名→ID / 画像パス
    ranking.js           ... localStorage ランキング（ログイン不要）
    confetti.js          ... 正解演出
    styles.css           ... スタイル

index.html, assets/        ... ビルド出力（リポジトリ直下）
data/jp/students.json      ... 生徒データ（名前リストの生成元）
images/student/...          ... 生徒画像（portrait / icon ほか）
docs/added-students.md      ... 追加生徒リスト（名字・ID・画像有無の管理表）
docs/added-students.csv     ... 同上（CSV）
scripts/fetch-images.sh     ... 追加生徒の画像をSchaleDBから取得するスクリプト
```

## 追加生徒と画像の取得

wikiru由来で追加した新規生徒（基準28名＋衣装違い42件）の一覧と画像取得状況は
`docs/added-students.md` を参照。基準生徒には名字（姓・ふりがな）も付与済み。
新規生徒の画像（icon / portrait）は未取得のため、以下で一括取得できます。

```bash
bash scripts/fetch-images.sh   # SchaleDB から images/student/{icon,portrait}/<ID>.webp を取得
cd app && npm run build        # 取得後に再ビルドでゲームに反映
```

## 立ち絵（wikiru）の取得

全キャラ **263件** の立ち絵を wikiru から取得できます。取得先一覧は
`images/student/wiki/manifest.tsv`（`<保存名>\t<URLパス>`）、内訳は `docs/tachie-manifest.csv` を参照。

```bash
bash scripts/fetch-tachie.sh   # wikiru から images/student/wiki/<キャラ名>.png|.jpg を取得
```

- 241件はメイン立ち絵（`<名前>.png`）。残り22件は wikiru の命名都合で
  `_立ち絵N` / `_圧縮` / `_攻撃型` / `メモリアルロビー` 等の代替画像を採用（種別は manifest 参照）。
- SchaleDB の icon/portrait とは別フォルダ（`images/student/wiki/`）で管理し、既存画像は変更しません。

## クレジット

- データ・画像出典：SchaleDB
- 本ゲームはファンメイドであり、株式会社Yostar・NEXON Games 非公認です。
