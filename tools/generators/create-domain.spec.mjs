import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

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
});
