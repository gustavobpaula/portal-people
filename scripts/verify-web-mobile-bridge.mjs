import { chromium } from "playwright";
import { createServer } from "vite";

const servers = [];
let browser;
try {
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

  const web = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await web.goto("http://localhost:4200/recursos-do-app");
  await web.getByText("Este recurso está disponível apenas no aplicativo.").waitFor();
  await web.getByRole("button", { name: "Voltar ao portal" }).click();
  await web.getByRole("heading", { name: "Portal Pessoas" }).waitFor();

  const webview = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await webview.goto("http://localhost:4200/?platform=webview");
  await webview.getByRole("link", { name: "Recursos do aplicativo" }).click();
  await webview.getByRole("heading", { name: "Recursos do aplicativo aberto" }).waitFor();

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await mobile.goto("http://localhost:4200/?platform=webview");
  await mobile.getByRole("link", { name: "Recursos do aplicativo" }).click();
  await mobile.getByRole("heading", { name: "Recursos do aplicativo aberto" }).waitFor();
  const fitsViewport = await mobile.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
  if (!fitsViewport) throw new Error("A jornada nativa simulada excede o viewport mobile.");
  await mobile.close();
  console.log("Browser, WebView simulada e viewport mobile verificaram native-route.");
} finally {
  await browser?.close();
  await Promise.all(servers.reverse().map((server) => server.close()));
}
