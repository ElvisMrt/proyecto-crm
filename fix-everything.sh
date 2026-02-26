#!/bin/bash
set -e

echo "=========================================="
echo "ARREGLANDO TODO EL CRM"
echo "=========================================="

cd /Users/user/Documents/proyecto-crm

echo ""
echo "1. DETENIENDO CONTENEDORES..."
docker-compose down

echo ""
echo "2. INSTALANDO DEPENDENCIAS LOCALES..."
cd backend
npm install jsonwebtoken nodemailer @types/nodemailer

echo ""
echo "3. MIGRANDO BASE DE DATOS..."
npx prisma db push --accept-data-loss

echo ""
echo "4. GENERANDO PRISMA CLIENT..."
npx prisma generate

echo ""
echo "5. RECONSTRUYENDO CONTENEDORES..."
cd ..
docker-compose build backend frontend

echo ""
echo "6. INICIANDO SERVICIOS..."
docker-compose up -d

echo ""
echo "7. ESPERANDO INICIO..."
sleep 15

echo ""
echo "8. VERIFICANDO..."
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo "✅ Backend funcionando en http://localhost:3000"
else
    echo "❌ Backend no responde"
    docker logs crm_backend --tail 20
fi

if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo "✅ Frontend funcionando en http://localhost:5173"
else
    echo "❌ Frontend no responde"
fi

echo ""
echo "=========================================="
echo "TODO LISTO"
echo "=========================================="
echo "URLs:"
echo "- Frontend: http://localhost:5173"
echo "- Backend: http://localhost:3000"
echo ""
echo "Para ver citas de clientes:"
echo "http://localhost:5173/crm/public-appointments"
echo ""
echo "Formulario público:"
echo "http://localhost:3000/appointment-form.html"
