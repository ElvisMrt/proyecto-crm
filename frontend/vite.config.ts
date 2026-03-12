import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    host: '0.0.0.0',
    allowedHosts: true,
    https: false, // Forzar HTTP
    hmr: false, // Desactivar HMR temporalmente
    proxy: {
      '/api': {
        target: 'http://localhost:3001', // Backend local
        changeOrigin: true,
        secure: false,
      },
    },
  },
})














