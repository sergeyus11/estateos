#!/usr/bin/env bash
# Daily reminder cron — fires at 19:30 МСК from штаб host crontab
# Per memory ref_cron_msk_tz — TrueNAS cron reads in Moscow time.

set -euo pipefail

LOG_DIR=/mnt/backup/estateos/log
mkdir -p "$LOG_DIR"
LOG="$LOG_DIR/cron-reminder.log"

SECRET=$(grep "^CRON_SECRET=" /mnt/apps/estateos/.env | cut -d= -f2-)
if [ -z "$SECRET" ]; then
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] CRON_SECRET not found in .env" >> "$LOG"
  exit 1
fi

RESP=$(curl -sX POST https://estateos.ru/api/cron/reminder \
  -H "x-cron-secret: $SECRET" \
  -w "\nHTTP %{http_code}\n" 2>&1)
echo "[$(date '+%Y-%m-%d %H:%M:%S')] $RESP" >> "$LOG"
