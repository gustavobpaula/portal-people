import type { StorybookConfig } from '@storybook/react-vite';
import { fileURLToPath, URL } from 'node:url';

const workspaceRoot = fileURLToPath(new URL('../../../', import.meta.url));

const config: StorybookConfig = {
  stories: ['../../../libs/design-system-web/src/**/*.stories.@(ts|tsx)', '../src/**/*.mdx'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y', '@storybook/addon-vitest'],
  framework: '@storybook/react-vite',
  viteFinal: async (viteConfig) => ({
    ...viteConfig,
    root: workspaceRoot,
    resolve: {
      ...viteConfig.resolve,
      alias: {
        ...(viteConfig.resolve?.alias ?? {}),
        '@portal/design-tokens': fileURLToPath(new URL('../../../libs/design-tokens/src/index.ts', import.meta.url)),
        '@portal/design-system-web': fileURLToPath(new URL('../../../libs/design-system-web/src/index.tsx', import.meta.url)),
      },
    },
  }),
};

export default config;
