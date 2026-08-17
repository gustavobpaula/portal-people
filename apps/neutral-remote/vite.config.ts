import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { federation } from '@module-federation/vite';
import federationConfig from './module-federation.config.ts';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  cacheDir: fileURLToPath(new URL('../../node_modules/.vite/neutral-remote', import.meta.url)),
  plugins: [react(), federation(federationConfig)], server: { origin: 'http://localhost:4201', port: 4201 }, base: 'http://localhost:4201',
  build: { target: 'chrome89', outDir: fileURLToPath(new URL('../../dist/apps/neutral-remote', import.meta.url)), emptyOutDir: true },
  resolve: { alias: {
    '@portal/platform-contracts': fileURLToPath(new URL('../../libs/platform/contracts/src/index.ts', import.meta.url)),
    '@portal/platform-runtime': fileURLToPath(new URL('../../libs/platform/runtime/src/index.ts', import.meta.url))
  } }
});
