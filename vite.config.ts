import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // GitHub Pages serves the site from /<repo>/ — set via BASE_PATH in the deploy script
  base: process.env.BASE_PATH ?? '/',
  plugins: [react(), tailwindcss()],
  build: {
    target: 'es2022',
    // three.js lives in the lazily imported SculptureScene chunk (only fetched near the sculpture section)
    chunkSizeWarningLimit: 1000,
  },
})
