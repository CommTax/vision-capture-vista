import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

export default mergeConfig(
  viteConfig as unknown as Parameters<typeof mergeConfig>[0],
  defineConfig({
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts', // Remove this line if you don't have a setup file
    },
  })
);
