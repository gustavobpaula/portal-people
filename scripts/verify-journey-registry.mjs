import { chromium } from "playwright";
import { createServer } from "vite";
import { startJourneyRegistry } from "./journey-registry-process.mjs";

const servers = [];
let registry;
let browser;
try {
  registry = await startJourneyRegistry();
  const directResponse = await fetch("http://127.0.0.1:4204/api/journeys");
  const directCatalog = await directResponse.json();
  if (!directResponse.ok || !["beneficios", "ferias", "holerite-legado", "recursos-do-app"].every((id) => directCatalog.some((journey) => journey.id === id))) {
    throw new Error("Journey Registry não publicou o catálogo demonstrativo.");
  }
  for (const configFile of [
    "apps/neutral-remote/vite.config.ts",
    "apps/beneficios/vite.config.ts",
    "apps/ferias/vite.config.ts",
  ]) {
    const server = await createServer({ configFile });
    servers.push(server);
    await server.listen();
  }
  const host = await createServer({ configFile: "apps/portal-host/vite.config.ts", mode: "integrated" });
  servers.push(host);
  await host.listen();
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const registryResponse = page.waitForResponse((response) => response.url().includes("/api/journeys") && response.status() === 200);
  await page.goto("http://localhost:4200/");
  await registryResponse;
  await page.getByRole("link", { name: "Benefícios" }).click();
  await page.getByRole("heading", { name: "Meus benefícios" }).waitFor();

  await registry.close();
  registry = undefined;
  await page.goto("http://localhost:4200/");
  await page.getByRole("alert").filter({ hasText: "Não foi possível atualizar as jornadas" }).waitFor();
  await page.getByRole("link", { name: "Férias" }).click();
  await page.getByRole("heading", { name: "Férias", exact: true }).waitFor();

  registry = await startJourneyRegistry();
  await page.getByRole("button", { name: "Tentar novamente" }).click();
  await page.getByText("Não foi possível atualizar as jornadas").waitFor({ state: "detached" });
  console.log("Journey Registry HTTP, fallback seguro e recuperação foram verificados.");
} finally {
  await browser?.close();
  await Promise.all(servers.reverse().map((server) => server.close()));
  await registry?.close();
}
