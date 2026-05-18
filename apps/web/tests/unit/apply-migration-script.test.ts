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
