import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'three/webgpu': path.resolve(__dirname, 'src/shims/empty-webgpu.ts'),
      'three/tsl': path.resolve(__dirname, 'src/shims/empty-tsl.ts'),
    }
  },
  optimizeDeps: {
    esbuildOptions: {
      // help esbuild pick ESM conditions and avoid trying to resolve webgpu subpath
      supported: { 'top-level-await': true }
    }
  }
})
