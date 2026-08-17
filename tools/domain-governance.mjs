import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const validDomainName = (value) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value ?? '');

export function normalizeDomains(domains) {
  if (!Array.isArray(domains) || domains.some((domain) => !validDomainName(domain))) {
    throw new Error('O catálogo de governança deve conter apenas nomes de domínio em kebab-case.');
  }
  return [...new Set(domains)].sort();
}

export function createDomainConstraints(domains) {
  return normalizeDomains(domains).map((domain) => ({
    allSourceTags: ['scope:domain', `domain:${domain}`],
    onlyDependOnLibsWithTags: [`domain:${domain}`, 'scope:platform', 'scope:design-system']
  }));
}

export async function readDomainGovernance(path) {
  try {
    const catalog = JSON.parse(await readFile(path, 'utf8'));
    return normalizeDomains(catalog.domains);
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') return [];
    throw error;
  }
}

export async function registerDomain(workspaceRoot, domain) {
  const catalogPath = resolve(workspaceRoot, 'tools/domain-governance.json');
  const domains = normalizeDomains([...(await readDomainGovernance(catalogPath)), domain]);
  await mkdir(dirname(catalogPath), { recursive: true });
  await writeFile(catalogPath, `${JSON.stringify({ domains }, null, 2)}\n`);
  return domains;
}
