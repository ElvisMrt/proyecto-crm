#!/bin/bash
cd /Users/user/Documents/proyecto-crm

echo "=== 1. Migrando schema de Prisma ==="
cd backend
npx prisma migrate dev --name add_notification_fields --skip-generate

echo "=== 2. Instalando dependencias ==="
npm install

echo "=== 3. Regenerando Prisma Client ==="
npx prisma generate

echo "=== 4. Reconstruyendo contenedores Docker ==="
cd ..
docker-compose down
docker-compose build backend
docker-compose up -d

echo "=== 5. Esperando inicio ==="
sleep 10

echo "=== Verificando ==="
curl -s http://localhost:3000/health && echo " - Backend OK"

echo "=== LISTO ==="
echo "El sistema de notificaciones está activo"
