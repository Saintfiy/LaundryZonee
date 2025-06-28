import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/LaundryZonee/', // ⬅️ WAJIB: ini yang bikin GitHub Pages bisa jalan
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
