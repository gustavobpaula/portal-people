import AxeBuilder from "@axe-core/playwright";
import { chromium } from "playwright";
import { startPortalStack } from "./portal-stack.mjs";
import { includesProject, selectedProjects } from "./verify-projects.mjs";

function formatViolations(violations) {
  return violations
    .flatMap((violation) =>
      violation.nodes.map(
        (node) =>
          `${violation.id}: ${violation.help} (${node.target.join(", ")})`,
      ),
    )
    .join("\n");
}

async function assertAccessible(page, label) {
  const result = await new AxeBuilder({ page }).analyze();
  if (result.violations.length)
    throw new Error(`${label}\n${formatViolations(result.violations)}`);
}

let stack;
let browser;
try {
  const selection = selectedProjects();
  stack = await startPortalStack();
  browser = await chromium.launch({ headless: true });
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 390, height: 844 },
  ]) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    await page.goto("http://localhost:4200/");
    await page.getByRole("heading", { name: "Portal Pessoas" }).waitFor();
    await assertAccessible(page, `Home ${viewport.width}`);
    await page
      .getByRole("textbox", { name: "Buscar no portal" })
      .fill("plataforma");
    await page
      .getByRole("textbox", { name: "Buscar no portal" })
      .press("Enter");
    await assertAccessible(page, `Busca ${viewport.width}`);
    await page.getByRole("link", { name: "Notificações" }).click();
    await assertAccessible(page, `Notificações ${viewport.width}`);
    if (includesProject(selection, "neutral-remote")) {
      await page.goto("http://localhost:4200/foundation");
      await page
        .getByRole("heading", { name: "Remote neutro carregado em runtime" })
        .waitFor();
      await assertAccessible(page, `Fundação ${viewport.width}`);
      await page.getByRole("link", { name: "Ver detalhes da jornada" }).click();
      await assertAccessible(page, `Detalhe fundação ${viewport.width}`);
    }
    if (includesProject(selection, "beneficios")) {
      await page.goto("http://localhost:4200/beneficios");
      await page.getByRole("heading", { name: "Meus benefícios" }).waitFor();
      await assertAccessible(page, `Benefícios ${viewport.width}`);
      await page.getByRole("link", { name: /Vale-alimentação/ }).click();
      await assertAccessible(page, `Detalhe benefício ${viewport.width}`);
    }
    if (includesProject(selection, "ferias")) {
      await page.goto("http://localhost:4200/ferias");
      await page.getByLabel("Data de início").fill("2026-09-01");
      await page.getByLabel("Quantidade de dias").fill("10");
      await assertAccessible(page, `Férias formulário ${viewport.width}`);
      await page.getByRole("button", { name: "Revisar solicitação" }).click();
      await assertAccessible(page, `Férias revisão ${viewport.width}`);
      await page.getByRole("button", { name: "Confirmar solicitação" }).click();
      await assertAccessible(page, `Férias confirmação ${viewport.width}`);
    }
    if (selection.size === 0) {
      if (viewport.width > 400) {
        await page.goto(
          "http://localhost:4500/holerite?returnTo=http%3A%2F%2Flocalhost%3A4200%2Fretorno%2Fholerite-legado",
        );
        await page
          .getByRole("heading", { name: "Holerite", exact: true })
          .waitFor();
        await assertAccessible(page, `Legado ${viewport.width}`);
        await page
          .getByRole("link", { name: "Voltar ao Portal Pessoas" })
          .click();
        await stack.externalWeb.close();
        await page.goto("http://localhost:4200/holerite");
        await page
          .getByText("A jornada está temporariamente indisponível.")
          .waitFor();
        await assertAccessible(page, "Legado indisponível");
      } else {
        await page.goto("http://localhost:4200/holerite");
        await page
          .getByText("A jornada está temporariamente indisponível.")
          .waitFor();
        await assertAccessible(page, "Legado indisponível mobile");
      }
      await page.goto("http://localhost:4200/");
      await page.getByRole("link", { name: "Recursos do aplicativo" }).click();
      await page
        .getByText("Este recurso está disponível apenas no aplicativo.")
        .waitFor();
      await assertAccessible(page, `Fallback web ${viewport.width}`);
      await page.goto("http://localhost:4200/?platform=webview");
      await page.getByRole("link", { name: "Recursos do aplicativo" }).click();
      await page
        .getByText("O aplicativo recebeu a navegação solicitada.")
        .waitFor();
      await assertAccessible(page, `WebView ${viewport.width}`);
    }
    await context.close();
  }
  console.log(
    "Fluxos críticos desktop e mobile não apresentaram violações Axe.",
  );
} finally {
  await browser?.close();
  await stack?.close();
}
