import path from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
import { vitestTransform } from 'storybook/internal/csf-tools';
import { defineConfig } from 'vitest/config';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
const storybookConfigDir = path.join(dirname, 'apps/design-system-docs/.storybook');
const storybookStoryDirectory = path.join(dirname, 'libs/design-system-web/src');
const storybookPlugins = await storybookTest({ configDir: storybookConfigDir });
const storybookTestPlugin = storybookPlugins.find((plugin) => plugin.name === 'vite-plugin-storybook-test');

if (storybookTestPlugin) storybookTestPlugin.transform = undefined;

/**
 * Storybook 10.5 discovers stories in this nested workspace but generates a
 * browser-path guard that Vitest cannot match. Keep its runner, setup and a11y
 * integration, while applying the same official CSF transform with a test-file
 * guard that is deterministic for this project.
 */
const storybookTransformFallback = {
  name: 'portal-storybook-vitest-transform-fallback',
  enforce: 'pre' as const,
  async transform(code: string, id: string) {
    if (!id.startsWith(storybookStoryDirectory) || !id.endsWith('.stories.tsx')) return;

    const transformed = await vitestTransform({
      code,
      fileName: id,
      configDir: storybookConfigDir,
      tagsFilter: { include: ['test'], exclude: [], skip: [] },
      stories: ['../../../libs/design-system-web/src/**/*.stories.@(ts|tsx)', '../src/**/*.mdx'],
      previewLevelTags: []
    });

    return { ...transformed, code: transformed.code.replace('if (_isRunningFromThisFile) {', 'if (true) {') };
  }
};

export default defineConfig({
  resolve: {
    alias: {
      '@portal/design-tokens': fileURLToPath(new URL('./libs/design-tokens/src/index.ts', import.meta.url)),
      '@portal/design-system-web': fileURLToPath(new URL('./libs/design-system-web/src/index.tsx', import.meta.url))
    }
  },
  test: {
    projects: [{
      extends: true,
      plugins: [...storybookPlugins, storybookTransformFallback],
      test: {
        name: 'storybook',
        browser: {
          enabled: true,
          headless: true,
          provider: playwright(executablePath ? { launchOptions: { executablePath } } : {}),
          instances: [{ browser: 'chromium' }]
        }
      }
    }]
  }
});
