import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  // Base path for GitHub Pages subdirectory deployment
  // Change this if your repo name changes
  base: '/vision-capture-vista/',

  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts
    server: { entry: "server" },
    // Enable SPA mode for static deployment
    spa: {
      enabled: true,
    },
  },
});
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  base: '/vision-capture-vista/',
  tanstackStart: {
    server: { entry: "server" },
    spa: {
      enabled: true,
      prerender: {
        outputPath: '/index.html',
      },
    },
  },
});
