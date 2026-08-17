import { access } from 'node:fs/promises';

const artifacts = ['dist/apps/portal-host/index.html', 'dist/apps/neutral-remote/mf-manifest.json'];
for (const artifact of artifacts) await access(artifact);
console.log('Artefatos do host e do remote foram produzidos de forma independente.');
