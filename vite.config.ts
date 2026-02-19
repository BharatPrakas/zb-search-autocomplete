import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    outDir: 'E:/Centizen Projects/zenbasket/zenbasket/zb-app/apps/zb-storefront/public/plugins/zb-search',
    emptyOutDir: false,
    lib: {
      entry: {
        'zb-search-autocomplete': 'src/zb-search-autocomplete.ts',
        'zb-search-modern': 'src/zb-search-modern.ts',
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
