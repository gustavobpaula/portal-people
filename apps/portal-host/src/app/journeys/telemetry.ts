import type {
  JourneyManifest,
  PlatformCapabilities,
} from "@portal/platform-contracts";

export function trackJourney(
  platform: PlatformCapabilities,
  name: string,
  manifest: JourneyManifest,
  extra: Record<string, string | number | boolean> = {},
) {
  platform.telemetry.track({
    kind: name.includes("duration")
      ? "metric"
      : name.includes("failed")
        ? "error"
        : name.includes("load") || name.includes("retried")
          ? "log"
          : "analytics",
    name,
    properties: {
      domain: manifest.observability.domain,
      version: manifest.version,
      eventNamespace: manifest.observability.eventNamespace,
      route: manifest.route,
      platform: platform.context.platform,
      correlationId: platform.context.correlationId,
      ...extra,
    },
  });
}

export function trackRegistry(
  platform: PlatformCapabilities,
  name: string,
  route: string,
  extra: Record<string, string | number | boolean> = {},
) {
  platform.telemetry.track({
    kind: name.includes("failed") ? "error" : "log",
    name,
    properties: {
      route,
      eventNamespace: "portal-registry",
      platform: platform.context.platform,
      correlationId: platform.context.correlationId,
      ...extra,
    },
  });
}
