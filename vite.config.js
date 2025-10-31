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
build: {
  /* … */
  rollupOptions: {
    output: {
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
      chunkFileNames:   'assets/[name]-[hash].js',
      entryFileNames:   'assets/[name]-[hash].js',
      assetFileNames:   'assets/[name]-[hash].[ext]',
    },
  },
  /* … */
}
          // Vendor chunks - separate large libraries
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'radix-ui': [
            '@radix-ui/react-accordion',
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-avatar',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-collapsible',
            '@radix-ui/react-context-menu',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-hover-card',
            '@radix-ui/react-label',
            '@radix-ui/react-menubar',
            '@radix-ui/react-navigation-menu',
            '@radix-ui/react-popover',
            '@radix-ui/react-progress',
            '@radix-ui/react-radio-group',
            '@radix-ui/react-scroll-area',
            '@radix-ui/react-select',
            '@radix-ui/react-separator',
            '@radix-ui/react-slider',
            '@radix-ui/react-slot',
            '@radix-ui/react-switch',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toggle',
            '@radix-ui/react-toggle-group',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-aspect-ratio',
          ],
          'charts': ['recharts'],
          'form-libraries': ['react-hook-form', '@hookform/resolvers', 'zod'],
          'ui-utilities': [
            'framer-motion',
            'lucide-react',
            'class-variance-authority',
            'clsx',
            'tailwind-merge',
            'date-fns',
          ],
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
