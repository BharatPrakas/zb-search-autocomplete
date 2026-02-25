import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    outDir: 'E:/Centizen Projects/zenbasket/zenbasket/zb-app/apps/zb-storefront/public/plugins/zb-search',
    emptyOutDir: false,
    lib: {
      entry: {
        'zb-search-overlay': 'src/zb-search-overlay.ts',
        'zb-search-panel': 'src/zb-search-panel.ts',
        'zb-search-inline': 'src/zb-search-inline.ts',
      },
      formats: ['es'],
    },
    rollupOptions: {
      // Externalize dependencies that shouldn't be bundled
      external: [],
      output: {
        // Ensure proper module format
        format: 'es',
        chunkFileNames: '[name].js',
      },
    },
  },
});
