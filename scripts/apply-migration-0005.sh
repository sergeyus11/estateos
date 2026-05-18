#!/usr/bin/env bash
set -euo pipefail

# Apply migration 0005 on prod EstateOS DB.
# Run from HOST (uses docker exec for verification), NOT from inside a container.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${REPO_ROOT}"

# DATABASE_URL is the single source of truth for both migrate and backfill.
# Either DATABASE_URL must be set, OR POSTGRES_PASSWORD must be set (we'll compose DATABASE_URL from it).
if [ -z "${DATABASE_URL:-}" ]; then
  if [ -z "${POSTGRES_PASSWORD:-}" ]; then
    echo "ERROR: must set either DATABASE_URL or POSTGRES_PASSWORD before running this script." >&2
    echo "Example:" >&2
    echo "  POSTGRES_PASSWORD=<prod-pw> bash scripts/apply-migration-0005.sh" >&2
    echo "  DATABASE_URL=postgresql://user:pw@host:port/db bash scripts/apply-migration-0005.sh" >&2
    exit 1
  fi
  DATABASE_URL="postgresql://estateos:${POSTGRES_PASSWORD}@localhost:30210/estateos"
fi
export DATABASE_URL

echo "-> Step 1: drizzle migrate (packages/db)"
pnpm --filter @estateos/db migrate

echo "-> Step 2: Verify tables (via docker exec)"
docker exec estateos_db psql -U estateos -d estateos -c "SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename IN ('clients','objects','agenda_events');"

echo "-> Step 3: Run backfill"
pnpm tsx scripts/backfill-0005-clients-events.ts

echo "-> Step 4: Verify counts"
docker exec estateos_db psql -U estateos -d estateos -c "SELECT (SELECT count(*) FROM clients) AS clients, (SELECT count(*) FROM agenda_events WHERE source='backfill') AS events_bf, (SELECT count(*) FROM show_reports WHERE event_id IS NOT NULL) AS reports_linked;"

echo "Migration 0005 complete"
