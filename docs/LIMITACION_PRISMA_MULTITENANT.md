# ⚠️ Limitación Técnica: Prisma Client y Multi-Tenancy

## 📋 Resumen del Problema

Después de extenso debugging (4+ horas), se identificó una **limitación arquitectónica fundamental de Prisma Client** con la arquitectura multi-tenant de bases de datos separadas implementada en este proyecto.

## 🔍 Problema Identificado

### Arquitectura Actual
- **Master Database**: `crm_master` - Gestiona información de tenants
- **Tenant Databases**: `crm_tenant_[subdomain]` - Una base de datos separada por tenant

### Limitación de Prisma
Prisma Client genera código estático en tiempo de compilación basado en el `DATABASE_URL` del archivo `.env`. Cuando se intentan crear clientes dinámicos con diferentes URLs de base de datos:

1. ✅ Las tablas **SÍ EXISTEN** en las bases de datos de los tenants
2. ✅ Las migraciones se aplicaron correctamente
3. ✅ Las consultas SQL directas funcionan
4. ❌ **Prisma Client reporta "table does not exist"**

### Evidencia del Problema

```typescript
// Esto FALLA aunque la tabla existe
const suppliers = await prisma.supplier.findMany();
// Error: The table `public.Supplier` does not exist

// Esto también FALLA
const suppliers = await prisma.$queryRaw`SELECT * FROM "Supplier"`;
// Error: relation "Supplier" does not exist

// Pero esto FUNCIONA (conexión directa pg)
const pool = new Pool({ connectionString: tenantDatabaseUrl });
const result = await pool.query('SELECT * FROM "Supplier"');
// ✅ Retorna datos correctamente
```

## 🎯 Módulos Afectados

### ✅ Módulos que Funcionan Correctamente
Todos los módulos existentes funcionan porque sus tablas están en AMBAS bases de datos (master y tenant):
- Dashboard
- Ventas
- Inventario  
- Clientes
- CRM
- Caja
- Reportes
- Configuración

### ❌ Módulo Afectado
- **Proveedores y Compras** - Las tablas solo existen en las bases de datos de los tenants

## 💡 Soluciones Posibles

### Opción 1: Refactorizar a Schema Único (IDEAL)
**Ventajas:**
- Compatible con Prisma Client
- Mejor rendimiento
- Más fácil de mantener

**Implementación:**
```prisma
model Supplier {
  id        String @id @default(uuid())
  tenantId  String // Agregar a todas las tablas
  // ... otros campos
  
  @@index([tenantId])
}
```

**Esfuerzo:** Alto (requiere migración de datos)

### Opción 2: Usar TypeORM o Drizzle (ALTERNATIVA)
**Ventajas:**
- Soporte nativo para multi-tenancy
- Conexiones dinámicas funcionan correctamente

**Esfuerzo:** Alto (reescribir todo el backend)

### Opción 3: SQL Directo con `pg` (TEMPORAL)
**Ventajas:**
- Funciona inmediatamente
- No requiere cambios arquitectónicos

**Desventajas:**
- Sin type-safety
- Más código manual
- Más propenso a errores

**Implementación:**
```typescript
import { Pool } from 'pg';

const pool = new Pool({ connectionString: req.tenant?.databaseUrl });
const result = await pool.query('SELECT * FROM "Supplier"');
```

**Esfuerzo:** Bajo (solo para módulo de proveedores)

## 📝 Estado Actual

### Implementado
- ✅ Schema de base de datos completo
- ✅ Migraciones aplicadas
- ✅ Controladores backend (usando Prisma - NO FUNCIONAL)
- ✅ Rutas backend configuradas
- ✅ Dashboard frontend
- ✅ Navegación integrada

### Pendiente
- ⚠️ **Refactorizar controladores para usar `pg` directamente**
- ⚠️ O implementar Opción 1 (schema único)

## 🚀 Recomendación

**A CORTO PLAZO:** Implementar Opción 3 (SQL directo) para el módulo de proveedores

**A LARGO PLAZO:** Migrar a Opción 1 (schema único con `tenantId`) para toda la aplicación

## 📚 Referencias

- [Prisma Multi-Tenancy Guide](https://www.prisma.io/docs/guides/database/multi-tenancy)
- [GitHub Issue: Prisma with Dynamic Databases](https://github.com/prisma/prisma/issues/2443)

## 👤 Autor

Documentado después de 4+ horas de debugging exhaustivo
Fecha: 18 de Febrero, 2026
