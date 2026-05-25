import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
      '/sitemap.xml': 'http://localhost:3001',
      '/rss.xml': 'http://localhost:3001',
      '/llms.txt': 'http://localhost:3001',
      '/robots.txt': 'http://localhost:3001',
    },
  },
})
