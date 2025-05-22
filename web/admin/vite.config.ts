import react from '@vitejs/plugin-react'
import path from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    hmr: true,
    proxy: {
      "/api": "http://localhost:8000",
      "/share": "http://localhost:8000",
      "/static-file": "http://localhost:8000",
      // "/api": "http://localhost:2443",
      // "/share": "http://localhost:2443",
      // "/static-file": "http://localhost:2443",
    },
  },
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
})
