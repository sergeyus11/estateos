import '@testing-library/jest-dom/vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

// Load .env from repo root for tests that need DB access.
// Remap docker-internal hostnames (postgres:5432) to host-mapped ports (localhost:30210)
// so tests can run on the host machine.
const envPath = resolve(__dirname, '../../../.env');
if (existsSync(envPath)) {
  const content = readFileSync(envPath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

// Remap docker hostname to host-mapped port for tests run on host machine.
if (process.env.DATABASE_URL?.includes('@postgres:5432')) {
  process.env.DATABASE_URL = process.env.DATABASE_URL.replace(
    '@postgres:5432',
    '@localhost:30210'
  );
}
