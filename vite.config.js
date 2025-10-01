// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      injectRegister: 'none',          // реєструємо самі
      strategies: 'injectManifest',    // інжектимо у наш src/sw.js
      srcDir: 'src',
      filename: 'sw.js',               // вихідний файл у корені dist -> /sw.js
      workbox: { cleanupOutdatedCaches: true },
      devOptions: { enabled: false },  // не реєструвати SW у dev

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
    })
  ],
  build: { sourcemap: true }
});
