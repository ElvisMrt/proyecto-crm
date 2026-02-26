# Guía de Configuración del Proyecto

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js 20+
- PostgreSQL 15+
- Docker y Docker Compose (opcional)

### Instalación

#### Opción 1: Con Docker (Recomendado)

```bash
# Clonar el repositorio (si aplica)
# cd proyecto-crm

# Iniciar todos los servicios
docker-compose up -d

# Ejecutar migraciones
docker-compose exec backend npm run prisma:migrate

# Ver logs
docker-compose logs -f
```

#### Opción 2: Instalación Local

**1. Configurar Backend**

```bash
cd backend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus configuraciones

# Generar Prisma Client
npm run prisma:generate

# Ejecutar migraciones (crear base de datos primero)
npm run prisma:migrate

# Iniciar servidor en modo desarrollo
npm run dev
```

**2. Configurar Frontend**

```bash
cd frontend

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

### Acceso

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3000
- **PostgreSQL:** localhost:5432

## 📝 Configuración de Base de Datos

### Crear Base de Datos

```sql
CREATE DATABASE crm_master;
```

### Ejecutar Migraciones

```bash
cd backend
npm run prisma:migrate
```

### Crear Usuario de Prueba

Después de ejecutar las migraciones, puedes crear un usuario de prueba usando Prisma Studio:

```bash
npm run prisma:studio
```

O crear un script de seed (prisma/seed.ts) para datos iniciales.

## 🔧 Variables de Entorno

### Backend (.env)

```env
PORT=3000
NODE_ENV=development
DATABASE_URL="postgresql://user:password@localhost:5432/crm_master?schema=public"
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:3000/api/v1
```

## 📚 Scripts Disponibles

### Backend

- `npm run dev` - Inicia servidor en modo desarrollo
- `npm run build` - Compila TypeScript
- `npm start` - Inicia servidor en producción
- `npm run prisma:generate` - Genera Prisma Client
- `npm run prisma:migrate` - Ejecuta migraciones
- `npm run prisma:studio` - Abre Prisma Studio

### Frontend

- `npm run dev` - Inicia servidor de desarrollo
- `npm run build` - Construye para producción
- `npm run preview` - Previsualiza build de producción

## 🐛 Solución de Problemas

### Error de conexión a base de datos

- Verificar que PostgreSQL esté corriendo
- Verificar la cadena de conexión en `.env`
- Verificar que la base de datos exista

### Error de CORS

- Verificar que `CORS_ORIGIN` en backend coincida con la URL del frontend

### Error de autenticación

- Verificar que `JWT_SECRET` esté configurado
- Verificar que el token se esté enviando en el header `Authorization`

## 📖 Documentación

Ver carpeta `docs/` para documentación completa del sistema.














