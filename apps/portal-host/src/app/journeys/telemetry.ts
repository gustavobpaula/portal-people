import type { JourneyManifest, PlatformCapabilities } from "@portal/platform-contracts";

export function trackJourney(
  platform: PlatformCapabilities,
  name: string,
  manifest: JourneyManifest,
  extra: Record<string, string | number | boolean> = {},
) {
  platform.telemetry.track({
    name,
    properties: {
      domain: manifest.observability.domain,
      version: manifest.version,
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
    name,
    properties: {
      route,
      platform: platform.context.platform,
      correlationId: platform.context.correlationId,
      ...extra,
    },
  });
}
