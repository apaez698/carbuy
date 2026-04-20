import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

// https://vite.dev/config/
export default defineConfig({
  base: "/",
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
      },
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.js",
    exclude: ["node_modules/**", "_deprecated_v1_v2/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: [
        "src/App.jsx",
        "src/components/FunnelChart.jsx",
        "src/hooks/useMetric.js",
        "src/utils/metrics.js",
        "src/utils/whatsapp.js",
      ],
      thresholds: {
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100,
      },
    },
  },
});
