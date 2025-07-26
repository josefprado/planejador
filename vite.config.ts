// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isTestMode = mode === 'test';

  return {
    plugins: [
      react(),
      !isTestMode && VitePWA({ 
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'masked-icon.svg', 'fonts/*.woff2', 'logo.png'],
        manifest: {
          name: 'Planejador de Viagens: Lá em Orlando',
          short_name: 'Lá em Orlando',
          description: 'O planejador de viagens completo para sua aventura. Crie um contador regressivo, organize seu roteiro dia a dia, use checklists inteligentes, salve documentos e compartilhe o planejamento com amigos.',
          theme_color: '#ffffff',
          icons: [
            {
              src: 'favicon.ico',
              sizes: '64x64 32x32 24x24 16x16',
              type: 'image/x-icon'
            },
            {
              src: 'masked-icon.svg',
              sizes: '192x192',
              type: 'image/svg+xml'
            },
            {
              src: 'masked-icon.svg',
              sizes: '512x512',
              type: 'image/svg+xml'
            },
            {
              src: 'masked-icon.svg',
              type: 'image/svg+xml',
              purpose: 'any maskable'
            }
          ]
        }
      }), 
    ].filter(Boolean),
    build: {
      minify: mode === 'test' ? false : true,
      rollupOptions: {
        input: {
          main: resolve('index.html'),
          admin: resolve('admin.html'),
        },
      },
    },
  }
})