import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Native file events are missed in this folder on Windows (edits didn't reach the browser); poll instead.
    watch: { usePolling: true, interval: 300 },
  },
})
