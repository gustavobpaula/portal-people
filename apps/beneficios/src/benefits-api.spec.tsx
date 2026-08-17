import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { BenefitsApiError, createBenefitsApiClient } from "./benefits-api";
import { server } from "./mocks/server";

const httpFetch = (input: RequestInfo | URL, init?: RequestInit) =>
  fetch(new URL(input.toString(), "http://localhost").toString(), init);
const client = createBenefitsApiClient(httpFetch);
const API_BASE_URL = "http://localhost/api/beneficios";

describe("benefitsApiClient", () => {
  it("reads list and detail through the domain HTTP contract", async () => {
    const list = await client.getBenefits();
    const detail = await client.getBenefit("vale-alimentacao");
    expect(list.items).toHaveLength(3);
    expect(list.items[0]).toMatchObject({
      name: "Vale-alimentação",
      status: "active",
    });
    expect(detail).toMatchObject({
      name: "Vale-alimentação",
      usageInstructions: expect.any(String),
    });
  });

  it("maps invalid payloads and HTTP failures to safe error kinds", async () => {
    server.use(
      http.get(API_BASE_URL, () =>
        HttpResponse.json({ items: [{ id: "incomplete" }] }),
      ),
    );
    await expect(client.getBenefits()).rejects.toMatchObject({
      kind: "invalid-response",
    });

    server.use(
      http.get(
        `${API_BASE_URL}/:id`,
        () => new HttpResponse(null, { status: 503 }),
      ),
    );
    await expect(client.getBenefit("vale-alimentacao")).rejects.toMatchObject({
      kind: "http",
    });
  });

  it("maps network and missing-resource failures without exposing transport details", async () => {
    server.use(http.get(API_BASE_URL, () => HttpResponse.error()));
    await expect(client.getBenefits()).rejects.toBeInstanceOf(BenefitsApiError);
    await expect(client.getBenefits()).rejects.toMatchObject({
      kind: "network",
    });

    await expect(client.getBenefit("inexistente")).rejects.toMatchObject({
      kind: "not-found",
    });
  });
});
