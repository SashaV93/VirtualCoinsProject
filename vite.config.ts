import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Relative asset paths keep the build working from any sub-path, which is
  // what GitHub Pages project sites need (https://user.github.io/repo/).
  base: './',
});
