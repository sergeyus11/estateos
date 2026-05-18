import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __dirname = dirname(fileURLToPath(import.meta.url));
const scriptPath = resolve(__dirname, '../../../../scripts/apply-migration-0005.sh');
const scriptContent = readFileSync(scriptPath, 'utf8');

describe('apply-migration-0005.sh', () => {
  it('uses the db package migrate script', () => {
    expect(scriptContent).toContain('pnpm --filter @estateos/db migrate');
    expect(scriptContent).not.toContain('drizzle-kit migrate');
  });

  it('exports DATABASE_URL for migration and backfill', () => {
    expect(scriptContent).toContain('export DATABASE_URL');
  });

  it('requires DATABASE_URL or POSTGRES_PASSWORD to be set explicitly', () => {
    expect(scriptContent).not.toContain(': "${POSTGRES_PASSWORD:=estateos_dev}"');
    expect(scriptContent).not.toContain('WARN: using default DATABASE_URL');
    expect(scriptContent).toContain('must set either DATABASE_URL or POSTGRES_PASSWORD');

    const result = spawnSync('bash', [scriptPath], {
      env: { PATH: process.env.PATH! } as unknown as NodeJS.ProcessEnv,
      encoding: 'utf8',
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/must set either DATABASE_URL or POSTGRES_PASSWORD/);
  });

  it('uses strict bash settings', () => {
    expect(scriptContent).toContain('set -euo pipefail');
  });

  it('has valid bash syntax', () => {
    const result = spawnSync('bash', ['-n', scriptPath], {
      encoding: 'utf8',
    });

    expect(result.status, result.stderr).toBe(0);
  });
});
