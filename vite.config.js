import { defineConfig } from 'vite'
import { createHtmlPlugin } from 'vite-plugin-html'
import legacy from '@vitejs/plugin-legacy'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    createHtmlPlugin({
      minify: true,
    }),
    legacy({
      targets: ['defaults', 'not IE 11'],
    }),
  ],
  
  root: './',
  publicDir: 'assets',
  
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        about: resolve(__dirname, 'pages/about.html'),
        capabilities: resolve(__dirname, 'pages/capabilities.html'),
        contact: resolve(__dirname, 'pages/contact.html'),
        demo: resolve(__dirname, 'pages/demo.html'),
        login: resolve(__dirname, 'pages/login.html'),
        solutions: resolve(__dirname, 'pages/solutions.html'),
        technology: resolve(__dirname, 'pages/technology.html'),
        useCases: resolve(__dirname, 'pages/use-cases.html'),
      },
    },
    sourcemap: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
  
  server: {
    port: 3000,
    open: true,
    cors: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  
  preview: {
    port: 4173,
  },
  
  optimizeDeps: {
    include: ['hardhat', 'toolkit'],
  },
  
  css: {
    devSourcemap: true,
  },
})
