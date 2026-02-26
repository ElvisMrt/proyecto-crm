# Guía de Despliegue - Ejecutar Proyecto en Otra Máquina

## 🚀 Requisitos Previos

### Software Necesario
- **Node.js** 20+ 
- **Docker** y **Docker Compose**
- **Git**

### Instalación de Requisitos

#### macOS/Linux
```bash
# Instalar Node.js (usando nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20

# Instalar Docker
# macOS: Descargar desde https://docs.docker.com/desktop/mac/install/
# Linux: sudo apt-get install docker.io docker-compose
```

#### Windows
```bash
# Descargar e instalar Node.js desde https://nodejs.org/
# Descargar e instalar Docker Desktop desde https://docs.docker.com/desktop/windows/install/
```

---

## 📋 Pasos de Despliegue

### 1. Clonar el Repositorio
```bash
git clone https://github.com/ElvisMrt/proyecto-crm.git
cd proyecto-crm
```

### 2. Verificar Configuración de Puertos

Revisar que los puertos estén disponibles:
- **Frontend:** 5173
- **Backend:** 3000  
- **PostgreSQL:** 5434
- **Redis:** 6379

Si algún puerto está ocupado, modificar `docker-compose.yml`:
```yaml
ports:
  - "5434:5432"  # PostgreSQL
  - "3000:3000"  # Backend
  - "5173:5173"  # Frontend
  - "6379:6379"  # Redis
```

### 3. Iniciar Servicios con Docker
```bash
# Iniciar todos los servicios
docker-compose up -d

# Esperar a que los servicios estén listos
docker-compose ps
```

### 4. Ejecutar Migraciones
```bash
# Generar Prisma Client
docker-compose exec backend npm run prisma:generate

# Ejecutar migraciones
docker-compose exec backend npm run prisma:migrate

# (Opcional) Cargar datos de prueba
docker-compose exec backend npm run seed
```

### 5. Verificar Estado de los Servicios
```bash
# Ver logs de todos los servicios
docker-compose logs -f

# Ver logs específicos
docker-compose logs backend
docker-compose logs frontend
docker-compose logs postgres
```

---

## 🔧 Acceso a la Aplicación

Una vez que todos los servicios estén corriendo:

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3000
- **PostgreSQL:** localhost:5434
- **Redis:** localhost:6379

---

## 🛠️ Comandos Útiles

### Gestión de Servicios
```bash
# Detener servicios
docker-compose down

# Reiniciar servicios específicos
docker-compose restart backend
docker-compose restart frontend

# Reconstruir imágenes
docker-compose build --no-cache

# Eliminar volúmenes (cuidado: pierde datos)
docker-compose down -v
```

### Base de Datos
```bash
# Acceder a PostgreSQL
docker-compose exec postgres psql -U postgres -d crm_master

# Abrir Prisma Studio
docker-compose exec backend npm run prisma:studio

# Resetear base de datos
docker-compose exec backend npm run prisma:migrate reset
```

### Logs y Monitoreo
```bash
# Ver logs en tiempo real
docker-compose logs -f

# Ver logs de últimos 100 líneas
docker-compose logs --tail=100

# Ver estado de contenedores
docker-compose ps
```

---

## 🐛 Solución de Problemas Comunes

### Error: "port already allocated"
```bash
# Ver qué proceso usa el puerto
lsof -i :5434  # o el puerto conflictivo

# Cambiar puerto en docker-compose.yml
# Luego reiniciar: docker-compose up -d
```

### Error: "database connection failed"
```bash
# Verificar estado de PostgreSQL
docker-compose exec postgres pg_isready -U postgres

# Reiniciar PostgreSQL
docker-compose restart postgres
```

### Error: "node_modules not found"
```bash
# Reconstruir imágenes
docker-compose build --no-cache

# O reinstalar dependencias
docker-compose exec backend npm install
docker-compose exec frontend npm install
```

### Error: "permission denied"
```bash
# En Linux/Mac, agregar usuario al grupo docker
sudo usermod -aG docker $USER
# Cerrar sesión y volver a abrir
```

---

## 📱 Variables de Entorno

Si necesitas configurar variables de entorno personalizadas:

### Backend (.env)
```env
NODE_ENV=development
PORT=3000
DATABASE_URL="postgresql://postgres:postgres@postgres:5432/crm_master?schema=public"
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3000/api/v1
```

---

## 🚀 Despliegue en Producción

Para producción, considerar:

1. **Cambiar variables de entorno**
2. **Usar HTTPS**
3. **Configurar firewall**
4. **Usar volúmenes persistentes**
5. **Configurar backups**

```bash
# Ejemplo para producción
NODE_ENV=production
docker-compose -f docker-compose.prod.yml up -d
```

---

## 📞 Soporte

Si encuentras problemas:

1. Revisa los logs: `docker-compose logs`
2. Verifica puertos disponibles: `netstat -tulpn`
3. Confirma versión de Node.js: `node --version`
4. Confirma versión de Docker: `docker --version`

---

**Versión:** 1.0.0  
**Última actualización:** 2024
