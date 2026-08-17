import { describe, expect, it } from 'vitest';
import { journeyManifestSchema, platformCapabilitiesRequestSchema } from './index';

const validManifest = {
  id: 'neutral-journey', route: '/foundation', strategy: 'federated-module', version: '1.0.0',
  platformCompatibility: '^1.0.0', owner: { squad: 'platform', contact: 'platform@example.test' },
  observability: { domain: 'foundation', eventNamespace: 'foundation' }, rollout: { audience: 'all', percentage: 100 },
  remote: { name: 'neutral-remote', entry: 'http://localhost:4201/mf-manifest.json', exposedModule: './Journey' }
};

describe('journeyManifestSchema', () => {
  it('accepts a complete federated journey manifest', () => expect(journeyManifestSchema.parse(validManifest)).toEqual(validManifest));
  it.each([
    ['strategy', { ...validManifest, strategy: 'iframe' }],
    ['version', { ...validManifest, version: 'one' }],
    ['route', { ...validManifest, route: 'foundation' }],
    ['remote entry', { ...validManifest, remote: { ...validManifest.remote, entry: 'not-a-url' } }]
  ])('rejects an invalid %s', (_label, manifest) => expect(journeyManifestSchema.safeParse(manifest).success).toBe(false));
  it('rejects a capability outside of the platform contract', () => {
    expect(platformCapabilitiesRequestSchema.safeParse({ required: ['token'] }).success).toBe(false);
  });
});
