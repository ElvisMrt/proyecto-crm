# Arquitectura General del Sistema

## 📋 Resumen Ejecutivo

Sistema Web SaaS multi-tenant para gestión empresarial (CRM + Facturación + Control Operativo), orientado a MIPYMES de República Dominicana con soporte multi-sucursal.

**Objetivo:** Proporcionar una plataforma comercial, escalable y profesional que integre gestión de clientes, ventas, inventario, caja y cuentas por cobrar, cumpliendo normativa fiscal de RD.

---

## 🏗️ Arquitectura del Sistema

### Tipo de Aplicación
- **Web Application** (SPA - Single Page Application)
- **Multi-tenant** (Multi-empresa)
- **Acceso por roles y permisos**
- **Preparado para SaaS**

### Arquitectura General
```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENTE (Browser)                        │
│                  React 18 + TypeScript                       │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTPS
┌────────────────────▼────────────────────────────────────────┐
│                  API Gateway / Proxy                         │
│              (Nginx / Express Middleware)                    │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│              BACKEND API (Node.js + Express)                 │
│                  TypeScript + REST API                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Auth     │  │ Business │  │ Multi-   │  │ External │   │
│  │ Service  │  │ Logic    │  │ Tenant   │  │ APIs     │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│              DATABASE (PostgreSQL)                           │
│                  Prisma ORM                                  │
│              Multi-tenant (schema por tenant)                │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Stack Tecnológico

### Frontend
- **Framework:** React 18+
- **Lenguaje:** TypeScript
- **Build Tool:** Vite
- **Estilos:** Tailwind CSS
- **Estado:** React Context + Custom Hooks
- **Routing:** React Router v6
- **HTTP Client:** Axios / Fetch API
- **Componentes:** Componentes reutilizables propios

### Backend
- **Runtime:** Node.js (LTS)
- **Framework:** Express.js
- **Lenguaje:** TypeScript
- **Arquitectura:** REST API
- **Validación:** Zod / Joi
- **Documentación:** Swagger/OpenAPI

### Base de Datos
- **SGBD:** PostgreSQL 14+
- **ORM:** Prisma
- **Estrategia Multi-tenant:** Schema por tenant o tabla tenant_id
- **Migraciones:** Prisma Migrate

### Seguridad
- **Autenticación:** JWT (JSON Web Tokens)
- **Autorización:** RBAC (Role-Based Access Control)
- **Auditoría:** Logs de acciones críticas
- **Encriptación:** HTTPS (TLS 1.3)
- **Validación:** Sanitización de inputs

### Infraestructura
- **Containerización:** Docker + Docker Compose
- **Orquestación:** (Opcional) Kubernetes
- **CI/CD:** GitHub Actions / GitLab CI
- **Despliegue:** VPS / Cloud (AWS, DigitalOcean, etc.)
- **Monitoreo:** (Recomendado) Prometheus + Grafana

---

## 🏛️ Arquitectura Multi-Tenant

### Estrategia de Aislamiento

**Opción Recomendada: Schema por Tenant**
- Cada empresa (tenant) tiene su propio schema en PostgreSQL
- Aislamiento completo de datos
- Escalabilidad horizontal facilitada
- Mejor para SaaS comercial

**Alternativa: Tabla con tenant_id**
- Todos los tenants comparten el mismo schema
- Filtrado por `tenant_id` en cada query
- Más simple pero menos seguro
- Adecuado para MVP o empresas pequeñas

### Estructura de Datos por Tenant
```
Schema: tenant_{uuid}
├── users
├── clients
├── products
├── invoices
├── payments
├── cash_register
├── inventory
├── tasks (crm)
└── ...
```

### Base de Datos Maestra (Super Admin)
```
Schema: master
├── tenants (empresas)
├── subscriptions (planes)
├── billing
└── metrics (agregadas, no datos privados)
```

---

## 🧩 Separación de Responsabilidades

### Principios de Diseño

1. **Single Responsibility Principle (SRP)**
   - Cada módulo tiene un solo propósito
   - Ventas no hace CRM
   - CRM no factura
   - Reportes son solo lectura

2. **Modularidad**
   - Módulos independientes pero integrados
   - APIs claramente definidas entre módulos
   - Fácil mantenimiento y escalabilidad

3. **Separación Frontend/Backend**
   - Frontend: Presentación y lógica de UI
   - Backend: Lógica de negocio y persistencia
   - API REST como contrato

---

## 📦 Estructura de Carpetas del Proyecto

```
proyecto-crm/
├── frontend/
│   ├── src/
│   │   ├── components/       # Componentes reutilizables
│   │   ├── modules/          # Módulos por funcionalidad
│   │   │   ├── dashboard/
│   │   │   ├── sales/
│   │   │   ├── receivables/
│   │   │   ├── cash/
│   │   │   ├── inventory/
│   │   │   ├── clients/
│   │   │   ├── crm/
│   │   │   ├── reports/
│   │   │   └── settings/
│   │   ├── shared/           # Utilidades compartidas
│   │   ├── hooks/            # Custom hooks
│   │   ├── services/         # Servicios API
│   │   ├── types/            # TypeScript types
│   │   └── utils/            # Utilidades
│   ├── public/
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── modules/          # Módulos por funcionalidad
│   │   │   ├── auth/
│   │   │   ├── dashboard/
│   │   │   ├── sales/
│   │   │   ├── receivables/
│   │   │   ├── cash/
│   │   │   ├── inventory/
│   │   │   ├── clients/
│   │   │   ├── crm/
│   │   │   ├── reports/
│   │   │   └── settings/
│   │   ├── middleware/       # Middlewares Express
│   │   ├── services/         # Servicios de negocio
│   │   ├── models/           # Modelos Prisma
│   │   ├── utils/            # Utilidades
│   │   └── types/            # TypeScript types
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   └── package.json
│
├── super-admin/              # Panel Maestro (Super Admin)
│   ├── frontend/
│   └── backend/
│
├── docs/                     # Documentación
│   ├── 01-ARQUITECTURA-GENERAL.md
│   ├── 02-MODULOS/
│   ├── 03-FLUJOS/
│   ├── 04-DATABASE/
│   └── 05-API/
│
├── docker/
│   ├── Dockerfile.frontend
│   ├── Dockerfile.backend
│   └── docker-compose.yml
│
└── README.md
```

---

## 🔐 Seguridad y Autenticación

### Flujo de Autenticación

1. Usuario ingresa credenciales
2. Backend valida y genera JWT
3. JWT contiene: `userId`, `tenantId`, `role`, `permissions`
4. Frontend almacena JWT (localStorage o cookie httpOnly)
5. Cada request incluye JWT en header `Authorization: Bearer <token>`
6. Middleware valida JWT y extrae contexto de tenant

### Middleware de Seguridad

```typescript
// Ejemplo conceptual
middleware:
  - validateJWT
  - extractTenantContext
  - checkPermissions
  - auditLog (para acciones críticas)
