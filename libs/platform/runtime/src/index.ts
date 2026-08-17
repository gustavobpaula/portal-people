import { createInstance, type ModuleFederation } from '@module-federation/runtime';
import {
  PLATFORM_CONTRACT_VERSION,
  journeyManifestSchema,
  type FederatedJourneyModule,
  type JourneyManifest,
  type PlatformCapabilities
} from '@portal/platform-contracts';

const defaultRuntime = createInstance({ name: 'portal-host', remotes: [] });

/** Result boundary used by the host to distinguish a loadable journey from a safe fallback state. */
export type JourneyLoadResult =
  | { status: 'ready'; manifest: Extract<JourneyManifest, { strategy: 'federated-module' }>; module: FederatedJourneyModule }
  | { status: 'fallback'; reason: 'invalid-manifest' | 'incompatible-contract' | 'remote-timeout' | 'remote-unavailable' };

export type JourneyRegistryResolution = Readonly<{
  journeys: JourneyManifest[];
  rejected: Array<{ index: number; reason: 'invalid-manifest' | 'invalid-registry' }>;
}>;

export type WebCapabilityAdapters = Readonly<{
  navigate?: PlatformCapabilities['navigate'];
  telemetry?: PlatformCapabilities['telemetry'];
}>;

/**
 * Checks whether the manifest's platform contract major version is supported.
 * Compatibility is intentionally limited to the major version in this foundation.
 */
export function isCompatible(required: string, actual = PLATFORM_CONTRACT_VERSION): boolean {
  const major = (value: string) => value.replace(/^[~^]/, '').split('.')[0];
  return major(required) === major(actual);
}

/**
 * Parses an untrusted manifest without exposing schema implementation details to consumers.
 */
export function resolveManifest(value: unknown): JourneyManifest | null {
  const parsed = journeyManifestSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

/**
 * Resolves each registry entry independently so one malformed journey cannot hide valid ones.
 */
export function resolveJourneyRegistry(value: unknown): JourneyRegistryResolution {
  if (!Array.isArray(value)) {
    return { journeys: [], rejected: [{ index: -1, reason: 'invalid-registry' }] };
  }

  const journeys: JourneyManifest[] = [];
  const rejected: JourneyRegistryResolution['rejected'] = [];
  value.forEach((entry, index) => {
    const manifest = resolveManifest(entry);
    if (manifest) journeys.push(manifest);
    else rejected.push({ index, reason: 'invalid-manifest' });
  });
  return { journeys, rejected };
}

/**
 * Validates, registers, and loads a federated journey while preserving a safe host fallback.
 *
 * @param value Raw manifest data from the journey registry.
 * @param runtime Federation runtime seam; injectable to keep loading deterministic in tests.
 * @param timeoutMs Maximum time allowed for evaluating the remote module.
 * @returns The loaded journey module or a reason that the host can render safely.
 */
export async function loadFederatedJourney(
  value: unknown,
  runtime: Pick<ModuleFederation, 'loadRemote' | 'registerRemotes'> = defaultRuntime,
  timeoutMs = 5_000
): Promise<JourneyLoadResult> {
  const manifest = resolveManifest(value);
  if (!manifest || manifest.strategy !== 'federated-module') return { status: 'fallback', reason: 'invalid-manifest' };
  if (!isCompatible(manifest.platformCompatibility)) return { status: 'fallback', reason: 'incompatible-contract' };

  runtime.registerRemotes?.([{ name: manifest.remote.name, entry: manifest.remote.entry }]);
  const timeoutMarker = Symbol('remote-timeout');
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  try {
    const module = await Promise.race([
      runtime.loadRemote<FederatedJourneyModule>(`${manifest.remote.name}/${manifest.remote.exposedModule.slice(2)}`),
      new Promise<never>((_resolve, reject) => {
        timeoutId = setTimeout(() => reject(timeoutMarker), timeoutMs);
      })
    ]);
    if (!module) return { status: 'fallback', reason: 'remote-unavailable' };
    return { status: 'ready', manifest, module };
  } catch (error) {
    return { status: 'fallback', reason: error === timeoutMarker ? 'remote-timeout' : 'remote-unavailable' };
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

/**
 * Creates the browser implementation of the narrow platform contract supplied to remotes.
 * It deliberately exposes device availability rather than browser internals or credentials.
 */
export function createWebCapabilities(adapters: WebCapabilityAdapters = {}): PlatformCapabilities {
  return {
    navigate: adapters.navigate ?? ((path) => {
      window.history.pushState({}, '', path);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }),
    context: { correlationId: crypto.randomUUID(), locale: navigator.language, platform: 'web' },
    telemetry: adapters.telemetry ?? { track: (event) => console.info('portal-event', event.name, event.properties) },
    flags: {},
    notifications: { show: (message) => console.info('portal-notification', message) },
    device: { isAvailable: () => false }
  };
}
