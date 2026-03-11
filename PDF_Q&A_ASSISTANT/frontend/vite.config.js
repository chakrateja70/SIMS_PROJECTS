import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/upload': { target: 'http://localhost:8000', changeOrigin: true },
      '/query': { target: 'http://localhost:8000', changeOrigin: true },
      '/summarize': { target: 'http://localhost:8000', changeOrigin: true },
      '/knowledge-base': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        bypass: (req) => {
          // Let browser navigation (HTML requests) fall through to index.html
          if (req.headers.accept?.includes('text/html')) return '/index.html'
        },
      },
    },
  },
})
