import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  base: '/vision-capture-vista/',
  tanstackStart: {
    server: { entry: "server" },
    spa: {
      enabled: true,
    },
  },
});
