import preact from "@preact/preset-vite"
import { defineConfig } from "vite"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [preact()],
  server: {
    host: true,
    port: 3000,
    strictPort: true,
  },
  // needed for GitHub Pages
  base: "/taylor-swift-bracelet-decoder/",
})
