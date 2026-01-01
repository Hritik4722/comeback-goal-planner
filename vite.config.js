import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Comeback Goal Planner',
        short_name: 'Goal Planner',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#8B4557',
        icons: [
          {
            src: '/icon-256.png',
            sizes: '256x256',
            type: 'image/png'
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
})

