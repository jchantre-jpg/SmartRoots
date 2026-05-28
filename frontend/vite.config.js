/**
 * Configuración de Vite para el frontend SmartRoots.
 * Proxy ``/api`` → Flask en 127.0.0.1:5000 durante ``npm run dev``.
 */
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

function resolveBase(mode) {
  if (mode === 'mobile') return './'
  if (process.env.VITE_BASE) {
    const b = process.env.VITE_BASE.trim()
    return b.endsWith('/') ? b : `${b}/`
  }
  return '/'
}

export default defineConfig(({ mode }) => ({
  base: resolveBase(mode),
  plugins: [tailwindcss(), react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    host: true,
    port: 5173,
    strictPort: false,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
    },
  },
}))
