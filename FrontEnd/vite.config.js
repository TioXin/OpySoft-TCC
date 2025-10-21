// FrontEnd/vite.config.js

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Se o seu terminal mostrar outro Host/Porta, ajuste aqui:
const EMULATOR_HOST = 'http://127.0.0.1:5001'; 
// CORRIGIDO: O Firebase está usando 'opysoft' como ID do projeto localmente.
const PROJECT_ID = 'opysoft'; 
const REGION = 'us-central1'; 

export default defineConfig({
  plugins: [
    react(),
    tailwindcss() 
  ],
  server: {
    proxy: {
      '/api': {
        target: `${EMULATOR_HOST}/${PROJECT_ID}/${REGION}/api`, 
        changeOrigin: true,
        secure: false, 
      },
    },
  },
});