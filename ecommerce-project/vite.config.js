import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  root: 'src',
  publicDir: '../public',
  plugins: [react()],
  build: {
    outDir: '../ecommerce-backend/dist',
    emptyOutDir: true,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './test/setup.js',
    css: true,
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/images': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
