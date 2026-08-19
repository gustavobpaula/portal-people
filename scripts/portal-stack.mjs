import { createServer } from "vite";
import { startExternalWebServer } from "../tools/external-web-demo/server.mjs";
import { startJourneyRegistry } from "./journey-registry-process.mjs";

const VITE_CONFIGS = [
  "apps/neutral-remote/vite.config.ts",
  "apps/beneficios/vite.config.ts",
  "apps/ferias/vite.config.ts",
  "apps/portal-host/vite.config.ts",
];

/** Starts the complete local portal and always releases only resources it owns. */
export async function startPortalStack({
  external = true,
  registry = true,
} = {}) {
  const closers = [];
  let closed = false;
  const close = async () => {
    if (closed) return;
    closed = true;
    await Promise.allSettled(closers.reverse().map((closer) => closer()));
  };

  try {
    const externalWeb = external ? await startExternalWebServer() : undefined;
    if (externalWeb) closers.push(() => externalWeb.close());
    const journeyRegistry = registry ? await startJourneyRegistry() : undefined;
    if (journeyRegistry) closers.push(() => journeyRegistry.close());
    const servers = [];
    for (const configFile of VITE_CONFIGS) {
      const server = await createServer({ configFile });
      servers.push(server);
      await server.listen();
      closers.push(() => server.close());
    }
    return { servers, externalWeb, registry: journeyRegistry, close };
  } catch (error) {
    await close();
    throw error;
  }
}

export function closeOnSignal(stack) {
  const stop = async () => {
    await stack.close();
    process.exit(0);
  };
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);
}
