#!/usr/bin/env bash
set -euo pipefail

# Apply migration 0005 on prod EstateOS DB.
# Run from /mnt/apps/estateos AFTER merge and textual YES from CEO.

cd /mnt/apps/estateos

echo "-> Step 1: drizzle-kit migrate (0005)"
pnpm --filter @estateos/db drizzle-kit migrate

echo "-> Step 2: Verify tables"
docker exec estateos_db psql -U estateos -d estateos -c 'SELECT tablename FROM pg_tables WHERE schemaname='"'"'public'"'"' AND tablename IN ('"'"'clients'"'"','"'"'objects'"'"','"'"'agenda_events'"'"');'

echo "-> Step 3: Run backfill"
DATABASE_URL=postgresql://estateos:${POSTGRES_PASSWORD:-estateos_dev}@localhost:30210/estateos pnpm tsx scripts/backfill-0005-clients-events.ts

echo "-> Step 4: Verify counts"
docker exec estateos_db psql -U estateos -d estateos -c "SELECT (SELECT count(*) FROM clients) AS clients, (SELECT count(*) FROM agenda_events WHERE source='backfill') AS events_bf, (SELECT count(*) FROM show_reports WHERE event_id IS NOT NULL) AS reports_linked;"

echo "Migration 0005 complete"
