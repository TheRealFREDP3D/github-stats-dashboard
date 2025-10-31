import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Increase chunk size warning limit to 1MB (current bundle is 910KB)
    chunkSizeWarningLimit: 1000,
    
    // Enable code splitting and chunking
    rollupOptions: {
      output: {
        // Instead of hard-coding every `@radix-ui/react-*` package (and the other lists) in manualChunks,
        // use a regex-based function to auto-group by folder. This keeps the same splits but is far more maintainable:
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          // Radix UI: any @radix-ui/react-*
          if (/node_modules\/@radix-ui\/react-[^/]+/.test(id)) {
            return 'radix-ui'
          }
          // React vendor
          if (/node_modules\/(react|react-dom|react-router-dom)\//.test(id)) {
            return 'react-vendor'
          }
          // Charts
          if (/node_modules\/recharts\//.test(id)) {
            return 'charts'
          }
          // Form libs
          if (/node_modules\/(react-hook-form|@hookform\/resolvers|zod)\//.test(id)) {
            return 'form-libraries'
          }
          // Misc UI utilities
          if (/node_modules\/(framer-motion|lucide-react|class-variance-authority|clsx|tailwind-merge|date-fns)\//.test(id)) {
            return 'ui-utilities'
          }
        },
        // Better naming for chunks
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    
    // Minification settings (esbuild is faster and included by default)
    minify: 'esbuild',
    esbuild: {
      drop: ['console', 'debugger'], // Remove console.log and debugger in production
    },
    
    // Source map for debugging (disable for production)
    sourcemap: false,
  },
  
  // Optimize dependency pre-bundling
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'lucide-react',
      'recharts',
    ],
  },
})
