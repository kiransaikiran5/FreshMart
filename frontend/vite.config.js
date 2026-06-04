import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Forward all /static requests to the FastAPI backend
      '/static': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      // Forward all /api requests to the backend (if your Axios uses relative paths)
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      }
    }
  }
})