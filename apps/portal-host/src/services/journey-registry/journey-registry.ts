import {
  journeyRegistryResponseSchema,
  type JourneyRegistryResponse,
} from "@portal/platform-contracts";
import type { PlatformContext } from "@portal/platform-contracts";
import { createTelemetry, observeFetch } from "@portal/platform-observability";

/** Provides the shell boundary for the externally resolved journey registry. */
export class JourneyRegistryError extends Error {
  constructor(readonly kind: "http" | "invalid-response" | "network") {
    super("Journey Registry request failed.");
  }
}

export interface JourneyRegistryClient {
  getJourneys(
    signal?: AbortSignal,
    context?: PlatformContext,
  ): Promise<JourneyRegistryResponse>;
}

async function getJourneys(
  signal?: AbortSignal,
  context?: PlatformContext,
): Promise<JourneyRegistryResponse> {
  let response: Response;
  try {
    const init = {
      headers: { Accept: "application/json" },
      signal,
    };
    response = context
      ? await observeFetch(fetch, "/api/journeys", init, {
          telemetry: createTelemetry(context),
          context,
          domain: "journey-registry",
          version: "1.0.0",
          route: "/api/journeys",
          eventNamespace: "journey-registry",
          operation: "journey-registry.fetch",
        })
      : await fetch("/api/journeys", init);
  } catch {
    throw new JourneyRegistryError("network");
  }

  if (!response.ok) throw new JourneyRegistryError("http");

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new JourneyRegistryError("invalid-response");
  }
  const parsed = journeyRegistryResponseSchema.safeParse(body);
  if (!parsed.success) throw new JourneyRegistryError("invalid-response");
  return parsed.data;
}

/** Default HTTP client. Production supplies this endpoint from Journey Registry. */
export const journeyRegistryClient: JourneyRegistryClient = { getJourneys };
