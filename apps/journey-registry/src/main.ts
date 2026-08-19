import { buildJourneyRegistry } from "./app";
import { loadJourneyCatalog } from "./catalog";

const port = Number(process.env.JOURNEY_REGISTRY_PORT ?? "4204");
const catalog = await loadJourneyCatalog();
const app = buildJourneyRegistry(catalog);
await app.listen({ port, host: "127.0.0.1" });

const close = async () => {
  await app.close();
  process.exit(0);
};
process.once("SIGINT", close);
process.once("SIGTERM", close);
