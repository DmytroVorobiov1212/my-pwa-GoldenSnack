import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        // важливо: щоб новий SW одразу керував сторінкою
        clientsClaim: true,
        skipWaiting: true,
        cleanupOutdatedCaches: true,

        // для SPA краще вказати fallback
        navigateFallback: '/index.html',

        runtimeCaching: [
          {
            // HTML: завжди пробуємо мережу спочатку, а кеш — як бекап
            urlPattern: ({ request }) => request.destination === 'document',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'html-cache',
              networkTimeoutSeconds: 3, // щоб швидко впасти на кеш при офлайні
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 }
            }
          },
          {
            // JS/CSS: швидко показати, але фоном підтягнути свіжу версію
            urlPattern: ({ request }) => ['script', 'style'].includes(request.destination),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'assets-cache',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 }
            }
          },
          {
            // Зображення/шрифти: CacheFirst ок
            urlPattern: ({ request }) => ['image', 'font'].includes(request.destination),
            handler: 'CacheFirst',
            options: {
              cacheName: 'static-cache',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 }
            }
          }
        ]
      },
      manifest: {
        name: 'Mini PWA Table',
        short_name: 'MiniTable',
        description: 'Таблиця виробів з пошуком',
        theme_color: '#000000',
        background_color: '#121212',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512x512.png', sizes: '512x512', type: 'image/png' }
        ]
      },
      includeAssets: ['icons/icon-192x192.png', 'icons/icon-512x512.png'],
      devOptions: { enabled: true }
    })
  ],
  build: { sourcemap: true }
});
