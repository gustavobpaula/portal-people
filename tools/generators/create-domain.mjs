import { cp, mkdir, readFile, readdir, rename, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { registerDomain } from '../domain-governance.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const validName = (value) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value ?? '');
export const humanizeName = (name) => name.split('-').map((part) => part[0].toUpperCase() + part.slice(1)).join(' ');
export function parseDomainArguments(args) {
  const option = (name) => {
    const index = args.indexOf(name);
    return index === -1 ? undefined : args[index + 1];
  };
  const name = option('--name');
  return { name, displayName: option('--display-name') ?? (validName(name) ? humanizeName(name) : undefined), port: Number(option('--port') ?? '4300'), dryRun: args.includes('--dry-run') };
}
async function replaceAll(directory, values) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) await replaceAll(path, values);
    else await writeFile(path, Object.entries(values).reduce((text, [key, value]) => text.replaceAll(key, value), await readFile(path, 'utf8')));
  }
}
export async function createDomain({ name, displayName = humanizeName(name), port = 4300, workspaceRoot = process.cwd() }) {
  if (!validName(name)) throw new Error('Use --name com um nome kebab-case, por exemplo: beneficios.');
  if (!displayName?.trim() || !Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Use --display-name não vazio e --port entre 1024 e 65535.');
  const destination = resolve(workspaceRoot, 'apps', name);
  if (existsSync(destination)) throw new Error(`O domínio ${name} já existe.`);
  await mkdir(resolve(workspaceRoot, 'apps'), { recursive: true });
  await cp(resolve(here, 'templates/domain'), destination, { recursive: true });
  await rename(resolve(destination, 'project.json.template'), resolve(destination, 'project.json'));
  await replaceAll(destination, {
    '__DOMAIN_NAME__': name,
    '__DISPLAY_NAME__': displayName,
    '__PORT__': String(port),
    '// @ts-nocheck\n': ''
  });
  const journeyDestination = resolve(workspaceRoot, 'journeys', name);
  await mkdir(journeyDestination, { recursive: true });
  await rename(resolve(destination, 'journey-manifest.json'), resolve(journeyDestination, 'manifest.json'));
  await registerDomain(workspaceRoot, name);
  return destination;
}
async function run() {
  const options = parseDomainArguments(process.argv.slice(2));
  try {
    if (!validName(options.name) || !options.displayName?.trim() || !Number.isInteger(options.port) || options.port < 1024 || options.port > 65535) throw new Error('Use --name kebab-case, --display-name não vazio e --port entre 1024 e 65535.');
    if (options.dryRun) return void console.log(`Validado: apps/${options.name} seria materializado como remote federado na porta ${options.port}.`);
    await createDomain(options);
    console.log(`Domínio ${options.name} criado. Nenhuma configuração interna do shell foi alterada.`);
  } catch (error) { console.error(error instanceof Error ? error.message : 'Não foi possível criar o domínio.'); process.exitCode = 1; }
}
if (process.argv[1] === fileURLToPath(import.meta.url)) await run();
