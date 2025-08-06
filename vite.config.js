import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',   // автооновлення service worker
      manifest: {
        name: 'Mini PWA Table',
        short_name: 'MiniTable',
        description: 'Таблиця виробів з пошуком',
        theme_color: '#000000',
        background_color: '#121212',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        runtimeCaching: [
          {
            // Кешуємо всі HTML/JS/CSS/зображення
            urlPattern: ({ request }) =>
              ['document', 'script', 'style', 'image', 'font'].includes(request.destination),
            handler: 'CacheFirst',
            options: {
              cacheName: 'app-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 днів
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: true // дозволяє тестувати PWA у dev-режимі
      }
    })
  ],
  build: {
    sourcemap: true,
  }
});
