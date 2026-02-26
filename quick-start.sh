#!/bin/bash

# Script de Inicio Rápido - Proyecto CRM
# Ejecutar: chmod +x quick-start.sh && ./quick-start.sh

echo "🚀 Iniciando despliegue del Proyecto CRM..."

# Colores para salida
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Función para verificar si un comando existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Verificar requisitos
echo -e "${YELLOW}📋 Verificando requisitos...${NC}"

if ! command_exists docker; then
    echo -e "${RED}❌ Docker no está instalado. Por favor instala Docker primero.${NC}"
    exit 1
fi

if ! command_exists docker-compose; then
    echo -e "${RED}❌ Docker Compose no está instalado. Por favor instala Docker Compose primero.${NC}"
    exit 1
fi

if ! command_exists node; then
    echo -e "${RED}❌ Node.js no está instalado. Por favor instala Node.js 20+ primero.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Todos los requisitos están instalados${NC}"

# Verificar puertos
echo -e "${YELLOW}🔍 Verificando puertos disponibles...${NC}"

ports=(5173 3000 5434 6379)
for port in "${ports[@]}"; do
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${RED}❌ Puerto $port está en uso. Por favor libéralo o modifica docker-compose.yml${NC}"
        exit 1
    fi
done

echo -e "${GREEN}✅ Todos los puertos están disponibles${NC}"

# Iniciar servicios
echo -e "${YELLOW}🐳 Iniciando servicios Docker...${NC}"
docker-compose up -d

# Esperar a que los servicios estén listos
echo -e "${YELLOW}⏳ Esperando que los servicios inicien...${NC}"
sleep 10

# Verificar estado
echo -e "${YELLOW}📊 Verificando estado de los servicios...${NC}"
docker-compose ps

# Ejecutar migraciones
echo -e "${YELLOW}🗄️ Ejecutando migraciones de base de datos...${NC}"
docker-compose exec backend npm run prisma:migrate

# Verificar acceso
echo -e "${YELLOW}🌐 Verificando acceso a los servicios...${NC}"
sleep 5

if curl -s http://localhost:3000 > /dev/null; then
    echo -e "${GREEN}✅ Backend API accesible en http://localhost:3000${NC}"
else
    echo -e "${RED}❌ Backend API no responde${NC}"
fi

if curl -s http://localhost:5173 > /dev/null; then
    echo -e "${GREEN}✅ Frontend accesible en http://localhost:5173${NC}"
else
    echo -e "${RED}❌ Frontend no responde${NC}"
fi

echo -e "${GREEN}🎉 ¡Proyecto CRM iniciado exitosamente!${NC}"
echo -e "${GREEN}📱 Frontend: http://localhost:5173${NC}"
echo -e "${GREEN}🔧 Backend API: http://localhost:3000${NC}"
echo -e "${GREEN}🗄️ PostgreSQL: localhost:5434${NC}"
echo -e "${GREEN}🔴 Redis: localhost:6379${NC}"

echo -e "${YELLOW}📝 Comandos útiles:${NC}"
echo "  Ver logs: docker-compose logs -f"
echo "  Detener: docker-compose down"
echo "  Reiniciar: docker-compose restart"
echo "  Estado: docker-compose ps"
