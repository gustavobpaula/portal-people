import {
  getInstance,
  type ModuleFederation,
} from "@module-federation/runtime";
import {
  PLATFORM_CONTRACT_VERSION,
  journeyRouteSchema,
  journeyManifestSchema,
  type FederatedJourneyModule,
  type JourneyManifest,
  type PlatformCapabilities,
} from "@portal/platform-contracts";
import {
  createConsoleExporter,
  createCorrelationId,
  createTelemetry,
  type TelemetryExporter,
} from "@portal/platform-observability";

/** Returns the federation instance initialized by the host build plugin. */
function getHostRuntime() {
  const runtime = getInstance((instance) => instance.name === "portal-host");
  if (!runtime)
    throw new Error("Portal host federation runtime is unavailable.");
  return runtime;
}

/** Result boundary used by the host to distinguish a loadable journey from a safe fallback state. */
export type JourneyLoadResult =
  | {
      status: "ready";
      manifest: Extract<JourneyManifest, { strategy: "federated-module" }>;
      module: FederatedJourneyModule;
    }
  | {
      status: "fallback";
      reason:
        | "invalid-manifest"
        | "incompatible-contract"
        | "remote-timeout"
        | "remote-unavailable";
    };

export type JourneyRegistryResolution = Readonly<{
  journeys: JourneyManifest[];
  rejected: Array<{
    index: number;
    reason: "invalid-manifest" | "invalid-registry";
    route?: string;
  }>;
}>;

export type ExternalJourneyPreparation =
  | {
      status: "ready";
      manifest: Extract<JourneyManifest, { strategy: "external-web" }>;
      destination: string;
    }
  | {
      status: "fallback";
      reason:
        | "invalid-manifest"
        | "incompatible-contract"
        | "external-origin-not-allowed"
        | "invalid-return-route";
    };

export type WebCapabilityAdapters = Readonly<{
  navigate?: PlatformCapabilities["navigate"];
  telemetry?: PlatformCapabilities["telemetry"];
  platform?: PlatformCapabilities["context"]["platform"];
  device?: PlatformCapabilities["device"];
  context?: PlatformCapabilities["context"];
  telemetryExporter?: TelemetryExporter;
}>;

export function createPlatformContext(
  platform: PlatformCapabilities["context"]["platform"] = "web",
): PlatformCapabilities["context"] {
  return {
    correlationId: createCorrelationId(),
    locale: navigator.language,
    platform,
  };
}

/**
 * Checks whether the manifest's platform contract major version is supported.
 * Compatibility is intentionally limited to the major version in this foundation.
 */
export function isCompatible(
  required: string,
  actual = PLATFORM_CONTRACT_VERSION,
): boolean {
  const major = (value: string) => value.replace(/^[~^]/, "").split(".")[0];
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
export function resolveJourneyRegistry(
  value: unknown,
): JourneyRegistryResolution {
  if (!Array.isArray(value)) {
    return {
      journeys: [],
      rejected: [{ index: -1, reason: "invalid-registry" }],
    };
  }

  const journeys: JourneyManifest[] = [];
  const rejected: JourneyRegistryResolution["rejected"] = [];
  value.forEach((entry, index) => {
    const manifest = resolveManifest(entry);
    if (manifest) journeys.push(manifest);
    else {
      const route =
        typeof entry === "object" && entry !== null
          ? journeyRouteSchema.safeParse((entry as { route?: unknown }).route)
          : null;
      rejected.push({
        index,
        reason: "invalid-manifest",
        ...(route?.success ? { route: route.data } : {}),
      });
    }
  });
  return { journeys, rejected };
}

/**
 * Builds the only URL allowed for an external handoff. The shell owns the
 * allowlist and the fixed portal return route; neither comes from browser input.
 */
export function prepareExternalJourney(
  value: unknown,
  allowedOrigins: readonly string[],
  portalOrigin: string,
): ExternalJourneyPreparation {
  const manifest = resolveManifest(value);
  if (!manifest || manifest.strategy !== "external-web")
    return { status: "fallback", reason: "invalid-manifest" };
  if (!isCompatible(manifest.platformCompatibility))
    return { status: "fallback", reason: "incompatible-contract" };

  let destination: URL;
  let returnUrl: URL;
  try {
    destination = new URL(manifest.destination);
    returnUrl = new URL(manifest.returnRoute, portalOrigin);
  } catch {
    return { status: "fallback", reason: "invalid-return-route" };
  }
  if (returnUrl.origin !== portalOrigin)
    return { status: "fallback", reason: "invalid-return-route" };
  if (!allowedOrigins.includes(destination.origin))
    return { status: "fallback", reason: "external-origin-not-allowed" };
  destination.search = "";
  destination.hash = "";
  destination.searchParams.set("returnTo", returnUrl.toString());
  return { status: "ready", manifest, destination: destination.toString() };
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
  runtime?: Pick<ModuleFederation, "loadRemote" | "registerRemotes">,
  timeoutMs = 5_000,
): Promise<JourneyLoadResult> {
  const manifest = resolveManifest(value);
  if (!manifest || manifest.strategy !== "federated-module")
    return { status: "fallback", reason: "invalid-manifest" };
  if (!isCompatible(manifest.platformCompatibility))
    return { status: "fallback", reason: "incompatible-contract" };

  const timeoutMarker = Symbol("remote-timeout");
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  try {
    const activeRuntime = runtime ?? getHostRuntime();
    activeRuntime.registerRemotes([
      { name: manifest.remote.name, entry: manifest.remote.entry },
    ]);
    const module = await Promise.race([
      activeRuntime.loadRemote<FederatedJourneyModule>(
        `${manifest.remote.name}/${manifest.remote.exposedModule.slice(2)}`,
      ),
      new Promise<never>((_resolve, reject) => {
        timeoutId = setTimeout(() => reject(timeoutMarker), timeoutMs);
      }),
    ]);
    if (!module) return { status: "fallback", reason: "remote-unavailable" };
    return { status: "ready", manifest, module };
  } catch (error) {
    return {
      status: "fallback",
      reason: error === timeoutMarker ? "remote-timeout" : "remote-unavailable",
    };
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

/**
 * Creates the browser implementation of the narrow platform contract supplied to remotes.
 * It deliberately exposes device availability rather than browser internals or credentials.
 */
export function createPlatformCapabilities(
  adapters: WebCapabilityAdapters = {},
): PlatformCapabilities {
  const context =
    adapters.context ?? createPlatformContext(adapters.platform ?? "web");
  return {
    navigate:
      adapters.navigate ??
      ((path) => {
        window.history.pushState({}, "", path);
        window.dispatchEvent(new PopStateEvent("popstate"));
      }),
    context,
    telemetry:
      adapters.telemetry ??
      createTelemetry(
        context,
        adapters.telemetryExporter ?? createConsoleExporter(),
      ),
    flags: {},
    notifications: {
      show: (message) => console.info("portal-notification", message),
    },
    device: adapters.device ?? { isAvailable: () => false },
  };
}

/** Backwards-compatible browser capability factory. */
export function createWebCapabilities(
  adapters: Omit<WebCapabilityAdapters, "platform"> = {},
): PlatformCapabilities {
  return createPlatformCapabilities({ ...adapters, platform: "web" });
}
