import fs from "node:fs";
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// `vite preview` serves the same security headers as production
// (vercel.json), so a CSP change can be checked locally before deploying.
const productionHeaders = Object.fromEntries(
  (JSON.parse(fs.readFileSync(new URL("./vercel.json", import.meta.url), "utf8")).headers.find((h) => h.source === "/(.*)")?.headers || [])
    .filter((h) => h.key !== "Strict-Transport-Security")
    .map((h) => [h.key, h.key === "Content-Security-Policy" ? h.value.replace("; upgrade-insecure-requests", "").replace("connect-src 'self'", "connect-src 'self' ws://localhost:*") : h.value]),
);

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  preview: {
    headers: productionHeaders,
  },
})
