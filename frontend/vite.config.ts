import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    host: '0.0.0.0',
    allowedHosts: true,
    hmr: {
      // En produccion detras de nginx, el WS debe ir por el mismo host/puerto publico
      clientPort: 80,
      host: 'localhost',
      protocol: 'ws',
    },
    proxy: {
      '/api': {
        target: 'http://backend:3000',
        changeOrigin: true,
      },
    },
  },
})














