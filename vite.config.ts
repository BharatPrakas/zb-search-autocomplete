import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    outDir: 'E:/Centizen Projects/zenbasket/zenbasket/zb-app/apps/zb-storefront/public/plugins',
    emptyOutDir: false,
    lib: {
      entry: 'src/zb-search-autocomplete.ts',
      formats: ['es'],
      fileName: 'zb-search-autocomplete',
    },
    rollupOptions: {
      // Externalize dependencies that shouldn't be bundled
      external: [],
      output: {
        // Ensure proper module format
        format: 'es',
      },
    },
  },
});
