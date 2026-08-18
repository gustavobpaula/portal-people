import { describe, expect, it, vi } from "vitest";
import { journeyRegistryClient, JourneyRegistryError } from "./journey-registry";

describe("journeyRegistryClient", () => {
  it("requests the externally resolved catalog", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify([{ id: "beneficios" }]), { status: 200 }),
    );

    await expect(journeyRegistryClient.getJourneys()).resolves.toEqual([
      { id: "beneficios" },
    ]);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/journeys",
      expect.objectContaining({ headers: { Accept: "application/json" } }),
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
