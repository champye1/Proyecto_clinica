import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon.svg', 'icons/icon-192.svg'],
      manifest: {
        name: 'SurgicalHUB',
        short_name: 'SurgicalHUB',
        description: 'Sistema de gestión de pabellones quirúrgicos',
        theme_color: '#2563EB',
        background_color: '#f8fafc',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        lang: 'es',
        icons: [
          {
            src: '/icons/icon-192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
          {
            src: '/icons/icon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
        shortcuts: [
          {
            name: 'Mis Solicitudes',
            url: '/doctor/solicitudes',
            description: 'Ver mis solicitudes quirúrgicas',
          },
          {
            name: 'Calendario',
            url: '/pabellon/calendario',
            description: 'Ver calendario de pabellones',
          },
        ],
      },
      workbox: {
        // Cachea los assets estáticos (JS, CSS, fuentes)
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // No cachea las llamadas a Supabase (siempre fresh)
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/rest\//, /^\/auth\//, /^\/functions\//],
        runtimeCaching: [
          {
            // Cache de Google Fonts si se agregan en el futuro
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      // En desarrollo muestra el SW para poder testear
      devOptions: {
        enabled: false,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    exclude: ['xlsx'],
  },
})
