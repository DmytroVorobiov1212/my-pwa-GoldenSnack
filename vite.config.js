// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // ❌ не інʼєктимо реєстратор — реєструєш ти сам у хуку
      injectRegister: 'none',
      // ✅ використовуємо твій файл SW як джерело
      strategies: 'injectManifest',
      srcDir: 'public',
      filename: 'service-worker.js',
      // прибирає застарілі кеші Workbox (не завадить)
      workbox: {
        cleanupOutdatedCaches: true,
      },
      // ❌ не реєструвати SW у dev, щоб HMR не плодив фантомні апдейти
      devOptions: { enabled: false },

      // Маніфест (ок, що немає окремого webmanifest — плагін згенерує)
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
