import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      '/api/wallet': {
        target: 'https://suiport.mailberkayoztunc.workers.dev',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/wallet/, '/wallet'),
      },
    },
  },
})
