import nx from '@nx/eslint-plugin';
import tseslint from 'typescript-eslint';
import { readFileSync } from 'node:fs';
import { createDomainConstraints } from './tools/domain-governance.mjs';

const domainGovernance = JSON.parse(readFileSync(new URL('./tools/domain-governance.json', import.meta.url), 'utf8'));
const domainConstraints = createDomainConstraints(domainGovernance.domains);

export default [
  { ignores: ['tools/generators/templates/**'] },
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
          ...domainConstraints,
          { sourceTag: 'scope:platform', onlyDependOnLibsWithTags: ['scope:platform'] },
          { sourceTag: 'scope:design-system', onlyDependOnLibsWithTags: ['scope:design-system'] },
          { sourceTag: 'scope:design-system-docs', onlyDependOnLibsWithTags: ['scope:design-system'] }
        ]
      }]
    }
  }
  ,
  {
    files: ['apps/**/*.{ts,tsx}', 'libs/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          { group: ['@portal/design-system-web/*'], message: 'Use @portal/design-system-web only through its public entry point.' },
          { group: ['@portal/design-tokens/*'], message: 'Use @portal/design-tokens only through its public entry point.' }
        ]
      }]
    }
  }
];
