import { defineConfig } from 'vite'
import { nitro } from 'nitro/vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'

export default defineConfig({
  plugins: [
    tanstackStart(),
    nitro({
      preset: 'vercel', // <-- This forces Vercel-compatible output
    }),
  ],
})
