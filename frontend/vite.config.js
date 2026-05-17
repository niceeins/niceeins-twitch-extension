import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const reviewBuild = mode === 'review'

  return {
    base: './',
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      allowedHosts: true
    },
    build: {
      outDir: 'dist',
      minify: reviewBuild ? false : undefined,
      sourcemap: reviewBuild,
      rollupOptions: {
        input: {
          index: 'index.html',
          panel: 'panel.html'
        }
      }
    }
  }
})
