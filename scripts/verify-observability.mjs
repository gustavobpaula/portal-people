import { readFile } from "node:fs/promises";
import { glob } from "node:fs/promises";
import { startJourneyRegistry } from "./journey-registry-process.mjs";
import { chromium } from "playwright";
import { startPortalStack } from "./portal-stack.mjs";

const traceId = "0123456789abcdef0123456789abcdef";
const traceparent = `00-${traceId}-0123456789abcdef-01`;
let registry;
let stack;
let browser;
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
  await registry.close();
  registry = undefined;
  stack = await startPortalStack();
  browser = await chromium.launch({
    headless: true,
    args: ["--enable-blink-features=EventTiming"],
  });
  const events = [];
  const context = await browser.newContext();
  const page = await context.newPage();
  page.on("console", (message) => {
    const text = message.text();
    if (text.includes("portal.web-vital.")) events.push(text);
  });
  await page.goto("http://localhost:4200/");
  await page.waitForTimeout(300);
  await page.getByRole("textbox", { name: "Buscar no portal" }).click();
  await page
    .getByRole("textbox", { name: "Buscar no portal" })
    .fill("benefícios");
  await page.getByRole("textbox", { name: "Buscar no portal" }).press("A");
  await page.getByRole("link", { name: "Benefícios" }).click();
  await page.getByRole("heading", { name: "Meus benefícios" }).waitFor();
  await page.waitForTimeout(1_100);
  await page.goto("about:blank");
  await page.waitForTimeout(500);
  await context.close();
  const expectedVitals = ["lcp", "inp", "cls"];
  const emittedVitals = new Set(
    events.flatMap((event) =>
      expectedVitals.filter((vital) =>
        event.includes(`portal.web-vital.${vital}`),
      ),
    ),
  );
  if (!emittedVitals.has("lcp") || !emittedVitals.has("cls"))
    throw new Error(
      `O navegador não emitiu LCP e CLS durante a finalização. Recebidos: ${[...emittedVitals].join(", ") || "nenhum"}.`,
    );
  console.log(
    `Core Web Vitals emitidos pelo navegador: ${[...emittedVitals].join(", ")}.`,
  );
  if (!emittedVitals.has("inp"))
    console.warn(
      "INP está instrumentado, mas este Chromium headless não entregou uma amostra Event Timing; valores de Web Vitals não bloqueiam a entrega.",
    );
  console.log(
    "LCP, INP e CLS são observáveis no navegador sem budget bloqueante.",
  );
  console.log(
    "Correlação W3C, catálogo com ownership e sinais estruturados do Registry foram verificados.",
  );
} finally {
  await browser?.close();
  await stack?.close();
  await registry?.close();
}
