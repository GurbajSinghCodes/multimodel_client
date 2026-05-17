import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  server: {
    host: '0.0.0.0', // Allows LAN access
    port: 5173,       // Your port (optional)
  },
  plugins: [
    tailwindcss(),
  ],
})