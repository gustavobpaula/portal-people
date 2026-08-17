import { describe, expect, it, vi } from 'vitest';
import type { ModuleFederation } from '@module-federation/runtime';
import { createWebCapabilities, loadFederatedJourney, resolveJourneyRegistry } from './index';

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
  it('distinguishes a remote timeout', async () => {
    const result = await loadFederatedJourney(manifest, {
      registerRemotes: () => undefined,
      loadRemote: () => new Promise(() => undefined)
    }, 1);
    expect(result).toEqual({ status: 'fallback', reason: 'remote-timeout' });
  });
});

describe('resolveJourneyRegistry', () => {
  it('keeps valid entries when another entry is malformed', () => {
    expect(resolveJourneyRegistry([manifest, {}])).toMatchObject({
      journeys: [manifest],
      rejected: [{ index: 1, reason: 'invalid-manifest' }]
    });
  });
  it('reports a malformed registry without throwing', () => {
    expect(resolveJourneyRegistry({})).toEqual({
      journeys: [],
      rejected: [{ index: -1, reason: 'invalid-registry' }]
    });
  });
});

describe('createWebCapabilities', () => {
  it('uses injected navigation and telemetry adapters', () => {
    const navigate = vi.fn();
    const track = vi.fn();
    const capabilities = createWebCapabilities({ navigate, telemetry: { track } });
    capabilities.navigate('/foundation');
    capabilities.telemetry.track({ name: 'portal.event' });
    expect(navigate).toHaveBeenCalledWith('/foundation');
    expect(track).toHaveBeenCalledWith({ name: 'portal.event' });
  });
});
