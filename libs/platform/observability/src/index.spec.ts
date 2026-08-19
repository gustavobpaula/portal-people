import { describe, expect, it, vi } from "vitest";
import {
  createCorrelationId,
  createTelemetry,
  createTraceparent,
  observeFetch,
  readTraceparent,
} from "./index";

const context = {
  correlationId: "0123456789abcdef0123456789abcdef",
  locale: "pt-BR",
  platform: "web" as const,
};
const properties = {
  domain: "portal",
  version: "1.0.0",
  route: "/",
  eventNamespace: "portal",
};

describe("platform observability", () => {
  it("creates valid correlated W3C headers with distinct spans", () => {
    expect(createCorrelationId()).toMatch(/^[0-9a-f]{32}$/);
    const first = createTraceparent(context.correlationId);
    const second = createTraceparent(context.correlationId);
    expect(readTraceparent(first)).toBe(context.correlationId);
    expect(first).not.toBe(second);
    expect(readTraceparent("invalid")).toBeNull();
  });
  it("normalizes all signal kinds and removes unsafe data", () => {
    const exporter = { export: vi.fn() };
    const telemetry = createTelemetry(
      context,
      exporter,
      () => new Date("2026-01-01T00:00:00.000Z"),
    );
    for (const kind of ["log", "error", "metric", "analytics"] as const)
      telemetry.track({
        kind,
        name: "portal.operation",
        properties: {
          ...properties,
          result: "success",
          token: "private",
          search: "joana",
        },
      });
    expect(exporter.export).toHaveBeenCalledTimes(4);
    expect(JSON.stringify(exporter.export.mock.calls)).not.toMatch(
      /private|joana|token|search/,
    );
  });
  it("isolates synchronous and asynchronous exporter failures", async () => {
    expect(() =>
      createTelemetry(context, {
        export: () => {
          throw new Error("offline");
        },
      }).track({ name: "portal.operation", properties }),
    ).not.toThrow();
    expect(() =>
      createTelemetry(context, {
        export: async () => {
          throw new Error("offline");
        },
      }).track({ name: "portal.operation", properties }),
    ).not.toThrow();
    await Promise.resolve();
  });
  it("propagates trace context and records only HTTP outcome timing", async () => {
    const telemetry = { track: vi.fn() };
    const fetcher = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 200 }));
    await observeFetch(fetcher, "/api/test", undefined, {
      telemetry,
      context,
      ...properties,
      operation: "portal.api",
    });
    const headers = new Headers(fetcher.mock.calls[0][1].headers);
    expect(readTraceparent(headers.get("traceparent"))).toBe(
      context.correlationId,
    );
    expect(headers.get("x-portal-platform")).toBe("web");
    expect(telemetry.track).toHaveBeenCalledWith(
      expect.objectContaining({ kind: "metric", name: "portal.api.duration" }),
    );
  });
});
