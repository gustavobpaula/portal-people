import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { portalBffClient } from "./portal-bff";
import { server } from "./mocks/server";

describe("portalBffClient", () => {
  it("queries the catalog case-insensitively through the HTTP contract", async () => {
    const response = await portalBffClient.searchCatalog("PLATAFORMA");
    expect(response.items).toHaveLength(1);
    expect(response.items[0].id).toBe("neutral-journey");
  });

  it("rejects malformed BFF responses without exposing response details", async () => {
    server.use(
      http.get("/api/portal/notifications", () =>
        HttpResponse.json({ items: [{ id: "missing-fields" }] }),
      ),
    );
    await expect(portalBffClient.getNotifications()).rejects.toMatchObject({
      kind: "invalid-response",
    });
  });

  it("normalizes HTTP failures into a safe error type", async () => {
    server.use(
      http.get(
        "/api/portal/catalog",
        () => new HttpResponse(null, { status: 503 }),
      ),
    );
    await expect(portalBffClient.getCatalog()).rejects.toMatchObject({
      kind: "http",
    });
  });
});
