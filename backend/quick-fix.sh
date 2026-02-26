#!/bin/bash
cd /Users/user/Documents/proyecto-crm/backend
echo "=== PASO 1: Matando procesos ==="
pkill -9 -f "tsx watch" 2>/dev/null || true
pkill -9 -f "node.*index" 2>/dev/null || true
sleep 2
echo "=== PASO 2: Generando Prisma Client ==="
npx prisma generate
echo "=== PASO 3: Iniciando backend ==="
npm run dev &
sleep 3
echo "=== VERIFICANDO ==="
curl -s http://localhost:3001/health
echo ""
echo "=== LISTO - Prueba crear una cita ==="
