import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  resolve: { alias: {
    '@portal/design-tokens': fileURLToPath(new URL('./libs/design-tokens/src/index.ts', import.meta.url)),
    '@portal/design-system-web': fileURLToPath(new URL('./libs/design-system-web/src/index.tsx', import.meta.url)),
  } },
  test: {
    include: ['libs/design-system-web/src/**/*.browser.spec.tsx'],
    browser: { enabled: true, headless: true, provider: playwright({ launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE } }), instances: [{ browser: 'chromium' }] },
  },
});
