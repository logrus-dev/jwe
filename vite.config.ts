import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'mantine-vendor': [
            '@mantine/core',
            '@mantine/hooks',
            '@mantine/notifications',
            '@mantine/code-highlight',
          ],
          'rjsf-vendor': ['@rjsf/core', '@rjsf/mantine', '@rjsf/utils', '@rjsf/validator-ajv8'],
          'jose-vendor': ['jose'],
        },
      },
    },
  },
})
