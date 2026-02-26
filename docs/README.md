# Sistema CRM + Facturación + Control Operativo

Sistema Web SaaS multi-tenant para gestión empresarial, orientado a MIPYMES de República Dominicana.

---

## 📋 Descripción

Sistema completo de gestión empresarial que integra:
- **CRM:** Gestión de clientes y seguimiento comercial
- **Facturación:** Ventas, facturas fiscales (NCF), cotizaciones
- **Control Operativo:** Caja, inventario, cuentas por cobrar

Con soporte multi-sucursal, multi-tenant y un Panel Maestro (Super Admin) para administración SaaS.

---

## 🎯 Características Principales

- ✅ Gestión completa de ventas y facturación
- ✅ Control de inventario en tiempo real
- ✅ Gestión de caja diaria
- ✅ Cuentas por cobrar con seguimiento de morosidad
- ✅ CRM para seguimiento comercial
- ✅ Reportes y dashboard ejecutivo
- ✅ Cumplimiento fiscal RD (NCF)
- ✅ Multi-sucursal
- ✅ Multi-tenant (SaaS)
- ✅ Control de roles y permisos

---

## 🛠️ Stack Tecnológico

### Frontend
- React 18+
- TypeScript
- Vite
- Tailwind CSS

### Backend
- Node.js
- Express.js
- TypeScript
- REST API

### Base de Datos
- PostgreSQL
- Prisma ORM

### Infraestructura
- Docker
- CI/CD

---

## 📚 Documentación

### 📖 Documentación Principal

1. **[GUIA_DE_USO.md](GUIA_DE_USO.md)** ⭐ **NUEVO**
   - Guía completa de uso de ambas plataformas
   - Flujos de trabajo paso a paso
   - Roles y permisos detallados
   - Credenciales de acceso
   - Solución de problemas

2. **[ARQUITECTURA.md](ARQUITECTURA.md)** ⭐ **NUEVO**
   - Diagramas de arquitectura multi-tenant
   - Flujo de peticiones
   - Estructura de bases de datos
   - Seguridad y aislamiento
   - Escalabilidad

### 📖 Documentación Técnica (docs/)

1. **[Arquitectura General](docs/01-ARQUITECTURA-GENERAL.md)**
   - Visión general del sistema
   - Arquitectura multi-tenant
   - Stack tecnológico
   - Estructura del proyecto

2. **[Módulos Funcionales](docs/02-MODULOS/)**
   - [Dashboard](docs/02-MODULOS/01-DASHBOARD.md)
   - [Ventas](docs/02-MODULOS/02-VENTAS.md)
   - [Cuentas por Cobrar](docs/02-MODULOS/03-CUENTAS-POR-COBRAR.md)
   - [Caja](docs/02-MODULOS/04-CAJA.md)
   - [Inventario](docs/02-MODULOS/05-INVENTARIO.md)

3. **[Flujos de Negocio](docs/03-FLUJOS/)**
   - [Flujos Principales](docs/03-FLUJOS/01-FLUJOS-PRINCIPALES.md)

4. **[Base de Datos](docs/04-DATABASE/)**
   - [Modelos Prisma](docs/04-DATABASE/01-MODELOS-PRISMA.md)

5. **[API REST](docs/05-API/)**
   - [Endpoints REST](docs/05-API/01-ENDPOINTS-REST.md)

6. **[Seguridad](docs/06-SEGURIDAD/)**
   - [Roles y Permisos](docs/06-SEGURIDAD/01-ROLES-Y-PERMISOS.md)

---

## 🚀 Inicio Rápido

### Acceso a las Plataformas

#### 🔵 SaaS Admin (Gestión de Tenants)
```
URL: http://localhost:5173/
Propósito: Administrar múltiples empresas/tenants
```

#### 🟢 CRM Tenant (Sistema Operativo)
```
URL: http://localhost:5173/?mode=crm
Propósito: Operaciones diarias de la empresa
Credenciales de prueba:
  Email: admin@miempresademo.com
  Password: admin123
```

### Servicios Backend
```
API: http://localhost:3000/api/v1
PostgreSQL: localhost:5432
```

📖 **Para más detalles, consulta [GUIA_DE_USO.md](GUIA_DE_USO.md)**

---

## 🧩 Módulos del Sistema

El sistema está organizado en los siguientes módulos:

1. **Dashboard** - Vista ejecutiva con KPIs y alertas
2. **Ventas** - Facturas, cotizaciones, POS, notas de crédito
3. **Cuentas por Cobrar** - Gestión de créditos y cobros
4. **Caja** - Control diario de efectivo
5. **Inventario** - Control de productos y stock
6. **Clientes** - Gestión de clientes
7. **CRM** - Tareas y seguimiento comercial
8. **Reportes** - Reportes y análisis
9. **Configuración** - Usuarios, roles, parámetros
10. **Panel Maestro** - Administración SaaS (Super Admin)

---

## 👥 Roles del Sistema

- **Administrador:** Acceso completo
- **Supervisor:** Supervisión de operaciones
- **Operador:** Operaciones diarias básicas
- **Cajero:** Operaciones de caja y ventas

---

## 🚀 Próximos Pasos

### Fase 1: MVP Core
- [ ] Autenticación y autorización
- [ ] Módulo Clientes
- [ ] Módulo Ventas básico
- [ ] Módulo Caja básico

### Fase 2: Funcionalidad Completa
- [ ] Todos los módulos base
- [ ] Integración entre módulos
- [ ] Reportes básicos

### Fase 3: Optimización y Escala
- [ ] Panel Maestro (Super Admin)
- [ ] Optimizaciones de performance
- [ ] Features avanzadas

---

## 📝 Notas

Este proyecto está en fase de diseño y especificación. La documentación define la arquitectura, módulos, flujos y estructura técnica del sistema antes de la implementación.

---

**Versión:** 1.0.0  
**Última actualización:** 2024














