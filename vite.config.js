import { resolve } from 'node:path';
import { defineConfig } from 'vite';

const root = import.meta.dirname;

export default defineConfig({
  server: {
    port: 5500,
    open: true,
  },
  preview: {
    port: 4173,
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(root, 'index.html'),
        product: resolve(root, 'product.html'),
        services: resolve(root, 'services.html'),
        industries: resolve(root, 'industries.html'),
        about: resolve(root, 'about.html'),
      },
    },
  },
});
