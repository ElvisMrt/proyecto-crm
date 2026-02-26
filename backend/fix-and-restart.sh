#!/bin/bash
set -e

echo "=== PASO 1: Deteniendo backend ==="
pkill -9 -f "tsx watch" 2>/dev/null || true
pkill -9 -f "node.*index" 2>/dev/null || true
sleep 3

echo "=== PASO 2: Regenerando Prisma Client ==="
cd /Users/user/Documents/proyecto-crm/backend
./node_modules/.bin/prisma generate

echo "=== PASO 3: Iniciando backend ==="
npm run dev &
sleep 5

echo "=== PASO 4: Verificando API ==="
curl -s http://localhost:3001/health || echo "Backend no responde"

echo "=== LISTO ==="
