# Arquitectura SaaS Multitenant - CRM

## 🏗️ Visión General

```
┌─────────────────────────────────────────────────────────────┐
│                    PANEL SAAS ADMIN                          │
│  (tusitio.com/admin) - Gestión de tenants, planes, pagos   │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
   ┌────▼────┐          ┌────▼────┐          ┌────▼────┐
   │tenant1  │          │tenant2  │          │tenantN  │
   │.tusitio │          │.tusitio │          │.tusitio │
   │.com     │          │.com     │          │.com     │
   └────┬────┘          └────┬────┘          └────┬────┘
        │                     │                     │
   ┌────▼────┐          ┌────▼────┐          ┌────▼────┐
   │  DB_1   │          │  DB_2   │          │  DB_N   │
   │(aislada)│          │(aislada)│          │(aislada)│
   └─────────┘          └─────────┘          └─────────┘
```

## 📊 Modelo de Datos SaaS

### 1. Base de datos MASTER (Panel Admin)

```prisma
// SaaS Admin - Gestión de tenants
model Tenant {
  id              String    @id @default(uuid())
  slug            String    @unique           // tenant1, tenant2
  name            String                      // Nombre empresa
  subdomain       String    @unique           // tenant1.tusitio.com
  customDomain    String?   @unique           // crm.empresa.com (opcional)
  
  // Estado
  status          TenantStatus @default(ACTIVE)
  plan            PlanType     @default(FREE)
  
  // Database config (aislamiento total)
  databaseName    String                      // crm_tenant_1
  databaseUrl     String                      // URL conexión específica
  
  // Configuración
  settings        Json?                       // {theme, currency, timezone}
  limits          Json?                       // {maxUsers: 5, maxStorage: 1GB}
  
  // Facturación
  billingEmail    String
  subscriptionId  String?                     // Stripe/PayPal ID
  trialEndsAt     DateTime?
  
  // Métricas
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  lastActiveAt    DateTime?
  
  // Relaciones
  admins          TenantAdmin[]
  invoices        TenantInvoice[]
  activities      TenantActivity[]
}

model TenantAdmin {
  id        String   @id @default(uuid())
  tenantId  String
  userId    String   // User del sistema SaaS (no del tenant)
  role      AdminRole @default(OWNER)
  
  tenant    Tenant   @relation(fields: [tenantId], references: [id])
  
  @@unique([tenantId, userId])
}

model TenantInvoice {
  id          String   @id @default(uuid())
  tenantId    String
  amount      Decimal
  status      InvoiceStatus @default(PENDING)
  periodStart DateTime
  periodEnd   DateTime
  paidAt      DateTime?
  
  tenant      Tenant   @relation(fields: [tenantId], references: [id])
}

model SaaSUser {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String
  password  String   // hashed
  isSuperAdmin Boolean @default(false)
  
  createdAt DateTime @default(now())
  
  // Admin de múltiples tenants
  tenantAdmins TenantAdmin[]
}

enum TenantStatus {
  PENDING    // Nuevo, configurando
  ACTIVE     // Operativo
  SUSPENDED  // Sin pago
  CANCELLED  // Eliminado
}

enum PlanType {
  FREE
  STARTER
  PROFESSIONAL
  ENTERPRISE
}
```

### 2. Bases de datos por Tenant (Aislada)

Cada tenant tiene su propia base de datos PostgreSQL con TODO el schema actual del CRM:
- `crm_tenant_1` → Empresa A
- `crm_tenant_2` → Empresa B
- etc.

## 🔧 Arquitectura Técnica

### Routing por Subdominio

```
tenant1.tusitio.com → Middleware detecta 'tenant1' 
                    → Busca en DB Master
                    → Conecta a DB específica
                    → Sirve la app
```

### Middleware de Tenant

```typescript
// Detecta tenant por subdominio o header
const tenant = await identifyTenant(req);
// Conecta a la DB del tenant específica
const prisma = getTenantPrisma(tenant.databaseUrl);
// Guarda en request para uso en controllers
req.tenant = tenant;
req.prisma = prisma;
```

### Panel SaaS Admin

Funcionalidades:
1. **Dashboard** - Métricas de todos los tenants
2. **Crear Tenant** - Provisioning automático
3. **Gestión de Planes** - Upgrade/downgrade
4. **Facturación** - Invoices, pagos, suscripciones
5. **Soporte** - Logs, backups, soporte a tenants

## 📋 Plan de Implementación

### Fase 1: Modelo SaaS Master DB (HOY)
- [ ] Schema Prisma para SaaS (Tenant, TenantAdmin, SaaSUser)
- [ ] Migración de base de datos master
- [ ] Seed de superadmin

### Fase 2: Middleware y Routing
- [ ] Middleware de identificación de tenant
- [ ] Router dinámico por subdominio
- [ ] Conexiones DB múltiples

### Fase 3: Panel SaaS Admin
- [ ] Login de superadmin
- [ ] CRUD de tenants
- [ ] Sistema de provisioning (crear DB automáticamente)

### Fase 4: Tenant Isolation
- [ ] Modificar backend actual para usar tenant DB
- [ ] Aislar datos entre tenants
- [ ] Configuración por tenant

### Fase 5: Despliegue VPS
- [ ] Nginx con wildcard subdomains
- [ ] SSL automático (Let's Encrypt)
- [ ] Docker Compose producción
- [ ] Scripts de backup por tenant

## 🎯 Beneficios de esta Arquitectura

1. **Aislamiento Total** - Cada tenant tiene su DB
2. **Escalabilidad** - Puedes mover tenants a servidores diferentes
3. **Backup/Restore** - Por tenant individual
4. **Compliance** - Datos separados para regulaciones
5. **Personalización** - Cada tenant puede tener configuraciones únicas

## 💰 Modelo de Negocio

```
Plan Gratis:     1 usuario, 100 clientes, soporte básico
Plan Starter:    $29/mes - 5 usuarios, ilimitado, soporte email
Plan Pro:        $79/mes - 20 usuarios, API, soporte priority
Plan Enterprise: $199/mes - Ilimitado, SLA, custom domain
```

---

¿Aprobado el diseño? ¿Empezamos con la Fase 1?
