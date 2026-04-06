import react from '@vitejs/plugin-react'
import path from 'path'
import { loadEnv } from 'vite'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, '')
  const apiProxyTarget = env.VITE_API_PROXY_TARGET || 'http://localhost:8000'

  return {
    plugins: [
      react()
    ],
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts',
      css: true,
      restoreMocks: true,
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'ui-vendor': [
              '@radix-ui/react-dialog',
              '@radix-ui/react-dropdown-menu',
              '@radix-ui/react-label',
              '@radix-ui/react-scroll-area',
              '@radix-ui/react-select',
              '@radix-ui/react-separator',
              '@radix-ui/react-slot',
              '@radix-ui/react-tabs',
              '@radix-ui/react-tooltip',
              'lucide-react',
            ],
            'data-vendor': [
              '@hookform/resolvers',
              'axios',
              'date-fns',
              'react-hook-form',
              'zod',
              'zustand',
            ],
          },
        },
      },
    },
    server: {
      host: '0.0.0.0',
      port: 5173,
      proxy: {
        '/api': {
          target: apiProxyTarget,
          changeOrigin: true,
        },
        '/docs': {
          target: apiProxyTarget,
          changeOrigin: true,
        },
        '/redoc': {
          target: apiProxyTarget,
          changeOrigin: true,
        },
        '/openapi.json': {
          target: apiProxyTarget,
          changeOrigin: true,
        },
      }
    }
  }
})
