import {
  journeyRegistryResponseSchema,
  type JourneyRegistryResponse,
} from "@portal/platform-contracts";

/** Provides the shell boundary for the externally resolved journey registry. */
export class JourneyRegistryError extends Error {
  constructor(readonly kind: "http" | "invalid-response" | "network") {
    super("Journey Registry request failed.");
  }
}

export interface JourneyRegistryClient {
  getJourneys(signal?: AbortSignal): Promise<JourneyRegistryResponse>;
}

async function getJourneys(
  signal?: AbortSignal,
): Promise<JourneyRegistryResponse> {
  let response: Response;
  try {
    response = await fetch("/api/journeys", {
      headers: { Accept: "application/json" },
      signal,
    });
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
