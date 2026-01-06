# Índice de Documentación

Este documento sirve como índice completo de toda la documentación del sistema.

---

## 📚 Estructura de Documentación

```
docs/
├── 00-INDICE.md                    ← Este archivo
├── 01-ARQUITECTURA-GENERAL.md      ← Arquitectura del sistema
├── 02-MODULOS/                     ← Especificaciones de módulos
├── 03-FLUJOS/                      ← Flujos de negocio
├── 04-DATABASE/                    ← Especificación de base de datos
├── 05-API/                         ← Documentación de API
└── 06-SEGURIDAD/                   ← Seguridad y permisos
```

---

## 📖 Documentos Principales

### 1. Arquitectura General
- **[01-ARQUITECTURA-GENERAL.md](01-ARQUITECTURA-GENERAL.md)**
  - Visión general del sistema
  - Arquitectura multi-tenant
  - Stack tecnológico
  - Estructura de carpetas
  - Seguridad y autenticación
  - Integración entre módulos
  - Escalabilidad

---

## 🧩 Módulos Funcionales

### Dashboard
- **[01-DASHBOARD.md](02-MODULOS/01-DASHBOARD.md)**
  - KPIs principales
  - Alertas críticas
  - Acciones rápidas
  - Gráficos de ventas
  - Actividad reciente

### Ventas
- **[02-VENTAS.md](02-MODULOS/02-VENTAS.md)**
  - Facturas
  - Cotizaciones
  - Punto de Venta (POS)
  - Notas de Crédito
  - Historial/Anulados

### Cuentas por Cobrar
- **[03-CUENTAS-POR-COBRAR.md](02-MODULOS/03-CUENTAS-POR-COBRAR.md)**
  - Estado de Cuenta
  - Registro de Pagos
  - Facturas Vencidas
  - Historial de Pagos
  - Resumen de CxC

### Caja
- **[04-CAJA.md](02-MODULOS/04-CAJA.md)**
  - Apertura de Caja
  - Movimientos de Caja
  - Cierre de Caja
  - Historial de Cajas
  - Resumen Diario

### Inventario
- **[05-INVENTARIO.md](02-MODULOS/05-INVENTARIO.md)**
  - Productos
  - Categorías
  - Stock/Existencias
  - Movimientos (Kardex)
  - Ajustes de Inventario
  - Alertas de Stock

---

## 🔄 Flujos de Negocio

### Flujos Principales
- **[01-FLUJOS-PRINCIPALES.md](03-FLUJOS/01-FLUJOS-PRINCIPALES.md)**
  - Flujo 1: Venta Completa (Contado)
  - Flujo 2: Venta a Crédito
  - Flujo 3: Anulación de Factura
  - Flujo 4: Cotización → Factura
  - Flujo 5: Registro de Pago de CxC
  - Flujo 6: Ajuste de Inventario
  - Flujo 7: Apertura y Cierre de Caja
  - Flujo 8: Alerta de Stock Bajo → Reorden

---

## 🗄️ Base de Datos

### Modelos Prisma
- **[01-MODELOS-PRISMA.md](04-DATABASE/01-MODELOS-PRISMA.md)**
  - Schema Maestro (Tenants, Suscripciones)
  - Schema por Tenant:
    - Usuarios
    - Clientes
    - Ventas (Facturas, Cotizaciones, Notas de Crédito)
    - Cuentas por Cobrar (Pagos)
    - Caja (Cajas, Movimientos)
    - Inventario (Productos, Stock, Movimientos, Ajustes)
    - Configuración (Sucursales, Roles)
    - Auditoría (AuditLog)

---

## 🌐 API REST

### Endpoints REST
- **[01-ENDPOINTS-REST.md](05-API/01-ENDPOINTS-REST.md)**
  - Autenticación
  - Dashboard
  - Ventas (Facturas, Cotizaciones, POS, Notas de Crédito)
  - Cuentas por Cobrar
  - Caja
  - Inventario
  - Clientes
  - Configuración

---

## 🔐 Seguridad

### Roles y Permisos
- **[01-ROLES-Y-PERMISOS.md](06-SEGURIDAD/01-ROLES-Y-PERMISOS.md)**
  - Roles del sistema (Administrador, Supervisor, Operador, Cajero)
  - Permisos granulares por módulo
  - Matriz de permisos
  - Implementación técnica
  - Validaciones y auditoría

---

## 🗺️ Guía de Lectura Recomendada

### Para Arquitectos/Developers:
1. Leer **Arquitectura General**
2. Revisar **Modelos Prisma** (Base de Datos)
3. Estudiar **API REST** (Endpoints)
4. Consultar módulos específicos según necesidad

### Para Product Managers/Analistas:
1. Leer **Arquitectura General** (visión general)
2. Revisar **Módulos Funcionales** (funcionalidades)
3. Estudiar **Flujos Principales** (procesos de negocio)

### Para QA/Testing:
1. Revisar **Flujos Principales** (casos de uso)
2. Consultar **Módulos Funcionales** (reglas de negocio)
3. Estudiar **API REST** (contratos de API)

### Para DevOps:
1. Leer **Arquitectura General** (infraestructura)
2. Revisar **Modelos Prisma** (estructura de datos)
3. Consultar sección de escalabilidad

---

## 📝 Convenciones de la Documentación

- **Módulos:** Cada módulo tiene responsabilidades claras y no se mezclan
- **Permisos:** Se definen como `{módulo}:{acción}`
- **Flujos:** Se describen paso a paso con integraciones
- **API:** Formato REST estándar con JSON
- **Base de Datos:** Multi-tenant con schema por tenant

---

## 🔄 Actualización de Documentación

Este índice y toda la documentación debe actualizarse cuando:
- Se agregan nuevos módulos
- Se modifican flujos de negocio
- Se cambian endpoints de API
- Se actualiza estructura de base de datos
- Se modifican permisos o roles

---

**Última actualización:** 2024



