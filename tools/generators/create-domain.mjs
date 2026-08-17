import { cp, mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Golden path CLI that validates a domain name and materializes the controlled domain template.
 * It intentionally never changes the shell's internal configuration.
 */
const args = process.argv.slice(2);
const name = args[args.indexOf('--name') + 1];
const dryRun = args.includes('--dry-run');

if (!name || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name)) {
  console.error('Use --name com um nome kebab-case, por exemplo: beneficios.');
  process.exitCode = 1;
} else {
  const destination = resolve('apps', name);
  if (existsSync(destination)) {
    console.error(`O domínio ${name} já existe.`);
    process.exitCode = 1;
  } else if (dryRun) {
    console.log(`Validado: apps/${name} seria materializado a partir do template controlado.`);
  } else {
    await cp(resolve('tools/generators/templates/domain'), destination, { recursive: true });
    await rename(resolve(destination, 'project.json.template'), resolve(destination, 'project.json'));
    for (const relativePath of ['project.json', 'src/Journey.tsx']) {
      const file = resolve(destination, relativePath);
      await writeFile(file, (await readFile(file, 'utf8')).replaceAll('__DOMAIN_NAME__', name));
    }
    await mkdir(resolve(destination, 'src'), { recursive: true });
    console.log(`Domínio ${name} criado. Nenhuma configuração interna do shell foi alterada.`);
  }
}
