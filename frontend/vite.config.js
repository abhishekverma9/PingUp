import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    global: 'window', // polyfill global
  },
  resolve: {
    alias: {
      process: 'process/browser', // polyfill process
      buffer: 'buffer',           // polyfill buffer
    },
  },
});
