import type { PlatformCapabilities } from "@portal/platform-contracts";
import { observeFetch } from "@portal/platform-observability";

const EXTERNAL_HEALTH_TIMEOUT_MS = 2_000;

/** Checks an external journey before the browser leaves the Portal shell. */
export async function isExternalJourneyAvailable(
  destination: string,
  platform?: PlatformCapabilities,
) {
  const healthUrl = new URL("/health", destination).toString();
  const controller = new AbortController();
  const timeout = window.setTimeout(
    () => controller.abort(),
    EXTERNAL_HEALTH_TIMEOUT_MS,
  );

  try {
    const request = {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    };
    const response = platform
      ? await observeFetch(fetch, healthUrl, request, {
          telemetry: platform.telemetry,
          context: platform.context,
          domain: "external-web",
          version: "1.0.0",
          route: "/holerite",
          eventNamespace: "external-web",
          operation: "external.health",
        })
      : await fetch(healthUrl, request);
    return response.ok;
  } catch {
    return false;
  } finally {
    window.clearTimeout(timeout);
  }
}
