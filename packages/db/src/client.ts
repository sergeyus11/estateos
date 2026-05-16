import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

type Schema = typeof schema;

let _db: PostgresJsDatabase<Schema> | null = null;

function getDb(): PostgresJsDatabase<Schema> {
  if (_db) return _db;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is required');
  }
  const client = postgres(connectionString, {
    max: 10,
    prepare: false,
  });
  _db = drizzle(client, { schema });
  return _db;
}

// Proxy that lazy-initializes on first access
export const db = new Proxy({} as PostgresJsDatabase<Schema>, {
  get(_target, prop) {
    return Reflect.get(getDb(), prop);
  },
});

export type DB = PostgresJsDatabase<Schema>;
