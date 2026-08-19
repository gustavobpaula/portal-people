import { defineConfig } from "vitest/config";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
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
  test: {
    environment: "jsdom",
    include: ["apps/ferias/src/**/*.spec.{ts,tsx}"],
    setupFiles: ["apps/ferias/src/test/setup.ts"],
  },
});
