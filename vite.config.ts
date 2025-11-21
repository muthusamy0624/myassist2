import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Polyfill process.env for libraries that rely on it (like legacy Supabase or PDF.js utils)
    'process.env': {}
  }
});
