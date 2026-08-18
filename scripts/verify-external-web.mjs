import { chromium } from "playwright";
import { createServer } from "vite";
import { startExternalWebServer } from "../tools/external-web-demo/server.mjs";

let externalWeb;
let browser;
const servers = [];

try {
  externalWeb = await startExternalWebServer();
  for (const configFile of [
    "apps/neutral-remote/vite.config.ts",
    "apps/beneficios/vite.config.ts",
    "apps/ferias/vite.config.ts",
    "apps/portal-host/vite.config.ts",
  ]) {
    const server = await createServer({ configFile });
    servers.push(server);
    await server.listen();
  }

  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto("http://localhost:4200/");
  await page.getByRole("link", { name: "Holerite legado" }).click();
  await page.waitForURL(/localhost:4500\/holerite/);
  await page.getByRole("heading", { name: "Holerite", exact: true }).waitFor();
  await page.getByText("Agosto de 2026").waitFor();

  const handoffUrl = new URL(page.url());
  if (handoffUrl.origin !== "http://localhost:4500") {
    throw new Error("Holerite legado não abriu em uma origem externa.");
  }
  if (
    handoffUrl.searchParams.size !== 1 ||
    handoffUrl.searchParams.get("returnTo") !==
      "http://localhost:4200/retorno/holerite-legado"
  ) {
    throw new Error("A transição externa não preservou somente o retorno autorizado.");
  }
  if (/token|matricula|matr%C3%ADcula|candidate|rollout|percentage/i.test(page.url())) {
    throw new Error("A transição externa expôs dados ou controles indevidos na URL.");
  }

  await page.getByRole("link", { name: "Voltar ao Portal Pessoas" }).click();
  await page.getByRole("heading", { name: "Portal Pessoas" }).waitFor();

  await page.getByRole("link", { name: "Benefícios" }).click();
  await page.getByRole("heading", { name: "Meus benefícios" }).waitFor();
  await page.goto("http://localhost:4200/ferias");
  await page.getByRole("heading", { name: "Férias", exact: true }).waitFor();

  await page.goto(
    "http://localhost:4500/indisponivel?returnTo=http%3A%2F%2Flocalhost%3A4200%2Fretorno%2Fholerite-legado",
  );
  await page
    .getByText("O sistema legado está temporariamente indisponível.")
    .waitFor();
  await page.getByRole("link", { name: "Voltar ao Portal Pessoas" }).click();
  await page.getByRole("heading", { name: "Portal Pessoas" }).waitFor();

  await externalWeb.close();
  externalWeb = undefined;
  await page.getByRole("link", { name: "Holerite legado" }).click();
  await page
    .getByText("A jornada está temporariamente indisponível.")
    .waitFor();
  if (new URL(page.url()).origin !== "http://localhost:4200") {
    throw new Error("A indisponibilidade do legado removeu o usuário do shell.");
  }
  await page.getByRole("button", { name: "Voltar ao portal" }).click();
  await page.getByRole("heading", { name: "Portal Pessoas" }).waitFor();

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await mobile.goto("http://localhost:4200/holerite");
  await mobile
    .getByText("A jornada está temporariamente indisponível.")
    .waitFor();
  const fitsViewport = await mobile.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth,
  );
  if (!fitsViewport) throw new Error("Fallback de Holerite excede o viewport mobile.");
  await mobile.close();

  console.log(
    "external-web, retorno seguro, indisponibilidade e não regressão de Benefícios/Férias verificados.",
  );
} finally {
  await browser?.close();
  await Promise.all(servers.reverse().map((server) => server.close()));
  await externalWeb?.close();
}
