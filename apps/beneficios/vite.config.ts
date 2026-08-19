import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { federation } from "@module-federation/vite";
import config from "./module-federation.config.ts";
import { fileURLToPath, URL } from "node:url";
export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  cacheDir: fileURLToPath(
    new URL("../../node_modules/.vite/beneficios", import.meta.url),
  ),
  plugins: [react(), federation(config)],
  server: {
    origin: "http://localhost:4300",
    port: Number("4300"),
    strictPort: true,
  },
  base: "http://localhost:4300",
  build: {
    target: "chrome89",
    outDir: fileURLToPath(
      new URL("../../dist/apps/beneficios", import.meta.url),
    ),
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      "@portal/platform-contracts": fileURLToPath(
        new URL("../../libs/platform/contracts/src/index.ts", import.meta.url),
      ),
      "@portal/platform-runtime": fileURLToPath(
        new URL("../../libs/platform/runtime/src/index.ts", import.meta.url),
      ),
      "@portal/platform-observability": fileURLToPath(
        new URL(
          "../../libs/platform/observability/src/index.ts",
          import.meta.url,
        ),
      ),
      "@portal/design-system-web": fileURLToPath(
        new URL("../../libs/design-system-web/src/index.tsx", import.meta.url),
      ),
      "@portal/design-tokens": fileURLToPath(
        new URL("../../libs/design-tokens/src/index.ts", import.meta.url),
      ),
    },
  },
});
