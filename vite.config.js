import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Forward /api requests to local backend
      '/api': {
        target: 'https://backend-node-5ylk.onrender.com',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})