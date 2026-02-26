#!/bin/bash
cd /Users/user/Documents/proyecto-crm/backend

echo "=== MATANDO SERVICIOS ==="
pkill -9 -f "tsx watch" 2>/dev/null || true
pkill -9 -f "node.*index" 2>/dev/null || true
sleep 2

echo "=== INICIANDO BACKEND ==="
npm run dev &

sleep 5

echo "=== VERIFICANDO ==="
curl -s http://localhost:3001/health && echo " - Backend OK"

echo "=== LISTO ==="
echo "Prueba crear una cita ahora"