```

### Control de Acceso (RBAC)

- **Roles:** Administrador, Supervisor, Operador/Cajero
- **Permisos:** Granulares por módulo y acción
- **Ejemplo:** `sales:create`, `sales:delete`, `inventory:adjust`

---

## 🔄 Integración entre Módulos

### Flujo Típico: Venta Completa

```
1. Usuario crea venta (Módulo Ventas)
   ↓
2. Se reduce stock (Módulo Inventario)
   ↓
3. Si es crédito → Crea cuenta por cobrar (Módulo CxC)
   Si es contado → Ingreso a caja (Módulo Caja)
   ↓
4. Se actualiza dashboard (Módulo Dashboard)
   ↓
5. Se registra actividad (Módulo CRM)
```

**Principio:** Los módulos se comunican vía eventos internos o llamadas directas al servicio, nunca modificando directamente la base de datos de otro módulo.

---

## 📊 Escalabilidad

### Horizontales
- Load balancer frente a múltiples instancias de backend
- CDN para assets estáticos del frontend
- Cache (Redis) para sesiones y datos frecuentes

### Verticales
- Optimización de queries
- Índices en base de datos
- Paginación en listados

---

## 📈 Métricas y Monitoreo

### Métricas Clave
- Uptime del sistema
- Tiempo de respuesta de API
- Uso de recursos (CPU, memoria)
- Errores y excepciones
- Métricas de negocio (por tenant, agregadas)

### Logging
- Logs estructurados (JSON)
- Niveles: ERROR, WARN, INFO, DEBUG
- Rotación de logs
- Almacenamiento centralizado

---

## 🚀 Roadmap de Implementación

### Fase 1: MVP Core
- Autenticación y autorización
- Módulo Clientes
- Módulo Ventas básico
- Módulo Caja básico

### Fase 2: Funcionalidad Completa
- Todos los módulos base
- Integración entre módulos
- Reportes básicos

### Fase 3: Optimización y Escala
- Panel Maestro (Super Admin)
- Optimizaciones de performance
- Features avanzadas

---

## 📝 Notas Finales

Este documento define la arquitectura base del sistema. Cada módulo tendrá su propia especificación detallada en los documentos siguientes.

**Última actualización:** [Fecha]
**Versión:** 1.0.0














