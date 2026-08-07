// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from "vite-plugin-pwa";

const BUILD_ID = process.env.VERCEL_GIT_COMMIT_SHA || new Date().toISOString();

export default defineConfig({
  define: {
    __BUILD_ID__: JSON.stringify(BUILD_ID),
  },
  plugins: [
    react(),
    VitePWA({
      injectRegister: 'none',
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      workbox: { cleanupOutdatedCaches: true },
      devOptions: { enabled: false },

      manifest: {
        name: 'Golden Snack – Výroba',
        short_name: 'GS Výroba',
        description: 'Výrobní terminál Golden Snack',
        lang: 'cs',
        theme_color: '#0f1115',
        background_color: '#0f1115',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
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
