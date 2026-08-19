import fastify, { type FastifyInstance } from "fastify";
import {
  journeyRegistryResponseSchema,
  type JourneyRegistryResponse,
} from "@portal/platform-contracts";

/** Creates the platform-owned HTTP boundary without embedding individual journeys in service code. */
export function buildJourneyRegistry(catalog: JourneyRegistryResponse): FastifyInstance {
  const parsed = journeyRegistryResponseSchema.safeParse(catalog);
  if (!parsed.success) throw new Error("Journey catalog is invalid.");
  const app = fastify({ logger: true });
  app.get("/api/journeys", async (_request, reply) => reply.type("application/json; charset=utf-8").send(parsed.data));
  return app;
}
