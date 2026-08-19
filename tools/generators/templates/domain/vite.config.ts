import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { federation } from "@module-federation/vite";
import { createFederationConfig } from "./module-federation.config.ts";
import { fileURLToPath, URL } from "node:url";
export default defineConfig(({ command }) => ({
  root: fileURLToPath(new URL(".", import.meta.url)),
  cacheDir: fileURLToPath(
    new URL("../../node_modules/.vite/__DOMAIN_NAME__", import.meta.url),
  ),
  plugins: [react(), federation(createFederationConfig(command === "serve"))],
  server: {
    origin: "http://localhost:__PORT__",
    port: Number("__PORT__"),
    strictPort: true,
  },
  base: "http://localhost:__PORT__",
  build: {
    target: "chrome89",
    outDir: fileURLToPath(
      new URL("../../dist/apps/__DOMAIN_NAME__", import.meta.url),
    ),
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      "@portal/platform-contracts": fileURLToPath(
        new URL(
          "../../libs/platform/contracts/src/index.ts",
          import.meta.url,
        ),
      ),
      "@portal/platform-runtime": fileURLToPath(
        new URL("../../libs/platform/runtime/src/index.ts", import.meta.url),
      ),
      "@portal/design-system-web": fileURLToPath(
        new URL(
          "../../libs/design-system-web/src/index.tsx",
          import.meta.url,
        ),
      ),
      "@portal/design-tokens": fileURLToPath(
        new URL("../../libs/design-tokens/src/index.ts", import.meta.url),
      ),
    },
  },
}));
