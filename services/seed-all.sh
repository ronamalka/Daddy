#!/bin/bash
set -e

echo "=== Seeding all service databases ==="

echo ""
echo "--- Pushing schemas ---"
for svc in users gigs orders requests; do
  echo "Pushing schema for $svc..."
  (cd "$(dirname "$0")/$svc" && npx prisma db push --accept-data-loss 2>&1 | tail -1)
done

echo ""
echo "--- Generating Prisma clients ---"
for svc in users gigs orders requests; do
  echo "Generating client for $svc..."
  (cd "$(dirname "$0")/$svc" && npx prisma generate 2>&1 | tail -1)
done

echo ""
echo "--- Running seed scripts ---"
echo "1/4 Seeding users..."
DATABASE_URL="${USERS_DATABASE_URL:-postgresql://rmalka@localhost:5432/daddy_users}" npx tsx "$(dirname "$0")/users/src/seed.ts"

echo "2/4 Seeding orders..."
DATABASE_URL="${ORDERS_DATABASE_URL:-postgresql://rmalka@localhost:5432/daddy_orders}" npx tsx "$(dirname "$0")/orders/src/seed.ts"

echo "3/4 Seeding gigs..."
DATABASE_URL="${GIGS_DATABASE_URL:-postgresql://rmalka@localhost:5432/daddy_gigs}" npx tsx "$(dirname "$0")/gigs/src/seed.ts"

echo "4/4 Seeding requests..."
DATABASE_URL="${REQUESTS_DATABASE_URL:-postgresql://rmalka@localhost:5432/daddy_requests}" npx tsx "$(dirname "$0")/requests/src/seed.ts"

echo ""
echo "=== All seeds complete ==="
