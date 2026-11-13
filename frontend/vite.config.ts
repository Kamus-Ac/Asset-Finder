import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react()],
  server: {
    proxy: {
      '/api': {
        target: process.env.ASSET_FINDER_API_TARGET || 'http://127.0.0.1:8000',
        changeOrigin: false,
        rewrite: path => path.replace(/^\/api/, ''),
      },
    },
  },
})
