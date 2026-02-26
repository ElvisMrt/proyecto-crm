# Arquitectura del Sistema CRM Multi-Tenant

## 📐 Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ARQUITECTURA MULTI-TENANT                           │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                              CAPA DE FRONTEND                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────────────┐         ┌──────────────────────────┐        │
│  │   SAAS ADMIN FRONTEND    │         │   CRM TENANT FRONTEND    │        │
│  │                          │         │                          │        │
│  │  • Gestión de Tenants    │         │  • Dashboard             │        │
│  │  • Planes y Facturación  │         │  • Ventas                │        │
│  │  • Monitoreo Global      │         │  • Inventario            │        │
│  │                          │         │  • Clientes              │        │
│  │  URL: localhost:5173/    │         │  • CRM                   │        │
│  │  (sin ?mode=crm)         │         │  • Reportes              │        │
│  │                          │         │  • Configuración         │        │
│  │                          │         │                          │        │
│  │                          │         │  URL: localhost:5173/    │        │
│  │                          │         │  ?mode=crm               │        │
│  └────────────┬─────────────┘         └────────────┬─────────────┘        │
│               │                                    │                       │
│               │    React + TypeScript + Vite       │                       │
│               │    TailwindCSS + React Router      │                       │
│               │                                    │                       │
└───────────────┼────────────────────────────────────┼───────────────────────┘
                │                                    │
                │         HTTP/HTTPS (Axios)         │
                │                                    │
┌───────────────┼────────────────────────────────────┼───────────────────────┐
│               │         CAPA DE BACKEND            │                       │
├───────────────┴────────────────────────────────────┴───────────────────────┤
│                                                                             │
│                    ┌──────────────────────────┐                            │
│                    │   EXPRESS.JS SERVER      │                            │
│                    │   (Node.js + TypeScript) │                            │
│                    │                          │                            │
│                    │   Port: 3000             │                            │
│                    └────────────┬─────────────┘                            │
│                                 │                                          │
│                    ┌────────────┴─────────────┐                            │
│                    │   TENANT MIDDLEWARE      │                            │
│                    │                          │                            │
│                    │  • Detecta subdomain     │                            │
│                    │  • Carga tenant config   │                            │
│                    │  • Crea Prisma Client    │                            │
│                    │    específico del tenant │                            │
│                    └────────────┬─────────────┘                            │
│                                 │                                          │
│         ┌───────────────────────┼───────────────────────┐                  │
│         │                       │                       │                  │
│    ┌────┴─────┐          ┌─────┴──────┐         ┌─────┴──────┐           │
│    │  SaaS    │          │   Auth     │         │  Tenant    │           │
│    │  Routes  │          │   Routes   │         │  Routes    │           │
│    │          │          │            │         │            │           │
│    │ /tenants │          │  /login    │         │  /sales    │           │
│    │ /plans   │          │  /logout   │         │  /inventory│           │
│    │ /billing │          │  /me       │         │  /clients  │           │
│    └────┬─────┘          └─────┬──────┘         │  /crm      │           │
│         │                      │                │  /reports  │           │
│         │                      │                │  /settings │           │
│         │                      │                └─────┬──────┘           │
│         │                      │                      │                  │
└─────────┼──────────────────────┼──────────────────────┼──────────────────┘
          │                      │                      │
          │                      │                      │
┌─────────┼──────────────────────┼──────────────────────┼──────────────────┐
│         │      CAPA DE DATOS   │                      │                  │
├─────────┴──────────────────────┴──────────────────────┴──────────────────┤
│                                                                           │
│                    ┌──────────────────────────┐                          │
│                    │   POSTGRESQL SERVER      │                          │
│                    │                          │                          │
│                    │   Port: 5432             │                          │
│                    └────────────┬─────────────┘                          │
│                                 │                                        │
│         ┌───────────────────────┼───────────────────────┐                │
│         │                       │                       │                │
│    ┌────┴─────────┐    ┌───────┴────────┐    ┌────────┴────────┐       │
│    │ crm_master   │    │ crm_tenant_    │    │ crm_tenant_     │       │
│    │              │    │ mi-empresa-    │    │ ferreteria-     │       │
│    │ • Tenants    │    │ demo           │    │ tornillo        │       │
│    │ • Plans      │    │                │    │                 │       │
│    │ • Billing    │    │ • Users        │    │ • Users         │       │
│    │              │    │ • Products     │    │ • Products      │       │
│    │              │    │ • Invoices     │    │ • Invoices      │       │
│    │              │    │ • Clients      │    │ • Clients       │       │
│    │              │    │ • Stock        │    │ • Stock         │       │
│    │              │    │ • Cash         │    │ • Cash          │       │
│    │              │    │ • ...          │    │ • ...           │       │
│    └──────────────┘    └────────────────┘    └─────────────────┘       │
│                                                                          │
│    Base Master          Base Tenant 1         Base Tenant 2             │
│    (Global)             (Aislada)             (Aislada)                 │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

## 🔄 Flujo de Peticiones

### Petición SaaS Admin

```
Usuario → Frontend (localhost:5173/)
         ↓
         Detecta: NO hay ?mode=crm → Carga SaaS Admin Routes
         ↓
         POST /api/v1/tenants
         Headers: {
           Authorization: Bearer {token}
         }
         ↓
Backend → Express Router → SaaS Routes
         ↓
         Usa Prisma Client → crm_master
         ↓
         Respuesta → Frontend
```

### Petición CRM Tenant

