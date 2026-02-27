# Guía de Uso - Sistema CRM Multi-Tenant

## 📋 Índice
1. [Accesos y Credenciales](#accesos-y-credenciales)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Plataforma SaaS Admin](#plataforma-saas-admin)
4. [Plataforma CRM Tenant](#plataforma-crm-tenant)
5. [Flujo de Trabajo Completo](#flujo-de-trabajo-completo)
6. [Configuración Avanzada](#configuración-avanzada)

---
🚀 **Acceso Directo al Sistema**

✅ Para acceder al CRM (Tenant Demo):
🔗 URL:      http://localhost:5174/login
📧 Email:    admin@test.com
🔑 Password: admin123
✅ Para acceder al SAAS Admin:
🔗 URL:      http://localhost:5174/login?mode=saas
📧 Email:    superadmin@crm.com
🔑 Password: admin123


*(Por defecto entra al CRM. Para SaaS Admin usa ?mode=saas)*

## 🔑 Accesos y Credenciales

### 🚀 Inicio Rápido

#### **Iniciar el Sistema**

1. **Backend** (Puerto 3001)
```bash
cd backend
npm run dev
```

2. **Frontend** (Puerto 5174)
```bash
cd frontend
npm run dev
```

3. **PostgreSQL** (Puerto 5434)
```bash
docker-compose up -d postgres
```

---

### Enlaces de Acceso

#### **Panel SaaS Admin**
```
URL: http://localhost:5174/
```

**Credenciales:**
```
Email: superadmin@crm.com
Password: admin123
```

---

#### **CRM Tenants** (Empresas)

**IMPORTANTE:** Debes configurar `/etc/hosts` primero:
```bash
sudo nano /etc/hosts
```

Agregar estas líneas:
```
127.0.0.1 mi-empresa-demo.localhost
127.0.0.1 neypier-solution.localhost
```

**Tenants Disponibles:**

**1. Mi Empresa Demo** (Módulo de Proveedores)
```
URL: http://mi-empresa-demo.localhost:5174/

Administrador:
  Email: admin@miempresademo.com
  Password: Admin123!
```

**2. mi-empresa-xyz**
```
URL: http://mi-empresa-xyz.neypier.com:5174/

Administrador:
  Email: admin@miempresaxyz.com
  Password: Admin123!
```

**3. neypier-solution**
```
URL: http://neypier-solution.neypier.com:5174/

Administrador:
  Email: admin@neypier.com
  Password: Admin123!
```

---

### ⚙️ Configuración de `/etc/hosts`

Para que los subdominios funcionen en desarrollo local, agrega estas líneas a tu archivo `/etc/hosts`:

```bash
127.0.0.1 mi-empresa-demo.neypier.com
127.0.0.1 mi-empresa-xyz.neypier.com
127.0.0.1 neypier-solution.neypier.com
```

**Editar el archivo:**
```bash
sudo nano /etc/hosts
```

---

### 🔧 Puertos del Sistema

| Servicio | Puerto | URL |
|----------|--------|-----|
| Backend | 3001 | http://localhost:3001 |
| Frontend | 5174 | http://localhost:5174 |
| PostgreSQL | 5434 | localhost:5434 |
| Redis | 6379 | localhost:6379 |

---

### 📱 Sistema Responsivo

El sistema es **100% responsivo** y funciona en:
- 📱 **Móviles**: Menú hamburguesa, vista de tarjetas
- 📱 **Tablets**: Grid de 2 columnas, navegación optimizada
- 💻 **Desktop**: Vista completa con todas las funcionalidades

**Prueba la responsividad:**
1. Abre DevTools (F12)
2. Activa modo responsive (Cmd+Shift+M)
3. Prueba diferentes dispositivos

---

## 🏗️ Arquitectura del Sistema

El sistema está compuesto por **DOS plataformas independientes**:

### 1. **SaaS Admin** (Administración Multi-Tenant)
- **Propósito**: Gestionar múltiples empresas/tenants
- **Usuarios**: Super administradores del sistema
- **Base de Datos**: PostgreSQL principal (`crm_master`)
- **URL Producción**: `admin.neypier.com`
- **URL Desarrollo**: `http://localhost:5173/` (por defecto)

### 2. **CRM Tenant** (Sistema CRM por Empresa)
- **Propósito**: Operaciones diarias de cada empresa
- **Usuarios**: Empleados de cada empresa (Admin, Supervisor, Operador, Cajero)
- **Base de Datos**: Una por tenant (ej: `crm_tenant_mi-empresa-demo`)
- **URL Producción**: `{subdomain}.neypier.com` (ej: `mi-empresa.neypier.com`)
- **URL Desarrollo**: `http://localhost:5173/?mode=crm`

---

## Plataforma SaaS Admin

### Funcionalidades Principales

#### 1. **Gestión de Tenants (Empresas)**
- Crear nuevas empresas/tenants
- Configurar subdominios únicos
- Asignar bases de datos aisladas
- Activar/Desactivar tenants
- Ver estadísticas de uso

#### 2. **Gestión de Planes y Facturación**
- Definir planes de suscripción
- Asignar planes a tenants
- Gestionar pagos y facturación
- Control de límites por plan

#### 3. **Monitoreo del Sistema**
- Dashboard con métricas globales
- Actividad de todos los tenants
- Reportes consolidados
- ✅ Actividad de todos los tenants
- ✅ Reportes consolidados

### Flujo de Uso - SaaS Admin

```
┌─────────────────────────────────────────────────────────────┐
│                    FLUJO SAAS ADMIN                         │
└─────────────────────────────────────────────────────────────┘

1. ACCESO
   └─> URL: http://localhost:5173/
   └─> Login con credenciales de Super Admin
   
2. CREAR NUEVO TENANT
   └─> Ir a "Tenants" > "Nuevo Tenant"
   └─> Completar formulario:
       ├─> Nombre de la empresa
       ├─> Subdomain (único, ej: "mi-empresa")
       ├─> Email del administrador
       ├─> Plan de suscripción
       └─> Información de contacto
   └─> Sistema automáticamente:
       ├─> Crea base de datos: crm_tenant_{subdomain}
       ├─> Ejecuta migraciones de Prisma
       ├─> Crea usuario administrador inicial
       └─> Configura tenant en base master

3. GESTIONAR TENANTS EXISTENTES
   └─> Ver lista de todos los tenants
   └─> Editar información del tenant
   └─> Cambiar plan de suscripción
   └─> Activar/Desactivar tenant
   └─> Ver estadísticas de uso

4. FACTURACIÓN
   └─> Ver pagos pendientes
   └─> Generar facturas
   └─> Gestionar suscripciones

5. MONITOREO
   └─> Dashboard con métricas globales
   └─> Actividad reciente de todos los tenants
```

### Credenciales de Acceso - SaaS Admin

**Desarrollo:**
```
URL: http://localhost:5173/
Email: (configurar en base master)
Password: (configurar en base master)
```

---

## 💼 Plataforma CRM Tenant

### Funcionalidades Principales

#### 1. **Dashboard**
- 📊 Resumen de ventas del día/mes
- 💰 Estado de caja
- 📦 Alertas de inventario bajo
- 📈 Gráficos de rendimiento

#### 2. **Ventas**
- 🧾 Crear facturas
- 📝 Crear cotizaciones
- 🔄 Convertir cotizaciones a facturas
- 📋 Gestión de NCF (República Dominicana)
- 💳 Múltiples métodos de pago

#### 3. **Cuentas por Cobrar**
- 💵 Gestión de facturas pendientes
- 📅 Programar pagos
- 🔔 Recordatorios automáticos
- 📊 Reportes de cobros

#### 4. **Caja**
- 💰 Apertura/Cierre de caja
- 💸 Registro de movimientos
- 📝 Arqueo de caja
- 📊 Reportes de flujo de efectivo

#### 5. **Inventario**
- 📦 Gestión de productos
- 🏷️ Categorías y precios
- 📊 Control de stock
- 🔄 Movimientos de inventario
- ⚠️ Alertas de stock bajo

#### 6. **Clientes**
- 👥 Base de datos de clientes
- 📞 Información de contacto
- 📊 Historial de compras
- 💰 Estado de cuenta

#### 7. **CRM**
- ✅ Gestión de tareas
- 📝 Notas de clientes
- 🔔 Recordatorios
- 📊 Seguimiento de cobros

#### 8. **Reportes**
- 📈 Ventas por período
- 💰 Utilidad y márgenes
- 📊 Inventario
- 💵 Cuentas por cobrar
- 💸 Flujo de caja

#### 9. **Configuración**
- 🏢 Información de la empresa
- 🏪 Gestión de sucursales
- 👤 Usuarios y roles
- 🔢 Secuencias NCF
- ⚙️ Parámetros del sistema

### Flujo de Uso - CRM Tenant

```
┌─────────────────────────────────────────────────────────────┐
│                    FLUJO CRM TENANT                         │
└─────────────────────────────────────────────────────────────┘

1. ACCESO
   └─> URL: http://localhost:5173/?mode=crm
   └─> Login con credenciales del tenant
   
2. CONFIGURACIÓN INICIAL (Primera vez)
   └─> Ir a "Configuración" > "Empresa"
       ├─> Completar datos de la empresa
       ├─> Subir logo
       ├─> Configurar información fiscal
       └─> Guardar
   
   └─> Ir a "Configuración" > "Sucursales"
       ├─> Crear sucursal principal
       └─> Asignar gerente
   
   └─> Ir a "Configuración" > "Usuarios"
       ├─> Crear usuarios del sistema
       ├─> Asignar roles (Admin, Supervisor, Operador, Cajero)
       └─> Asignar sucursales
   
   └─> Ir a "Configuración" > "NCF" (Solo RD)
       ├─> Crear secuencias de comprobantes
       └─> Configurar rangos autorizados

3. GESTIÓN DE INVENTARIO
   └─> Ir a "Inventario" > "Productos"
       ├─> Crear categorías
       ├─> Agregar productos
       ├─> Configurar precios
       ├─> Establecer stock inicial
       └─> Configurar alertas de stock bajo

4. GESTIÓN DE CLIENTES
   └─> Ir a "Clientes"
       ├─> Agregar clientes
       ├─> Completar información de contacto
       └─> Configurar límites de crédito

5. OPERACIONES DIARIAS

   A. APERTURA DE CAJA
      └─> Ir a "Caja" > "Abrir Caja"
          ├─> Ingresar monto inicial
          ├─> Seleccionar sucursal
          └─> Confirmar apertura
   
   B. PROCESO DE VENTA
      └─> Ir a "Ventas" > "Nueva Factura"
          ├─> Seleccionar cliente
          ├─> Agregar productos
          ├─> Aplicar descuentos (opcional)
          ├─> Seleccionar método de pago
          ├─> Generar NCF (si aplica)
          └─> Confirmar venta
          
      └─> Sistema automáticamente:
          ├─> Actualiza inventario
          ├─> Registra en caja
          ├─> Genera comprobante
          └─> Actualiza cuentas por cobrar (si es crédito)
   
   C. GESTIÓN DE COTIZACIONES
      └─> Ir a "Ventas" > "Nueva Cotización"
          ├─> Crear cotización
          ├─> Enviar al cliente
          └─> Convertir a factura cuando se apruebe
   
   D. COBROS
      └─> Ir a "Cuentas por Cobrar"
          ├─> Ver facturas pendientes
          ├─> Registrar pagos parciales/totales
          └─> Generar recibos
   
   E. CIERRE DE CAJA
      └─> Ir a "Caja" > "Cerrar Caja"
          ├─> Realizar arqueo
          ├─> Verificar diferencias
          ├─> Generar reporte de cierre
          └─> Confirmar cierre

6. REPORTES Y ANÁLISIS
   └─> Ir a "Reportes"
       ├─> Resumen General
       ├─> Ventas por período
       ├─> Utilidad diaria
       ├─> Estado de inventario
       ├─> Cuentas por cobrar
       └─> Flujo de caja

7. CRM Y SEGUIMIENTO
   └─> Ir a "CRM"
       ├─> Crear tareas de seguimiento
       ├─> Agregar notas a clientes
       ├─> Programar recordatorios
       └─> Gestionar cobros atrasados
```

### Roles y Permisos - CRM Tenant

#### 🔴 ADMINISTRATOR
- **Acceso**: Total al sistema
- **Permisos**:
  - ✅ Configuración completa
  - ✅ Gestión de usuarios
  - ✅ Todos los módulos
  - ✅ Reportes completos
  - ✅ Modificar precios y descuentos

#### 🟡 SUPERVISOR
- **Acceso**: Operativo y reportes
- **Permisos**:
  - ✅ Ventas y cotizaciones
  - ✅ Inventario
  - ✅ Clientes y CRM
  - ✅ Reportes
  - ✅ Apertura/Cierre de caja
  - ❌ Configuración del sistema
  - ❌ Gestión de usuarios

#### 🟢 OPERATOR
- **Acceso**: Operaciones diarias
- **Permisos**:
  - ✅ Ventas y cotizaciones
  - ✅ Inventario (consulta y movimientos)
  - ✅ Clientes (consulta y edición)
  - ✅ CRM básico
  - ❌ Reportes financieros
  - ❌ Configuración
  - ❌ Caja

#### 🔵 CASHIER
- **Acceso**: Caja y ventas básicas
- **Permisos**:
  - ✅ Ventas (sin descuentos)
  - ✅ Caja (apertura/cierre)
  - ✅ Cobros
  - ❌ Inventario
  - ❌ Configuración
  - ❌ Reportes avanzados

### Credenciales de Acceso - CRM Tenant

**Desarrollo (Tenant: mi-empresa-demo):**
```
URL: http://localhost:5173/?mode=crm
Email: admin@miempresademo.com
Password: admin123
Tenant: mi-empresa-demo
```

---

## 🔄 Flujo de Trabajo Completo

### Escenario: Nueva Empresa se Une al Sistema

```
┌─────────────────────────────────────────────────────────────┐
│              FLUJO COMPLETO: ONBOARDING                     │
└─────────────────────────────────────────────────────────────┘

PASO 1: SUPER ADMIN (SaaS Admin)
└─> Accede a http://localhost:5173/
└─> Crea nuevo tenant "Ferretería El Tornillo"
    ├─> Subdomain: "ferreteria-tornillo"
    ├─> Email admin: admin@ferreteriatornillo.com
    ├─> Plan: Básico
    └─> Sistema crea:
        ├─> Base de datos: crm_tenant_ferreteria-tornillo
        ├─> Usuario admin inicial
        └─> Configuración base

PASO 2: ADMIN DE LA EMPRESA (CRM Tenant)
└─> Recibe email con credenciales
└─> Accede a http://localhost:5173/?mode=crm
└─> Realiza configuración inicial:
    ├─> Completa datos de la empresa
    ├─> Crea sucursales
    ├─> Agrega usuarios
    ├─> Configura NCF (si aplica)
    └─> Carga inventario inicial

PASO 3: OPERADORES (CRM Tenant)
└─> Acceden con sus credenciales
└─> Realizan operaciones diarias:
    ├─> Abren caja
    ├─> Registran ventas
    ├─> Gestionan inventario
    ├─> Realizan cobros
    └─> Cierran caja

PASO 4: SUPERVISORES (CRM Tenant)
└─> Revisan reportes
└─> Analizan rendimiento
└─> Toman decisiones

PASO 5: SUPER ADMIN (SaaS Admin)
└─> Monitorea uso del tenant
└─> Gestiona facturación
└─> Brinda soporte
```

---

## ⚙️ Acceso y Configuración

### Configuración de Desarrollo Local

#### 1. **Configurar Hosts (Opcional para Subdominios)**

**macOS/Linux:**
```bash
sudo nano /etc/hosts
```

Agregar:
```
127.0.0.1   admin.neypier.local
127.0.0.1   mi-empresa-demo.neypier.local
127.0.0.1   ferreteria-tornillo.neypier.local
```

**Windows:**
```
C:\Windows\System32\drivers\etc\hosts
```

#### 2. **Iniciar Servicios**

```bash
# Backend
cd /Users/user/Documents/proyecto-crm/backend
npm run dev

# Frontend
cd /Users/user/Documents/proyecto-crm/frontend
npm run dev
```

#### 3. **Acceder a las Plataformas**

**SaaS Admin:**
- Sin subdomain: `http://localhost:5173/`
- Con subdomain: `http://admin.neypier.local:5173/`

**CRM Tenant:**
- Con parámetro: `http://localhost:5173/?mode=crm`
- Con subdomain: `http://mi-empresa-demo.neypier.local:5173/`

### Variables de Entorno

**Backend (.env):**
```env
DATABASE_URL="postgresql://user:password@localhost:5432/crm_master"
JWT_SECRET="your-secret-key"
PORT=3000
NODE_ENV=development
```

**Frontend (.env):**
```env
VITE_API_URL=http://localhost:3000/api/v1
```

---

## 🔧 Solución de Problemas Comunes

### Problema: "No puedo acceder al CRM, solo veo SaaS Admin"

**Solución:**
- Usa `http://localhost:5173/?mode=crm`
- O configura subdomain en `/etc/hosts`

### Problema: "Error de autenticación"

**Solución:**
- Verifica que el tenant existe en la base master
- Verifica que el usuario existe en la base del tenant
- Verifica que el header `X-Tenant-Subdomain` se envía correctamente

### Problema: "Base de datos no encontrada"

**Solución:**
```bash
# Crear base de datos del tenant
psql -U postgres
CREATE DATABASE crm_tenant_mi_empresa_demo;

# Ejecutar migraciones
cd backend
npx prisma migrate deploy
```

---

## 📚 Recursos Adicionales

- **Documentación de API**: `/backend/API_DOCS.md`
- **Esquema de Base de Datos**: `/backend/prisma/schema.prisma`
- **Manual de Usuario**: Descargable desde el sistema (botón en sidebar)

---

## 🆘 Soporte

Para soporte técnico o consultas:
- Email: soporte@neypier.com
- Documentación: https://docs.neypier.com
- Sistema de tickets: Panel SaaS Admin

---

**Última actualización**: Febrero 2026
**Versión del Sistema**: 1.0.0
