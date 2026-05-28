/**
 * GitHub Pages: sirve index.html en rutas desconocidas (SPA).
 */
import { copyFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const dist = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist')
const index = join(dist, 'index.html')
const notFound = join(dist, '404.html')

if (!existsSync(index)) {
  console.error('No existe dist/index.html — ejecuta vite build antes.')
  process.exit(1)
}

copyFileSync(index, notFound)
console.log('OK: dist/404.html (SPA fallback para GitHub Pages)')
