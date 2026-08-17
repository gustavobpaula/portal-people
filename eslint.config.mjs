import nx from '@nx/eslint-plugin';
import tseslint from 'typescript-eslint';

export default [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...tseslint.configs.recommended,
  {
    ignores: ['dist/**', 'node_modules/**'],
    files: ['**/*.{ts,tsx}'],
    rules: {
      '@nx/enforce-module-boundaries': ['error', {
        enforceBuildableLibDependency: true,
        allow: [],
        depConstraints: [
          { sourceTag: 'scope:shell', onlyDependOnLibsWithTags: ['scope:platform', 'scope:design-system'] },
          { sourceTag: 'scope:neutral-domain', onlyDependOnLibsWithTags: ['scope:neutral-domain', 'scope:platform', 'scope:design-system'] },
          { sourceTag: 'scope:platform', onlyDependOnLibsWithTags: ['scope:platform'] },
          { sourceTag: 'scope:design-system', onlyDependOnLibsWithTags: ['scope:design-system'] },
          { sourceTag: 'scope:design-system-docs', onlyDependOnLibsWithTags: ['scope:design-system'] }
        ]
      }]
    }
  }
];
