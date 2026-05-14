import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'generate-version',
      closeBundle() {
        const version = {
          version: Date.now().toString(),
          timestamp: new Date().toISOString()
        };
        fs.writeFileSync(
          path.resolve(__dirname, 'dist/version.json'),
          JSON.stringify(version)
        );
      }
    }
  ],
  base: './',
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
