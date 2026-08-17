import { chromium } from 'playwright';
import { createServer } from 'vite';

let remote;
let host;
let browser;
try {
  remote = await createServer({ configFile: 'apps/neutral-remote/vite.config.ts' });
  host = await createServer({ configFile: 'apps/portal-host/vite.config.ts' });
  await remote.listen();
  await host.listen();
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:4200/foundation/details');
  await page.getByRole('heading', { name: 'Detalhes da jornada neutra' }).waitFor();
  await page.reload();
  await page.getByRole('heading', { name: 'Detalhes da jornada neutra' }).waitFor();
  await page.getByRole('button', { name: 'Voltar ao portal' }).click();
  await page.getByRole('heading', { name: 'Portal Pessoas' }).waitFor();
  console.log('Shell compõe remote, preserva rota direta e navega pelo contrato da plataforma.');
} finally {
  await browser?.close();
  await host?.close();
  await remote?.close();
}
