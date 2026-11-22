import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Native file events are missed in this folder on Windows (edits didn't reach the browser); poll instead.
    watch: { usePolling: true, interval: 300 },
    // The backend runs in `npx wrangler dev` (worker/index.ts); same-origin /api in dev as in production.
    proxy: { '/api': 'http://localhost:8787' },
  },
})
