import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // This tells Vite: "Any request starting with /api, forward it to my Render backend"
      '/api': {
        target: 'https://emsbackend-2w9c.onrender.com',
        changeOrigin: true,
        secure: true, // set to true if using https
      }
    }
  }
})