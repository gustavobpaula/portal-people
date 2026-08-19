import { chromium } from "playwright";
import { createServer } from "vite";
import { includesProject, selectedProjects } from "./verify-projects.mjs";

let remote;
let beneficios;
let ferias;
let host;
let browser;
try {
  const selection = selectedProjects();
  remote = await createServer({
    configFile: "apps/neutral-remote/vite.config.ts",
  });
  beneficios = await createServer({
    configFile: "apps/beneficios/vite.config.ts",
  });
  ferias = await createServer({ configFile: "apps/ferias/vite.config.ts" });
  host = await createServer({ configFile: "apps/portal-host/vite.config.ts" });
  await remote.listen();
  await beneficios.listen();
  await ferias.listen();
  await host.listen();
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
  });
  await page.goto("http://localhost:4200/");
  await page.getByRole("heading", { name: "Portal Pessoas" }).waitFor();
  if (includesProject(selection, "neutral-remote")) {
    await page.goto("http://localhost:4200/foundation/details");
    await page
      .getByRole("heading", { name: "Detalhes da jornada neutra" })
      .waitFor();
    await page.reload();
    await page
      .getByRole("heading", { name: "Detalhes da jornada neutra" })
      .waitFor();
    await page.getByRole("button", { name: "Voltar ao portal" }).click();
    await page.getByRole("heading", { name: "Portal Pessoas" }).waitFor();
  }
  if (includesProject(selection, "beneficios")) {
    await page.getByRole("link", { name: "Benefícios" }).click();
    await page.getByRole("heading", { name: "Meus benefícios" }).waitFor();
    await page.getByRole("link", { name: "Portal Pessoas" }).click();
    await page.getByRole("heading", { name: "Portal Pessoas" }).waitFor();
  }
  await page
    .getByRole("textbox", { name: "Buscar no portal" })
    .fill("PLATAFORMA");
  await page.getByRole("textbox", { name: "Buscar no portal" }).press("Enter");
  await page
    .getByRole("heading", { name: "Resultados para “PLATAFORMA”" })
    .waitFor();
  if (!page.url().endsWith("/?q=PLATAFORMA"))
    throw new Error("A busca não preservou o termo na URL da home.");
  await page.getByRole("link", { name: "Notificações" }).click();
  await page.getByRole("heading", { name: "Notificações" }).waitFor();
  await page.reload();
  await page.getByRole("heading", { name: "Notificações" }).waitFor();
  await page
    .getByRole("button", { name: "Portal atualizado, não lida" })
    .click();
  await page.getByText("Todas as notificações foram lidas").waitFor();
  if (includesProject(selection, "beneficios")) {
    await page.goto("http://localhost:4200/beneficios");
    await page.getByRole("heading", { name: "Meus benefícios" }).waitFor();
    await page.getByRole("link", { name: /Vale-alimentação/ }).click();
    await page.getByRole("heading", { name: "Vale-alimentação" }).waitFor();
    await page.reload();
    await page.getByRole("heading", { name: "Vale-alimentação" }).waitFor();
    await page.getByRole("button", { name: "Voltar aos benefícios" }).click();
    await page.getByRole("heading", { name: "Meus benefícios" }).waitFor();
  }
  if (includesProject(selection, "ferias")) {
    await page.goto("http://localhost:4200/");
    await page.getByRole("link", { name: "Férias" }).click();
    await page.getByRole("heading", { name: "Férias", exact: true }).waitFor();
    await page.getByLabel("Data de início").fill("2026-09-01");
    await page.getByLabel("Quantidade de dias").fill("10");
    await page.getByRole("button", { name: "Revisar solicitação" }).click();
    await page.getByRole("button", { name: "Confirmar solicitação" }).click();
    await page.getByRole("heading", { name: "Solicitação enviada" }).waitFor();
  }

  const mobilePage = await browser.newPage({
    viewport: { width: 390, height: 844 },
  });
  await mobilePage.goto("http://localhost:4200/");
  await mobilePage.getByRole("heading", { name: "Portal Pessoas" }).waitFor();
  await mobilePage.getByRole("textbox", { name: "Buscar no portal" }).focus();
  await mobilePage.keyboard.type("fundação");
  await mobilePage.keyboard.press("Enter");
  await mobilePage
    .getByRole("heading", { name: "Resultados para “fundação”" })
    .waitFor();
  await mobilePage.getByRole("link", { name: "Notificações" }).click();
  await mobilePage.getByRole("heading", { name: "Notificações" }).waitFor();
  await mobilePage
    .getByRole("button", { name: "Portal atualizado, não lida" })
    .press("Enter");
  if (includesProject(selection, "beneficios")) {
    await mobilePage.goto("http://localhost:4200/beneficios");
    await mobilePage
      .getByRole("heading", { name: "Meus benefícios" })
      .waitFor();
    const benefitLink = mobilePage.getByRole("link", {
      name: /Vale-alimentação/,
    });
    await benefitLink.focus();
    await mobilePage.keyboard.press("Enter");
    await mobilePage
      .getByRole("heading", { name: "Vale-alimentação" })
      .waitFor();
  }
  if (includesProject(selection, "ferias")) {
    await mobilePage.goto("http://localhost:4200/ferias");
    await mobilePage
      .getByRole("heading", { name: "Férias", exact: true })
      .waitFor();
    await mobilePage.getByLabel("Data de início").focus();
    let reachedDays = false;
    for (let index = 0; index < 5 && !reachedDays; index += 1) {
      await mobilePage.keyboard.press("Tab");
      reachedDays = await mobilePage
        .getByLabel("Quantidade de dias")
        .evaluate((element) => element === document.activeElement);
    }
    if (!reachedDays) {
      throw new Error(
        "A jornada Férias não oferece navegação por teclado entre os campos.",
      );
    }
  }
  const viewportFits = await mobilePage.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth,
  );
  if (!viewportFits) throw new Error("Uma jornada excede o viewport mobile.");
  await mobilePage.close();
  console.log(
    "Shell compõe remotes e as jornadas funcionam em desktop e mobile.",
  );
} finally {
  await browser?.close();
  await host?.close();
  await ferias?.close();
  await beneficios?.close();
  await remote?.close();
}
