# Comandos para Ejecutar el Proyecto en Otra Máquina

## 🚀 Comandos Rápidos

### Opción 1: Script Automático (Recomendado)
```bash
# Clonar y ejecutar
git clone https://github.com/ElvisMrt/proyecto-crm.git
cd proyecto-crm
./quick-start.sh
```

### Opción 2: Comandos Manuales
```bash
# 1. Clonar repositorio
git clone https://github.com/ElvisMrt/proyecto-crm.git
cd proyecto-crm

# 2. Iniciar servicios Docker
docker-compose up -d

# 3. Esperar 10 segundos y ejecutar migraciones
sleep 10
docker-compose exec backend npm run prisma:migrate

# 4. Verificar estado
docker-compose ps

# 5. Acceder a la aplicación
# Frontend: http://localhost:5173
# Backend: http://localhost:3000
```

---

## 📋 Comandos Esenciales

### Gestión de Servicios
```bash
# Iniciar todos los servicios
docker-compose up -d

# Detener todos los servicios
docker-compose down

# Reiniciar servicios específicos
docker-compose restart backend
docker-compose restart frontend

# Ver estado de los contenedores
docker-compose ps

# Ver logs en tiempo real
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs backend
docker-compose logs frontend
```

### Base de Datos
```bash
# Ejecutar migraciones
docker-compose exec backend npm run prisma:migrate

# Generar Prisma Client
docker-compose exec backend npm run prisma:generate

# Acceder a PostgreSQL directamente
docker-compose exec postgres psql -U postgres -d crm_master

# Abrir Prisma Studio (interfaz gráfica)
docker-compose exec backend npm run prisma:studio

# Resetear base de datos (cuidado: pierde datos)
docker-compose exec backend npm run prisma:migrate reset
```

### Desarrollo
```bash
# Reconstruir imágenes
docker-compose build --no-cache

# Instalar dependencias en backend
docker-compose exec backend npm install

# Instalar dependencias en frontend
docker-compose exec frontend npm install

# Ejecutar seeds (datos de prueba)
docker-compose exec backend npm run seed
```

---

## 🔧 Solución de Problemas

### Si los puertos están ocupados
```bash
# Ver qué usa el puerto 5434
lsof -i :5434

# Cambiar puerto en docker-compose.yml y reiniciar
docker-compose up -d
```

### Si hay errores de conexión
```bash
# Verificar estado de PostgreSQL
docker-compose exec postgres pg_isready -U postgres

# Reiniciar PostgreSQL
docker-compose restart postgres

# Ver logs de errores
docker-compose logs postgres | tail -50
```

### Si el frontend no carga
```bash
# Reconstruir frontend
docker-compose build --no-cache frontend
docker-compose up -d frontend

# Ver logs del frontend
docker-compose logs frontend | tail -50
```

---

## 📱 URLs de Acceso

Una vez ejecutado el proyecto:

- **Aplicación Web:** http://localhost:5173
- **API REST:** http://localhost:3000
- **Base de Datos:** localhost:5434
- **Redis:** localhost:6379

---

## 🛠️ Verificación Final

```bash
# Verificar que todo esté funcionando
curl http://localhost:3000/api/v1/health
curl http://localhost:5173

# Verificar contenedores saludables
docker-compose ps
```

---

## 📝 Notas Importantes

1. **Docker y Docker Compose** deben estar instalados
2. **Node.js 20+** es requerido para desarrollo local
3. Los puertos **5173, 3000, 5434, 6379** deben estar disponibles
4. La primera vez puede tardar varios minutos en descargar las imágenes

---

**Versión:** 1.0.0  
**Requisitos:** Docker, Docker Compose, Node.js 20+
