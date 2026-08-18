import { describe, expect, it, vi } from "vitest";
import { isExternalJourneyAvailable } from "./external-availability";

describe("isExternalJourneyAvailable", () => {
  it("checks the fixed health endpoint at the external origin", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, { status: 204 }),
    );

    await expect(
      isExternalJourneyAvailable("http://localhost:4500/holerite?ignored=true"),
    ).resolves.toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:4500/health",
      expect.objectContaining({ headers: { Accept: "application/json" } }),
    );
    fetchMock.mockRestore();
  });

  it("treats a network failure as unavailable", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error());

    await expect(
      isExternalJourneyAvailable("http://localhost:4500/holerite"),
    ).resolves.toBe(false);
    fetchMock.mockRestore();
  });
});
