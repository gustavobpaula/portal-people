import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { VacationsApiError, createVacationsApiClient } from "./vacations-api";
import { server } from "../../mocks/server";

const API_BASE_URL = "http://localhost/api/vacations";
const httpFetch = (input: RequestInfo | URL, init?: RequestInit) =>
  fetch(new URL(input.toString(), "http://localhost").toString(), init);
const client = createVacationsApiClient(httpFetch);

describe("vacationsApiClient", () => {
  it("reads eligibility and submits a valid calendar-day request", async () => {
    await expect(client.getEligibility()).resolves.toMatchObject({
      status: "available",
      availableDays: 20,
    });
    await expect(
      client.submitRequest({ startDate: "2026-09-01", days: 10 }),
    ).resolves.toMatchObject({
      endDate: "2026-09-10",
      protocol: "FERIAS-2026-0001",
      status: "submitted",
    });
  });

  it("maps authoritative validation, invalid payloads, HTTP, and network failures", async () => {
    await expect(
      client.submitRequest({ startDate: "2026-02-30", days: 1 }),
    ).rejects.toMatchObject({ kind: "validation" });
    await expect(
      client.submitRequest({ startDate: "2027-08-31", days: 2 }),
    ).rejects.toMatchObject({ kind: "validation" });
    server.use(
      http.get(`${API_BASE_URL}/eligibility`, () =>
        HttpResponse.json({ status: "available" }),
      ),
    );
    await expect(client.getEligibility()).rejects.toMatchObject({
      kind: "invalid-response",
    });
    server.use(
      http.post(
        `${API_BASE_URL}/requests`,
        () => new HttpResponse(null, { status: 503 }),
      ),
    );
    await expect(
      client.submitRequest({ startDate: "2026-09-01", days: 1 }),
    ).rejects.toMatchObject({ kind: "http" });
    server.use(
      http.get(`${API_BASE_URL}/eligibility`, () => HttpResponse.error()),
    );
    await expect(client.getEligibility()).rejects.toBeInstanceOf(
      VacationsApiError,
    );
    await expect(client.getEligibility()).rejects.toMatchObject({
      kind: "network",
    });
  });
});
