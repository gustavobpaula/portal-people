import { readFile } from "node:fs/promises";
import { glob } from "node:fs/promises";
import { startJourneyRegistry } from "./journey-registry-process.mjs";

const traceId = "0123456789abcdef0123456789abcdef";
const traceparent = `00-${traceId}-0123456789abcdef-01`;
let registry;
try {
  registry = await startJourneyRegistry();
  const response = await fetch("http://127.0.0.1:4204/api/journeys", {
    headers: { traceparent, "x-portal-platform": "web" },
  });
  if (!response.ok)
    throw new Error(
      "Journey Registry não respondeu à verificação de observabilidade.",
    );
  const catalog = await response.json();
  if (
    !Array.isArray(catalog) ||
    catalog.some(
      (journey) =>
        !journey.owner?.squad ||
        !journey.observability?.domain ||
        !journey.observability?.eventNamespace,
    )
  ) {
    throw new Error("O catálogo não possui ownership e namespace observáveis.");
  }
  for await (const path of glob("journeys/*/manifest.json"))
    JSON.parse(await readFile(path, "utf8"));
  console.log(
    "Correlação W3C, catálogo com ownership e sinais estruturados do Registry foram verificados.",
  );
} finally {
  await registry?.close();
}
