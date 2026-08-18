#!/bin/bash
set -euo pipefail

# Backup the local Prisma Postgres dev database
# Usage: ./scripts/db-backup.sh
#
# Requires the Prisma dev server to be running (npx prisma dev or next dev)
# The dev server uses port 51214 by default

BACKUP_FILE="openshift/daddy-backup.sql"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-51214}"
DB_USER="${DB_USER:-postgres}"
DB_NAME="${DB_NAME:-template1}"

echo "Backing up database from ${DB_HOST}:${DB_PORT}/${DB_NAME}..."

PGPASSWORD=postgres pg_dump \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  --no-owner \
  --no-privileges \
  --clean \
  --if-exists \
  > "$BACKUP_FILE"

LINE_COUNT=$(wc -l < "$BACKUP_FILE")
echo "Backup complete: ${BACKUP_FILE} (${LINE_COUNT} lines)"
echo ""
echo "To restore on OpenShift:"
echo "  1. Create a ConfigMap from the backup:"
echo "     oc create configmap daddy-db-backup --from-file=daddy-backup.sql=${BACKUP_FILE} -n daddy"
echo "  2. Run the restore job:"
echo "     oc apply -f openshift/db-restore-job.yaml -n daddy"
