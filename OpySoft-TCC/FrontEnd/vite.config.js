// FrontEnd/vite.config.js

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite'; // IMPORTAÇÃO DO TAILWIND

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss() // MANTÉM O PLUGIN DO TAILWIND
  ],
  server: {
    // Configura o proxy para enviar chamadas /api/* para o emulador de funções
    proxy: {
      '/api': {
        // Usa a URL do seu emulador de funções
        target: 'http://127.0.0.1:5001/demo-no-project/us-central1/api', 
        changeOrigin: true,
        // Remove o '/api' antes de enviar para o Express (necessário para o seu setup)
        rewrite: (path) => path.replace(/^\/api/, '') 
      },
    },
  },
});