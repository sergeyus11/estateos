#!/usr/bin/env tsx
/**
 * Idempotent backfill: for each existing show_reports row, create clients (dedupe) + agenda_events.
 * Rerun-safe: skips rows where show_reports.eventId IS NOT NULL.
 *
 * Manual rollback steps (if needed after a bad run):
 *   1. UPDATE show_reports SET event_id = NULL, client_id = NULL WHERE source = 'backfill' (using psql directly)
 *   2. Remove agenda_events rows with source='backfill' (using psql directly)
 */
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { showReports, clients, agendaEvents } from '@estateos/db';

const DATABASE_URL = process.env.DATABASE_URL ?? 'postgresql://estateos:estateos_dev@localhost:30210/estateos';

function makeId(): string {
  return crypto.randomUUID().replace(/-/g, '');
}

async function main() {
  const sqlClient = postgres(DATABASE_URL, { max: 1 });
  const db = drizzle(sqlClient);

  const orphanReports = await db.select().from(showReports).where(isNull(showReports.eventId));
  console.log(`Backfilling ${orphanReports.length} show_reports rows...`);

  let createdClients = 0;
  let createdEvents = 0;

  for (const report of orphanReports) {
    const fields = (report.fields ?? {}) as Record<string, unknown>;
    const clientNameRaw = String(fields.client ?? '').trim();
    if (!clientNameRaw) {
      console.warn(`Skip ${report.id}: no client name in fields`);
      continue;
    }
    const lowered = clientNameRaw.toLowerCase();
    const existingClient = await db
      .select()
      .from(clients)
      .where(and(
        eq(clients.organizationId, report.organizationId),
        sql`lower(${clients.name}) = ${lowered}`,
      ))
      .limit(1);

    let clientId: string;
    if (existingClient.length > 0) {
      clientId = existingClient[0].id;
    } else {
      clientId = makeId();
      await db.insert(clients).values({
        id: clientId,
        organizationId: report.organizationId,
        createdByUserId: report.agentId,
        name: clientNameRaw,
        status: 'active',
      });
      createdClients++;
    }

    const eventId = makeId();
    const objectTitle = String(fields.object ?? '').trim() || 'Показ';
    await db.insert(agendaEvents).values({
      id: eventId,
      organizationId: report.organizationId,
      agentId: report.agentId,
      eventType: 'showing',
      title: objectTitle,
      scheduledAt: report.createdAt,
      durationMin: 60,
      clientId,
      address: String(fields.object ?? '') || null,
      status: 'done',
      reportId: report.id,
      source: 'backfill',
      createdAt: report.createdAt,
      updatedAt: report.createdAt,
    });
    createdEvents++;

    await db.update(showReports).set({ eventId, clientId }).where(eq(showReports.id, report.id));
  }

  console.log(`Created ${createdClients} clients, ${createdEvents} agenda_events`);
  console.log(`Updated ${createdEvents} show_reports with eventId + clientId`);
  await sqlClient.end();
}

main().catch((e) => { console.error('Backfill failed:', e); process.exit(1); });