```
Usuario → Frontend (localhost:5173/?mode=crm)
         ↓
         Detecta: ?mode=crm → Carga CRM Tenant Routes
         ↓
         POST /api/v1/sales/invoices
         Headers: {
           Authorization: Bearer {token},
           X-Tenant-Subdomain: mi-empresa-demo
         }
         ↓
Backend → Tenant Middleware
         ↓
         Lee header X-Tenant-Subdomain
         ↓
         Busca tenant en crm_master
         ↓
         Obtiene databaseUrl del tenant
         ↓
         Crea Prisma Client → crm_tenant_mi-empresa-demo
         ↓
         Adjunta req.tenantPrisma
         ↓
         Express Router → Tenant Routes
         ↓
         Controller usa req.tenantPrisma
         ↓
         Respuesta → Frontend
```

## 🗄️ Estructura de Bases de Datos

### Base Master (crm_master)

```sql
-- Tablas principales
Tenant {
  id: String (UUID)
  name: String
  subdomain: String (UNIQUE)
  databaseUrl: String
  planId: String
  isActive: Boolean
  createdAt: DateTime
  updatedAt: DateTime
}

Plan {
  id: String (UUID)
  name: String
  price: Decimal
  features: Json
  limits: Json
}

Billing {
  id: String (UUID)
  tenantId: String
  amount: Decimal
  status: String
  dueDate: DateTime
}
```

### Base Tenant (crm_tenant_{subdomain})

```sql
-- Tablas operativas (cada tenant tiene su propia copia)
User {
  id: String (UUID)
  email: String (UNIQUE)
  name: String
  role: Enum (ADMINISTRATOR, SUPERVISOR, OPERATOR, CASHIER)
  branchId: String
}

Product {
  id: String (UUID)
  name: String
  sku: String
  price: Decimal
  cost: Decimal
  categoryId: String
}

Invoice {
  id: String (UUID)
  number: String
  clientId: String
  total: Decimal
  status: String
  ncf: String
}

Client {
  id: String (UUID)
  name: String
  email: String
  phone: String
  identification: String
}

Stock {
  id: String (UUID)
  productId: String
  branchId: String
  quantity: Int
}

Cash {
  id: String (UUID)
  branchId: String
  userId: String
  openingAmount: Decimal
  closingAmount: Decimal
  status: String
}

-- ... más tablas
```

## 🔐 Seguridad y Aislamiento

### Aislamiento de Datos

1. **Base de Datos Separada por Tenant**
   - Cada tenant tiene su propia base de datos PostgreSQL
   - Imposible acceder a datos de otro tenant
   - Backups independientes

2. **Prisma Client Dinámico**
   - Se crea un cliente Prisma específico por petición
   - Usa la URL de conexión del tenant
   - Se destruye al finalizar la petición

3. **Middleware de Tenant**
   - Valida subdomain en cada petición
   - Verifica que el tenant existe y está activo
   - Carga configuración específica del tenant

### Autenticación y Autorización

1. **JWT Tokens**
   - Token incluye: userId, tenantId, role
   - Expiración configurable
   - Refresh tokens para sesiones largas

2. **Roles y Permisos**
   - ADMINISTRATOR: Acceso total
   - SUPERVISOR: Operaciones y reportes
   - OPERATOR: Operaciones diarias
   - CASHIER: Caja y ventas básicas

3. **Headers de Seguridad**
   - `Authorization: Bearer {token}` - Autenticación
   - `X-Tenant-Subdomain: {subdomain}` - Identificación del tenant

## 🚀 Escalabilidad

### Horizontal

- Múltiples instancias del backend detrás de load balancer
- Cada instancia puede manejar cualquier tenant
- Session store compartido (Redis)

### Vertical

- Bases de datos de tenants grandes pueden moverse a servidores dedicados
- Caché de configuración de tenants
- Pool de conexiones optimizado

### Estrategias de Crecimiento

1. **Pocos Tenants Grandes**
   - Base de datos dedicada por tenant
   - Servidor PostgreSQL dedicado si es necesario
   - Recursos garantizados

2. **Muchos Tenants Pequeños**
   - Múltiples tenants en mismo servidor PostgreSQL
   - Bases de datos separadas pero mismo host
   - Recursos compartidos eficientemente

## 📊 Monitoreo

### Métricas por Tenant

- Número de usuarios activos
- Volumen de transacciones
- Uso de almacenamiento
- Tiempo de respuesta promedio

### Métricas Globales

- Total de tenants activos
- Ingresos mensuales recurrentes (MRR)
- Tasa de crecimiento
- Disponibilidad del sistema

## 🔧 Mantenimiento

### Migraciones de Base de Datos

```bash
# Migración en base master
npx prisma migrate deploy

# Migración en todas las bases de tenants
# (Script personalizado que itera sobre todos los tenants)
node scripts/migrate-all-tenants.js
```

### Backups

- **Master DB**: Backup diario completo
- **Tenant DBs**: Backup según plan del cliente
  - Plan Básico: Semanal
  - Plan Pro: Diario
  - Plan Enterprise: Continuo

### Actualizaciones

1. Backend se actualiza una vez (afecta a todos)
2. Frontend se actualiza una vez (afecta a todos)
3. Migraciones de DB se ejecutan por tenant
4. Rollback por tenant si es necesario

---

**Ventajas de esta Arquitectura:**

✅ **Aislamiento Total**: Datos de cada cliente completamente separados
✅ **Escalabilidad**: Fácil agregar nuevos tenants
✅ **Seguridad**: Imposible acceder a datos de otro tenant
✅ **Personalización**: Cada tenant puede tener configuraciones únicas
✅ **Backups Independientes**: Restauración selectiva por tenant
✅ **Cumplimiento**: Facilita GDPR y regulaciones de privacidad
✅ **Performance**: Queries optimizados por tenant
✅ **Mantenimiento**: Código compartido, datos separados
