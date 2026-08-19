import fastify, { type FastifyInstance } from "fastify";
import {
  journeyRegistryResponseSchema,
  type JourneyRegistryResponse,
} from "@portal/platform-contracts";
import {
  createConsoleExporter,
  createTelemetry,
  readTraceparent,
  resolveCorrelationId,
  type TelemetryExporter,
} from "@portal/platform-observability";

/** Creates the platform-owned HTTP boundary without embedding individual journeys in service code. */
export function buildJourneyRegistry(
  catalog: JourneyRegistryResponse,
  exporter: TelemetryExporter = createConsoleExporter(),
): FastifyInstance {
  const parsed = journeyRegistryResponseSchema.safeParse(catalog);
  if (!parsed.success) throw new Error("Journey catalog is invalid.");
  const app = fastify({ logger: false });
  app.addHook("onResponse", async (request, reply) => {
    const traceparent = request.headers.traceparent;
    const correlationId = resolveCorrelationId(
      readTraceparent(
        typeof traceparent === "string" ? traceparent : undefined,
      ),
    );
    const platform =
      request.headers["x-portal-platform"] === "webview" ? "webview" : "web";
    const telemetry = createTelemetry(
      { correlationId, locale: "pt-BR", platform },
      exporter,
    );
    const properties = {
      domain: "journey-registry",
      version: "1.0.0",
      route: request.routeOptions.url ?? "/unknown",
      eventNamespace: "journey-registry",
      result: reply.statusCode < 400 ? "success" : "http-failure",
      statusCode: reply.statusCode,
      durationMs: Math.round(reply.elapsedTime),
    };
    telemetry.track({
      kind: "log",
      name: "journey-registry.request.completed",
      properties,
    });
    telemetry.track({
      kind: "metric",
      name: "journey-registry.request.duration",
      properties,
    });
  });
  app.get("/api/journeys", async (_request, reply) =>
    reply.type("application/json; charset=utf-8").send(parsed.data),
  );
  return app;
}
