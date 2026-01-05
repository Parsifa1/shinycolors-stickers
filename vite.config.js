import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/shinycolors-stickers/',
  build: {
    outDir: 'build',
  },
  server: {
    open: true,
    port: 3000,
  },
});
