import { describe, expect, it } from 'vitest';
import { journeyManifestSchema, platformCapabilitiesRequestSchema } from './index';

const validManifest = {
  id: 'neutral-journey', route: '/foundation', strategy: 'federated-module', version: '1.0.0',
  platformCompatibility: '^1.0.0', owner: { squad: 'platform', contact: 'platform@example.test' },
  observability: { domain: 'foundation', eventNamespace: 'foundation' },
  remote: { name: 'neutral-remote', entry: 'http://localhost:4201/mf-manifest.json', exposedModule: './Journey' }
};

describe('journeyManifestSchema', () => {
  it('accepts a complete federated journey manifest', () => expect(journeyManifestSchema.parse(validManifest)).toEqual(validManifest));
  it('accepts the additive display name and remains compatible without it', () => {
    expect(journeyManifestSchema.parse({ ...validManifest, displayName: 'Fundação' }).displayName).toBe('Fundação');
    expect(journeyManifestSchema.parse(validManifest).displayName).toBeUndefined();
  });
  it.each([
    ['strategy', { ...validManifest, strategy: 'iframe' }],
    ['version', { ...validManifest, version: 'one' }],
    ['route', { ...validManifest, route: 'foundation' }],
    ['remote entry', { ...validManifest, remote: { ...validManifest.remote, entry: 'not-a-url' } }]
  ])('rejects an invalid %s', (_label, manifest) => expect(journeyManifestSchema.safeParse(manifest).success).toBe(false));
  it('rejects a capability outside of the platform contract', () => {
    expect(platformCapabilitiesRequestSchema.safeParse({ required: ['token'] }).success).toBe(false);
  });
  it('requires an authorized return route for external journeys', () => {
    const external = {
      ...validManifest,
      id: 'holerite-legado',
      strategy: 'external-web',
      destination: 'http://localhost:4500/holerite',
      returnRoute: '/retorno/holerite-legado'
    };
    expect(journeyManifestSchema.safeParse(external).success).toBe(true);
    expect(journeyManifestSchema.safeParse({ ...external, returnRoute: undefined }).success).toBe(false);
    expect(
      journeyManifestSchema.safeParse({
        ...external,
        returnRoute: "/retorno/outra-jornada",
      }).success,
    ).toBe(false);
  });
  it('accepts a native route without adding delivery policy', () => {
    const native = {
      ...validManifest,
      strategy: 'native-route',
      nativeRoute: 'portal-pessoas://holerite'
    };
    expect(journeyManifestSchema.parse(native)).toMatchObject({
      strategy: 'native-route',
      nativeRoute: 'portal-pessoas://holerite'
    });
  });
  it('does not expose rollout metadata in the parsed contract', () => {
    const parsed = journeyManifestSchema.parse({
      ...validManifest,
      rollout: { audience: 'pilot', percentage: 10, variant: 'candidate' }
    });
    expect(parsed).not.toHaveProperty('rollout');
  });
});
