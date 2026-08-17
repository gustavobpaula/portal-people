import { defineConfig } from 'vitest/config';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  resolve: { alias: { '@portal/design-tokens': fileURLToPath(new URL('../design-tokens/src/index.ts', import.meta.url)), '@portal/design-system-web': fileURLToPath(new URL('./src/index.tsx', import.meta.url)) } },
  test: { environment: 'jsdom', include: ['libs/design-system-web/src/**/*.spec.tsx'] },
});
