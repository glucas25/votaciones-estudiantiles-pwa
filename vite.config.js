import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
    'process.env': {}
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    commonjsOptions: {
      include: [/pouchdb/, /node_modules/]
    }
  },
  optimizeDeps: {
    include: ['pouchdb', 'pouchdb-find', 'pouchdb-adapter-idb'],
    force: true,
    esbuildOptions: {
      target: 'es2020'
    }
  },
  resolve: {
    alias: {
      'pouchdb': 'pouchdb/dist/pouchdb.js'
    }
  }
})
