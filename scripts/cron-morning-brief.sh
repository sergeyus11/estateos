#!/usr/bin/env bash
set -euo pipefail
SECRET=$(grep ^CRON_SECRET /mnt/apps/estateos/.env | cut -d= -f2-)
curl -sS -X POST https://estateos.ru/api/cron/morning-brief \
  -H "x-cron-secret: ${SECRET}" \
  >> /mnt/backup/estateos/log/cron-morning-brief.log 2>&1
