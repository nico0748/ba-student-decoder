import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// 開発時は app/ をルートに、images/ などはリポジトリ直下を publicDir として配信。
// ビルド時はリポジトリ直下へ index.html + assets/ を出力（images/ data/ を維持するため
// emptyOutDir:false、巨大な画像群を二重コピーしないよう copyPublicDir:false）。
export default defineConfig({
  base: "./",
  plugins: [react()],
  publicDir: resolve(__dirname, ".."),
  build: {
    outDir: resolve(__dirname, ".."),
    emptyOutDir: false,
    copyPublicDir: false,
  },
});
