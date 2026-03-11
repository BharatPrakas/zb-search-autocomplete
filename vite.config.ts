import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    // TODO: change the outDir to the correct path
    // outDir: 'E:/Centizen Projects/zenbasket/zenbasket/zb-app/apps/zb-storefront/public/plugins',
    emptyOutDir: false,
    lib: {
      entry: {
        'zb-search/zb-search-overlay': 'src/zb-search/zb-search-overlay.ts',
        'zb-search/zb-search-panel': 'src/zb-search/zb-search-panel.ts',
        'zb-search/zb-search-inline': 'src/zb-search/zb-search-inline.ts',
      },
      formats: ['es'],
    },
    rollupOptions: {
      // Externalize dependencies that shouldn't be bundled
      external: [],
      output: {
        // Ensure proper module format
        format: 'es',
        chunkFileNames: (chunkInfo) => {
          if (chunkInfo.moduleIds.some(id => id.includes('/src/zb-search/'))) {
            return 'zb-search/[name].js';
          }
          return '[name].js';
        },
      },
    },
  },
});
