import { describe, expect, it, vi } from "vitest";
import { journeyRegistryClient, JourneyRegistryError } from "./journey-registry";
import registry from "../../assets/journey-registry.json";

describe("journeyRegistryClient", () => {
  it("requests the externally resolved catalog", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(registry), { status: 200 }),
    );

    await expect(journeyRegistryClient.getJourneys()).resolves.toEqual(registry);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/journeys",
      expect.objectContaining({ headers: { Accept: "application/json" } }),
    );
    fetchMock.mockRestore();
  });

  it("rejects an invalid registry response atomically", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify([{ id: "beneficios" }]), { status: 200 }),
    );
    await expect(journeyRegistryClient.getJourneys()).rejects.toEqual(
      expect.objectContaining<Partial<JourneyRegistryError>>({ kind: "invalid-response" }),
    );
    fetchMock.mockRestore();
  });

  it("maps an unavailable registry to a safe error", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, { status: 503 }),
    );

    await expect(journeyRegistryClient.getJourneys()).rejects.toEqual(
      expect.objectContaining<Partial<JourneyRegistryError>>({ kind: "http" }),
    );
    fetchMock.mockRestore();
  });
});
