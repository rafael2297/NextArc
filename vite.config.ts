import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  // Define a base como relativa para que o Electron encontre os assets (JS, CSS, Imagens)
  // sem precisar de um servidor HTTP rodando.
  base: './',

  plugins: [react()],

  server: {
    port: 5173, // Garante que a porta seja a mesma que você configurou no main.ts
    headers: {
      'Cross-Origin-Opener-Policy': 'unsafe-none',
    },
  },

  build: {
    // Pasta onde o Electron vai buscar os arquivos compilados
    outDir: 'dist',
    // Garante que o build seja compatível com o ambiente do Electron
    target: 'esnext',
  }
})