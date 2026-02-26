#!/bin/bash
cd /Users/user/Documents/proyecto-crm

echo "=== DETENIENDO CONTENEDORES ==="
docker-compose down

echo "=== CONSTRUYENDO BACKEND CON CAMBIOS NUEVOS ==="
docker-compose build backend

echo "=== INICIANDO SERVICIOS ==="
docker-compose up -d

echo "=== ESPERANDO INICIO ==="
sleep 10

echo "=== VERIFICANDO ==="
docker-compose ps
curl -s http://localhost:3000/health && echo " - Backend OK"

echo "=== LISTO ==="
