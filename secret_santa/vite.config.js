import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'My PWA App',
        short_name: 'PWAApp',
        description: 'A cool PWA built with Vite + React',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/logo.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/logo.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
  server: {
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        try {
          decodeURI(req.url)
        } catch (e) {
          console.warn('[Malformed URI] Skipping bad request URL:', req.url)
          // Don't block the request, just log and continue
        }
        next()
      })
    },
  },
})
