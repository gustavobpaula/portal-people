import { createServer } from "vite";
import { startExternalWebServer } from "../tools/external-web-demo/server.mjs";
import { startJourneyRegistry } from "./journey-registry-process.mjs";

const externalWeb = await startExternalWebServer();
const registry = await startJourneyRegistry();
const servers = await Promise.all([
  createServer({ configFile: "apps/neutral-remote/vite.config.ts" }),
  createServer({ configFile: "apps/beneficios/vite.config.ts" }),
  createServer({ configFile: "apps/ferias/vite.config.ts" }),
  createServer({ configFile: "apps/portal-host/vite.config.ts", mode: "integrated" }),
]);
await Promise.all(servers.map((server) => server.listen()));

console.log("Portal Pessoas: http://localhost:4200");
console.log("Holerite legado: abra o portal e selecione ‘Holerite legado’.");
console.log("Falha externa demonstrável: http://localhost:4500/indisponivel");

const stop = async () => {
  await Promise.all(servers.map((server) => server.close()));
  await registry.close();
  await externalWeb.close();
  process.exit(0);
};
process.once("SIGINT", stop);
process.once("SIGTERM", stop);
