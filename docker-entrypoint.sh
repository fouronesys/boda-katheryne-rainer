#!/bin/sh
set -e

echo "→ Seeding paleta Dress to Impress..."
pnpm --filter @workspace/scripts run seed-colors

echo "→ Iniciando servidor..."
exec node --enable-source-maps artifacts/api-server/dist/index.mjs
