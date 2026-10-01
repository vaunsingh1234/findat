import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { handleStockApiRequest } from './src/server/stockApiServer.ts'

function stockApiPlugin(): Plugin {
  return {
    name: 'findat-stock-api',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        handleStockApiRequest(req, res, next);
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), stockApiPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
})

