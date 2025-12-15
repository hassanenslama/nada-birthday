import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  // Only use base path for production (GitHub Pages), not dev
  base: mode === 'production' ? '/nada-birthday/' : '/',
}))
