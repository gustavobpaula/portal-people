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
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:4200/foundation/details');
  await page.getByRole('heading', { name: 'Detalhes da jornada neutra' }).waitFor();
  await page.reload();
  await page.getByRole('heading', { name: 'Detalhes da jornada neutra' }).waitFor();
  await page.getByRole('button', { name: 'Voltar ao portal' }).click();
  await page.getByRole('heading', { name: 'Portal Pessoas' }).waitFor();
  await page.getByRole('textbox', { name: 'Buscar no portal' }).fill('PLATAFORMA');
  await page.getByRole('textbox', { name: 'Buscar no portal' }).press('Enter');
  await page.getByRole('heading', { name: 'Resultados para “PLATAFORMA”' }).waitFor();
  if (!page.url().endsWith('/?q=PLATAFORMA')) throw new Error('A busca não preservou o termo na URL da home.');
  await page.getByRole('link', { name: 'Notificações' }).click();
  await page.getByRole('heading', { name: 'Notificações' }).waitFor();
  await page.reload();
  await page.getByRole('heading', { name: 'Notificações' }).waitFor();
  await page.getByRole('button', { name: 'Portal atualizado, não lida' }).click();
  await page.getByText('Todas as notificações foram lidas').waitFor();

  const mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await mobilePage.goto('http://localhost:4200/');
  await mobilePage.getByRole('heading', { name: 'Portal Pessoas' }).waitFor();
  await mobilePage.getByRole('textbox', { name: 'Buscar no portal' }).focus();
  await mobilePage.keyboard.type('fundação');
  await mobilePage.keyboard.press('Enter');
  await mobilePage.getByRole('heading', { name: 'Resultados para “fundação”' }).waitFor();
  await mobilePage.getByRole('link', { name: 'Notificações' }).click();
  await mobilePage.getByRole('heading', { name: 'Notificações' }).waitFor();
  await mobilePage.getByRole('button', { name: 'Portal atualizado, não lida' }).press('Enter');
  await mobilePage.close();
  console.log('Shell compõe remote e a home funciona com Produtos e notificações em desktop e mobile.');
} finally {
  await browser?.close();
  await host?.close();
  await remote?.close();
}
