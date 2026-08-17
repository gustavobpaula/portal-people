import { describe, expect, it } from 'vitest';
import { createDomainConstraints } from '../domain-governance.mjs';

describe('domain governance', () => {
  it('creates isolated Nx constraints for every registered domain', () => {
    const constraints = createDomainConstraints(['beneficios', 'ferias']);

    expect(constraints).toEqual([
      {
        allSourceTags: ['scope:domain', 'domain:beneficios'],
        onlyDependOnLibsWithTags: ['domain:beneficios', 'scope:platform', 'scope:design-system']
      },
      {
        allSourceTags: ['scope:domain', 'domain:ferias'],
        onlyDependOnLibsWithTags: ['domain:ferias', 'scope:platform', 'scope:design-system']
      }
    ]);
  });

  it('allows the current domain, platform and Design System, but not another domain', () => {
    const [beneficios] = createDomainConstraints(['beneficios', 'ferias']);
    const allows = (targetTag) => beneficios.onlyDependOnLibsWithTags.includes(targetTag);

    expect(allows('domain:beneficios')).toBe(true);
    expect(allows('scope:platform')).toBe(true);
    expect(allows('scope:design-system')).toBe(true);
    expect(allows('domain:ferias')).toBe(false);
  });
});
