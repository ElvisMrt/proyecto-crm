# 🔍 ANÁLISIS DE TENANT PRISMA

## 1️⃣ CONSTRUCCIÓN DE `req.tenantPrisma`

### Código relevante de `tenant.middleware.ts`

```typescript
// Líneas 17-36: Función getTenantPrisma
export function getTenantPrisma(databaseUrl: string): PrismaClient {
  console.log('📦 getTenantPrisma called with:', databaseUrl);
  console.log('📦 Cache keys:', Object.keys(tenantPrismaClients));
  
  if (!tenantPrismaClients[databaseUrl]) {
    console.log('✨ Creating NEW client for:', databaseUrl);
    tenantPrismaClients[databaseUrl] = new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl,  // ⚠️ AQUÍ SE USA EL databaseUrl DEL TENANT
        },
      },
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : undefined,
    });
  } else {
    console.log('♻️ Reusing cached client for:', databaseUrl);
  }
  return tenantPrismaClients[databaseUrl];
}

// Líneas 116-134: Donde se asigna req.tenantPrisma
req.tenant = {
  id: tenant.id,
  slug: tenant.slug,
  name: tenant.name,
  subdomain: tenant.subdomain,
  customDomain: tenant.customDomain,
  databaseUrl: tenant.databaseUrl,  // ⚠️ VIENE DE LA BD
  status: tenant.status,
  plan: tenant.plan,
  settings: typeof tenant.settings === 'string' ? JSON.parse(tenant.settings) : (tenant.settings || {}),
  limits: typeof tenant.limits === 'string' ? JSON.parse(tenant.limits) : (tenant.limits || {}),
};

// Crear Prisma Client para este tenant
console.log('🔗 Tenant databaseUrl:', tenant.databaseUrl);
console.log('🔗 Creating Prisma client...');
req.tenantPrisma = getTenantPrisma(tenant.databaseUrl);  // ⚠️ AQUÍ SE CREA
console.log('✅ Tenant Prisma created');
```

## 2️⃣ DATABASE_URL Y TENANT.DATABASEURL

### DATABASE_URL del .env
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5434/crm_master?schema=public
```

### tenant.databaseUrl REAL del tenant "demo"
```sql
SELECT subdomain, "databaseUrl" FROM "Tenant" WHERE subdomain = 'demo';
```

**Resultado:**
```
 subdomain |                          databaseUrl                           
-----------+----------------------------------------------------------------
 demo      | postgresql://postgres:postgres@localhost:5434/crm_master?schema=public
```

## 🚨 PROBLEMA IDENTIFICADO

### **TODOS LOS TENANTS USAN LA MISMA BASE DE DATOS**

```
DATABASE_URL        = postgresql://postgres:postgres@localhost:5434/crm_master
tenant.databaseUrl  = postgresql://postgres:postgres@localhost:5434/crm_master
                      ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                      SON EXACTAMENTE IGUALES
```

### **Consecuencias:**

1. **Cache de Prisma Client:**
   ```typescript
   const tenantPrismaClients: { [key: string]: PrismaClient } = {};
   ```
   - La key es el `databaseUrl`
   - Todos los tenants tienen el mismo `databaseUrl`
   - **TODOS COMPARTEN EL MISMO PRISMA CLIENT** ⚠️

2. **Sin aislamiento:**
   - Tenant "demo" → crm_master
   - Tenant "empresa-x" → crm_master (si existiera)
   - Tenant "empresa-y" → crm_master (si existiera)
   - **TODOS VEN LOS MISMOS DATOS** ⚠️

3. **Sin tenantId en tablas:**
   - No hay filtro por tenant
   - Cualquier tenant puede ver datos de otros
   - **RIESGO DE SEGURIDAD CRÍTICO** 🔴

## 🔧 FLUJO ACTUAL

```
1. Request llega → tenant.middleware.ts
2. Busca tenant en BD master por subdomain
3. Obtiene tenant.databaseUrl = "postgresql://...crm_master"
4. Llama getTenantPrisma(tenant.databaseUrl)
5. Crea/reutiliza PrismaClient con esa URL
6. req.tenantPrisma apunta a crm_master
7. Controller usa req.tenantPrisma
8. ⚠️ TODOS LOS TENANTS ACCEDEN A LOS MISMOS DATOS
```

## 💡 LO QUE DEBERÍA PASAR (si fuera multi-tenant real)

### **Opción A: BD separada por tenant**
```
Tenant "demo"      → databaseUrl = postgresql://...crm_demo
Tenant "empresa-x" → databaseUrl = postgresql://...crm_empresa_x
Tenant "empresa-y" → databaseUrl = postgresql://...crm_empresa_y
```

### **Opción B: BD compartida con tenantId**
```
Tenant "demo"      → databaseUrl = postgresql://...crm_master
Tenant "empresa-x" → databaseUrl = postgresql://...crm_master
Tenant "empresa-y" → databaseUrl = postgresql://...crm_master

PERO con:
- Campo tenantId en TODAS las tablas
- Filtro automático por tenantId en queries
- Row Level Security (RLS) en PostgreSQL
```

## 🎯 ESTADO ACTUAL

**Tu sistema es:**
- ❌ NO multi-tenant real
- ❌ NO tiene aislamiento de datos
- ✅ Funciona como aplicación single-tenant
- ⚠️ Código preparado para multi-tenant pero no implementado

**El módulo de compras funciona porque:**
- Todos usan crm_master
- Las migraciones se aplicaron a crm_master
- No hay conflicto de datos (aún)

**El problema aparecerá cuando:**
- Tengas múltiples clientes reales
- Cada uno espere ver solo sus datos
- Actualmente TODOS ven TODO
