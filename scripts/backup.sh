#!/usr/bin/env bash
# EstateOS — daily PostgreSQL backup via pg_dump
# Phase 0: simple pg_dump → gzipped tarball
# Phase 1+ (planned): upgrade to pgBackRest with PITR
#
# Cron: 30 3 * * * /mnt/apps/estateos/scripts/backup.sh

set -euo pipefail

BACKUP_DIR=/mnt/backup/estateos
RETENTION_DAYS=14
DATE=$(date +%Y%m%d_%H%M%S)
LOG="$BACKUP_DIR/log/backup.log"

mkdir -p "$BACKUP_DIR/daily" "$BACKUP_DIR/log"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG"
}

log "=== EstateOS backup start ==="

OUTPUT="$BACKUP_DIR/daily/estateos_${DATE}.sql.gz"
if docker exec estateos_db pg_dump -U estateos -d estateos --no-owner --clean --if-exists 2>>"$LOG" | gzip > "$OUTPUT"; then
  SIZE=$(du -h "$OUTPUT" | cut -f1)
  log "Backup OK: $OUTPUT ($SIZE)"
else
  log "Backup FAILED"
  exit 1
fi

# Cleanup old backups
DELETED=$(find "$BACKUP_DIR/daily" -name 'estateos_*.sql.gz' -mtime "+$RETENTION_DAYS" -delete -print | wc -l)
log "Cleaned up $DELETED backups older than $RETENTION_DAYS days"

log "=== EstateOS backup done ==="
