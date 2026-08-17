import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
export default defineConfig({ root: fileURLToPath(new URL('.', import.meta.url)), cacheDir: fileURLToPath(new URL('../../node_modules/.vite/design-system-docs', import.meta.url)), plugins: [react()], build: { target: 'chrome89', outDir: fileURLToPath(new URL('../../dist/apps/design-system-docs', import.meta.url)), emptyOutDir: true }, resolve: { alias: {
  '@portal/design-tokens': fileURLToPath(new URL('../../libs/design-tokens/src/index.ts', import.meta.url)),
  '@portal/design-system-web': fileURLToPath(new URL('../../libs/design-system-web/src/index.tsx', import.meta.url))
} } });
