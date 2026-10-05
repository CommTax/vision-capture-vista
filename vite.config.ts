import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  vite: { base: '/vision-capture-vista/' },
  tanstackStart: {
    server: { entry: "server" },
    spa: {
      enabled: true,
    },
  },
});
