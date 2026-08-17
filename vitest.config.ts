import { defineConfig } from 'vitest/config';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  resolve: { alias: { '@portal/platform-contracts': fileURLToPath(new URL('./libs/platform/contracts/src/index.ts', import.meta.url)) } },
  test: { environment: 'node', include: ['libs/**/*.spec.ts', 'tools/**/*.spec.mjs'] }
});
