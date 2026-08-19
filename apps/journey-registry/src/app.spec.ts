import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { buildJourneyRegistry } from "./app";
import { loadJourneyCatalog } from "./catalog";

const sourceCatalog = resolve(process.cwd(), "journeys");

describe("Journey Registry", () => {
  it("publishes the owned declarations through a typed HTTP endpoint", async () => {
    const app = buildJourneyRegistry(await loadJourneyCatalog(sourceCatalog));
    const response = await app.inject({ method: "GET", url: "/api/journeys" });
    await app.close();

    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toContain("application/json");
    expect(response.json().map((journey: { id: string }) => journey.id)).toEqual([
      "beneficios", "ferias", "holerite-legado", "neutral-journey", "recursos-do-app",
    ]);
  });

  it("does not expose unknown paths", async () => {
    const app = buildJourneyRegistry(await loadJourneyCatalog(sourceCatalog));
    const response = await app.inject({ method: "GET", url: "/unknown" });
    await app.close();
    expect(response.statusCode).toBe(404);
  });

  it("rejects an invalid or incorrectly owned declaration before publishing", async () => {
    const directory = await mkdtemp(join(tmpdir(), "journey-registry-"));
    await mkdir(join(directory, "wrong-owner"));
    await writeFile(join(directory, "wrong-owner", "manifest.json"), JSON.stringify({
      id: "beneficios", route: "/beneficios", strategy: "federated-module", version: "1.0.0",
      platformCompatibility: "^1.0.0", owner: { squad: "Squad", contact: "squad@example.test" },
      observability: { domain: "beneficios", eventNamespace: "beneficios" },
      remote: { name: "beneficios", entry: "http://localhost:4300/mf-manifest.json", exposedModule: "./Journey" },
    }));
    await expect(loadJourneyCatalog(directory)).rejects.toThrow("directory must match");
  });
});
