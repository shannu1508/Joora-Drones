import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import cssnano from 'cssnano';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    cssnano({
      preset: 'default',
    }),
  ],
})
