import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
  },
  server: {
    historyApiFallback: true, // 🔥 Para redirigir todas las rutas a index.html
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
})