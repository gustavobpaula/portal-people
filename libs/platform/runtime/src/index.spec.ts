import { describe, expect, it, vi } from 'vitest';
import type { ModuleFederation } from '@module-federation/runtime';
import { createWebCapabilities, loadFederatedJourney, prepareExternalJourney, resolveJourneyRegistry } from './index';

const manifest = {
  id: 'neutral-journey', route: '/foundation', strategy: 'federated-module', version: '1.0.0', platformCompatibility: '^1.0.0',
  owner: { squad: 'platform', contact: 'platform@example.test' }, observability: { domain: 'foundation', eventNamespace: 'foundation' },
  remote: { name: 'neutral-remote', entry: 'http://localhost:4201/mf-manifest.json', exposedModule: './Journey' }
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
  it('retains a safe route for a rejected manifest fallback', () => {
    expect(resolveJourneyRegistry([{ route: '/beneficios', strategy: 'external-web' }]).rejected).toEqual([
      { index: 0, reason: 'invalid-manifest', route: '/beneficios' }
    ]);
  });
});

describe('prepareExternalJourney', () => {
  const external = {
    ...manifest,
    id: 'holerite-legado',
    strategy: 'external-web',
    destination: 'http://localhost:4500/holerite',
    returnRoute: '/retorno/holerite-legado'
  } as const;

  it('creates a fixed, sanitized handoff URL from an allowlisted origin', () => {
    expect(prepareExternalJourney(external, ['http://localhost:4500'], 'http://localhost:4200')).toMatchObject({
      status: 'ready',
      destination: 'http://localhost:4500/holerite?returnTo=http%3A%2F%2Flocalhost%3A4200%2Fretorno%2Fholerite-legado'
    });
  });
  it('rejects an external destination outside the platform allowlist', () => {
    expect(prepareExternalJourney({ ...external, destination: 'http://localhost:4600/holerite' }, ['http://localhost:4500'], 'http://localhost:4200')).toEqual({
      status: 'fallback', reason: 'external-origin-not-allowed'
    });
  });
  it('rejects an external journey with an incompatible platform contract', () => {
    expect(prepareExternalJourney(
      { ...external, platformCompatibility: '^2.0.0' },
      ['http://localhost:4500'],
      'http://localhost:4200'
    )).toEqual({ status: 'fallback', reason: 'incompatible-contract' });
  });
  it('replaces an external returnTo value instead of accepting browser-controlled data', () => {
    const result = prepareExternalJourney(
      { ...external, destination: 'http://localhost:4500/holerite?returnTo=https://attacker.example' },
      ['http://localhost:4500'],
      'http://localhost:4200'
    );
    expect(result).toMatchObject({
      status: 'ready',
      destination: 'http://localhost:4500/holerite?returnTo=http%3A%2F%2Flocalhost%3A4200%2Fretorno%2Fholerite-legado'
    });
  });
  it('removes every destination parameter and fragment before the handoff', () => {
    const result = prepareExternalJourney(
      { ...external, destination: 'http://localhost:4500/holerite?debug=true#private' },
      ['http://localhost:4500'],
      'http://localhost:4200'
    );
    expect(result).toMatchObject({
      status: 'ready',
      destination: 'http://localhost:4500/holerite?returnTo=http%3A%2F%2Flocalhost%3A4200%2Fretorno%2Fholerite-legado'
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
