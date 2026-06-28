import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: 'src/main.jsx',
      name: 'N3trunner',
      fileName: 'react-bundle',
      formats: ['es'],
    },
    outDir: 'assets',
    emptyOutDir: false,
    rollupOptions: {
      external: [],
    },
  },
});
