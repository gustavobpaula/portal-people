import { access, readFile } from 'node:fs/promises';

const artifacts = [
  'dist/apps/portal-host/index.html',
  'dist/apps/neutral-remote/mf-manifest.json',
  'dist/apps/beneficios/mf-manifest.json',
];
for (const artifact of artifacts) await access(artifact);
const beneficiosManifest = JSON.parse(await readFile('apps/beneficios/journey-manifest.json', 'utf8'));
const registry = JSON.parse(await readFile('apps/portal-host/src/assets/journey-registry.json', 'utf8'));
const registryManifest = registry.find((manifest) => manifest.id === 'beneficios');
if (JSON.stringify(registryManifest) !== JSON.stringify(beneficiosManifest)) {
  throw new Error('O manifesto de Benefícios diverge do registro local do host.');
}
console.log('Artefatos do host e dos remotes foram produzidos de forma independente e o manifesto de Benefícios está registrado.');
