import { spawnSync } from 'node:child_process';
import { access, mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createDomain } from './create-domain.mjs';

async function createWorkspace(domains = []) {
  const workspaceRoot = await mkdtemp(join(tmpdir(), 'portal-generator-'));
  await mkdir(join(workspaceRoot, 'tools'), { recursive: true });
  await writeFile(join(workspaceRoot, 'tools/domain-governance.json'), `${JSON.stringify({ domains }, null, 2)}\n`);
  return workspaceRoot;
}

describe('golden path', () => {
  it('validates kebab-case names without changing the workspace in dry-run', () => {
    const output = spawnSync('node', ['tools/generators/create-domain.mjs', '--name', 'nova-jornada', '--dry-run'], { encoding: 'utf8' });
    expect(output.status).toBe(0);
    expect(output.stdout).toContain('Validado');
  });
  it('rejects invalid names', () => {
    const output = spawnSync('node', ['tools/generators/create-domain.mjs', '--name', 'Nova Jornada', '--dry-run'], { encoding: 'utf8' });
    expect(output.status).toBe(1);
  });
  it('materializes a complete federated remote outside the shell', async () => {
    const workspaceRoot = await createWorkspace(['legado']);
    const destination = await createDomain({ name: 'nova-jornada', displayName: 'Nova jornada', port: 4301, workspaceRoot });
    expect(await readFile(join(workspaceRoot, 'journeys', 'nova-jornada', 'manifest.json'), 'utf8')).toContain('http://localhost:4301/mf-manifest.json');
    const viteConfig = await readFile(join(destination, 'vite.config.ts'), 'utf8');
    expect(viteConfig).toContain('federation(config)');
    expect(viteConfig).toContain('port: Number("4301")');
    expect(viteConfig).toContain('strictPort: true');
    expect(viteConfig).toContain('../../dist/apps/nova-jornada');
    expect(viteConfig).toContain('../../libs/design-system-web/src/index.tsx');
    expect(viteConfig).not.toContain('../../../libs');
    expect(viteConfig).not.toContain('../../../dist');
    expect(viteConfig).not.toContain('__PORT__');
    expect(await readFile(join(destination, 'module-federation.config.ts'), 'utf8')).toContain('"./src/app/Journey.tsx"');
    const vitestConfig = await readFile(join(destination, 'vitest.config.ts'), 'utf8');
    expect(vitestConfig).toContain('../../libs/platform/contracts/src/index.ts');
    expect(vitestConfig).toContain('../../libs/platform/runtime/src/index.ts');
    expect(vitestConfig).not.toContain('../../../libs');
    expect(await readFile(join(destination, 'src/app/Journey.spec.tsx'), 'utf8')).toContain('Nova jornada');
    expect(await readFile(join(destination, 'src/app/Journey.spec.tsx'), 'utf8')).toContain('import { expect, it } from "vitest"');
    expect(await readFile(join(destination, 'src/app/Journey.tsx'), 'utf8')).not.toContain('@ts-nocheck');
    expect(await readFile(join(destination, 'src/main.tsx'), 'utf8')).toContain('"./app/Journey"');
    await expect(access(join(destination, 'src/domain'))).rejects.toMatchObject({ code: 'ENOENT' });
    await expect(access(join(destination, 'src/services'))).rejects.toMatchObject({ code: 'ENOENT' });
    expect(await readFile(join(destination, 'src/main.tsx'), 'utf8')).not.toContain('@ts-nocheck');
    const project = JSON.parse(await readFile(join(destination, 'project.json'), 'utf8'));
    expect(project.tags).toEqual(['scope:domain', 'domain:nova-jornada', 'type:app']);
    expect(project.implicitDependencies).toEqual(['platform-contracts', 'platform-runtime', 'design-system-web', 'design-tokens']);
    expect(JSON.parse(await readFile(join(workspaceRoot, 'tools/domain-governance.json'), 'utf8')).domains).toEqual(['legado', 'nova-jornada']);
    await expect(access(join(workspaceRoot, 'apps/portal-host'))).rejects.toMatchObject({ code: 'ENOENT' });
    await expect(access(join(workspaceRoot, 'apps/portal-host/src/assets/journey-registry.json'))).rejects.toMatchObject({ code: 'ENOENT' });
  });
  it('keeps the governance catalog idempotent while preserving existing domains', async () => {
    const workspaceRoot = await createWorkspace(['legado', 'legado']);
    await createDomain({ name: 'beneficios', workspaceRoot });
    await createDomain({ name: 'ferias', workspaceRoot });
    expect(JSON.parse(await readFile(join(workspaceRoot, 'tools/domain-governance.json'), 'utf8')).domains).toEqual(['beneficios', 'ferias', 'legado']);
  });
});
