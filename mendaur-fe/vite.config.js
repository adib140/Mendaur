import { fileURLToPath } from 'url'
import path from 'path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig({
  base: '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'robots.txt', 'offline.html'],
      // Force immediate update of service worker
      devOptions: {
        enabled: false // Disable SW in dev mode
      },
      manifest: {
        name: 'Mendaur - Kelola Sampah',
        short_name: 'Mendaur',
        description: 'Aplikasi pengelolaan sampah dan daur ulang',
        theme_color: '#16a34a',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        // Skip waiting to immediately activate new service worker
        skipWaiting: true,
        clientsClaim: true,
        // Clean old caches
        cleanupOutdatedCaches: true,
        // Navigasi fallback - untuk SPA routing
        navigateFallback: '/index.html',
        // Jangan fallback untuk API calls dan static files
        navigateFallbackDenylist: [/^\/api\//],
        // Precache important pages
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // Cache strategies for different resource types
        runtimeCaching: [
          {
            // Cache API responses - gunakan StaleWhileRevalidate untuk offline support
            urlPattern: /^https:\/\/mendaur\.up\.railway\.app\/api\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours untuk offline
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // Cache untuk sedulurmendaur API juga
            urlPattern: /^https:\/\/sedulurmendaur.*\.up\.railway\.app\/api\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'api-cache-alt',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // Cache images with cache-first strategy
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          },
          {
            // Cache Cloudinary images
            urlPattern: /^https:\/\/res\.cloudinary\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'cloudinary-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          },
          {
            // Cache static assets - StaleWhileRevalidate untuk offline support
            urlPattern: /\.(?:js|css|woff2?)$/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'static-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
              }
            }
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Dev server configuration
  server: {
    port: 5173,
    strictPort: true, // Fail if port is already in use
  },
  build: {
    // Target Safari 14+ dan iOS 14+ untuk kompatibilitas lebih baik
    target: ['es2020', 'safari14', 'ios14'],
    // Code splitting for better load times
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunk for React
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Vendor chunk for UI libraries
          'vendor-ui': ['lucide-react'],
          // Vendor chunk for PDF/export
          'vendor-export': ['jspdf', 'jspdf-autotable', 'xlsx', 'file-saver']
        }
      }
    },
    // Optimize chunk size
    chunkSizeWarningLimit: 500
  }
})