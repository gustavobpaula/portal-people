import { defineConfig } from 'vitest/config';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  resolve: {
    alias: {
      '@portal/platform-runtime': fileURLToPath(new URL('../../libs/platform/runtime/src/index.ts', import.meta.url))
    }
  },
  test: { environment: 'jsdom', include: ['apps/portal-host/src/**/*.spec.tsx'] }
});
