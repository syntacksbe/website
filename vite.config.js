import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

// The site is served from https://syntacksbe.github.io/website/.
// Change base to '/' once a custom domain is connected.
export default defineConfig({
  base: '/website/',
  plugins: [react()],
  // Two pages: the site itself and the Arcade (a catalog of Salesforce games) at /website/arcade/.
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        arcade: resolve(import.meta.dirname, 'arcade/index.html'),
      },
    },
  },
})
