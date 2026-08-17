import { describe, expect, it } from 'vitest';
import type { ModuleFederation } from '@module-federation/runtime';
import { loadFederatedJourney } from './index';

const manifest = {
  id: 'neutral-journey', route: '/foundation', strategy: 'federated-module', version: '1.0.0', platformCompatibility: '^1.0.0',
  owner: { squad: 'platform', contact: 'platform@example.test' }, observability: { domain: 'foundation', eventNamespace: 'foundation' },
  rollout: { audience: 'all', percentage: 100 }, remote: { name: 'neutral-remote', entry: 'http://localhost:4201/mf-manifest.json', exposedModule: './Journey' }
} as const;

describe('loadFederatedJourney', () => {
  it('loads a valid remote module', async () => {
    const runtime = { registerRemotes: () => undefined, loadRemote: async () => ({ default: () => null }) } as unknown as Pick<ModuleFederation, 'loadRemote' | 'registerRemotes'>;
    const result = await loadFederatedJourney(manifest, runtime);
    expect(result.status).toBe('ready');
  });
  it('keeps the host available for malformed manifests', async () => expect(await loadFederatedJourney({})).toMatchObject({ status: 'fallback', reason: 'invalid-manifest' }));
  it('keeps the host available for incompatible contracts', async () => expect(await loadFederatedJourney({ ...manifest, platformCompatibility: '^2.0.0' })).toMatchObject({ status: 'fallback', reason: 'incompatible-contract' }));
  it('keeps the host available when a remote cannot load', async () => {
    const result = await loadFederatedJourney(manifest, { registerRemotes: () => undefined, loadRemote: async () => { throw new Error('offline'); } });
    expect(result).toEqual({ status: 'fallback', reason: 'remote-unavailable' });
  });
});
