# Guía de Uso - Sistema CRM Multi-Tenant + Website Neypier

## 📋 Índice

1. [Accesos y Credenciales](#accesos-y-credenciales)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Plataforma SaaS Admin](#plataforma-saas-admin)
4. [Productos del Website](#productos-del-website)
5. [Plataforma CRM Tenant](#plataforma-crm-tenant)
6. [Roles y Permisos](#roles-y-permisos)
7. [Flujo de Trabajo Completo](#flujo-de-trabajo-completo)
8. [Infraestructura y Despliegue](#infraestructura-y-despliegue)
9. [Solución de Problemas](#solución-de-problemas)

---

## 🔑 Accesos y Credenciales

### 🌐 URLs de Producción

| Plataforma | URL | Descripción |
|---|---|---|
| **SaaS Admin** | https://admin.neypier.com | Panel de administración del sistema |
| **CRM Neypier** | https://neypier.neypier.com | CRM de Neypier Solution |
| **CRM Landry** | https://landry.neypier.com | CRM del tenant Landry |
| **CRM Demo** | https://demo.neypier.com | Tenant de demostración |
| **Website Público** | https://neypier.com | Sitio web público de Neypier |
| **Backend API** | https://admin.neypier.com/api | API REST del sistema |

---

### 👤 Credenciales por Plataforma

#### **SaaS Admin** — https://admin.neypier.com
```
Email:    superadmin@crm.com
Password: Neypier2024!
```

#### **CRM Neypier** — https://neypier.neypier.com
```
Email:    admin@crm.com
Password: Admin2024!
```

#### **CRM Landry** — https://landry.neypier.com
```
Email:    admin@landry.com
Password: Admin2024!
```

#### **CRM Demo** — https://demo.neypier.com
```
Email:    admin@crm.com
Password: Admin2024!
```

---

## 🏗️ Arquitectura del Sistema

El sistema está compuesto por **tres capas**:

### 1. SaaS Admin
- Panel central de gestión de tenants, facturación y productos del website
- URL: `admin.neypier.com`
- Base de datos: PostgreSQL `crm_master`

### 2. CRM Tenant (por empresa)
- Sistema CRM independiente para cada empresa
- URL: `{subdomain}.neypier.com`
- Base de datos: una DB aislada por tenant (`crm_tenant_{subdomain}`)

### 3. Website Público
- Sitio web de Neypier con catálogo de productos
- URL: `neypier.com`
- Los productos se consumen desde la API del backend

```
┌─────────────────────────────────────────────────────────────┐
│                    INFRAESTRUCTURA                          │
├─────────────────────────────────────────────────────────────┤
│  VPS: 66.94.111.139                                         │
│  ├─ nginx (proxy inverso HTTPS)                             │
│  ├─ backend (Node.js / Express / Prisma)  → puerto 3000     │
│  ├─ frontend (React / Vite)               → puerto 5173     │
│  └─ postgres (PostgreSQL 15)              → puerto 5432     │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Plataforma SaaS Admin

Acceso: https://admin.neypier.com
Credenciales: `superadmin@crm.com` / `Neypier2024!`

### Módulos Disponibles

#### 1. Dashboard
- Métricas globales: total de tenants, usuarios, ventas consolidadas
- Actividad reciente de todos los tenants
- Estado del sistema

#### 2. Gestión de Tenants
- **Listar** todos los tenants con estado, plan y fecha de creación
- **Crear** nuevo tenant:
  - Nombre de la empresa
  - Subdominio único (ej: `mi-empresa` → `mi-empresa.neypier.com`)
  - Email del administrador inicial
  - Plan de suscripción
  - Sistema crea automáticamente la DB y el usuario admin
- **Editar** información del tenant (nombre, plan, estado)
- **Activar / Desactivar** tenant (bloquea el acceso sin borrar datos)
- **Modo Mantenimiento** — muestra mensaje de mantenimiento a los usuarios
- **Ver detalle**: usuarios, facturación, uso

#### 3. Facturación
- Ver pagos y suscripciones por tenant
- Gestionar planes y límites

#### 4. Backups
- Crear backups manuales de la base de datos
- Descargar y restaurar backups

#### 5. Productos del Website *(ver sección dedicada abajo)*

---

## 🛍️ Productos del Website

Esta sección permite gestionar el catálogo de productos que aparece en **https://neypier.com/productos** directamente desde el panel admin, sin tocar código.

### Acceso
1. Ir a https://admin.neypier.com
2. En el menú lateral → **"Productos Website"**

### Funcionalidades

#### Ver y filtrar productos
- Lista de todos los productos con imagen, categoría, precio, colores, tags y estado
- **Filtrar por categoría**: Gorras, Camisetas, Tazas, Termos, Llaveros, Otros
- **Buscar** por nombre en tiempo real

#### Crear producto
1. Clic en **"Nuevo Producto"**
2. Completar el formulario:
   - **Nombre** *(requerido)*
   - **Descripción**
   - **Precio** *(requerido)*
   - **Categoría** *(requerido)*: gorras, tshirts, tazas, termos, llaveros, otros
   - **Imagen**: arrastra y suelta una imagen o haz clic para seleccionarla del explorador
     - Formatos: JPG, PNG, SVG, WebP
     - Tamaño máximo: 5MB
     - También puedes pegar una URL directamente
   - **Colores disponibles**: selecciona de los presets o escribe uno personalizado
   - **Tags**: Más Vendido, Nuevo, Oferta, Tendencia
   - **Activo**: si está desactivado, no aparece en el website
   - **Orden**: número para controlar el orden de aparición
   - **Nota**: texto informativo (ej: "Precio desde")
3. Clic en **"Guardar"**

#### Editar producto
- Clic en el ícono ✏️ de la fila del producto
- Se abre el mismo formulario con los datos actuales
- Al pasar el cursor sobre la imagen → botones de **cambiar** o **quitar** imagen

#### Eliminar producto
- Clic en el ícono 🗑️ de la fila
- Se pide confirmación antes de eliminar

### Cómo se reflejan los cambios en el website
Los productos se cargan en tiempo real desde la API. Al guardar un producto en el panel admin, aparece inmediatamente en https://neypier.com/productos sin necesidad de hacer nada más.

---

## 💼 Plataforma CRM Tenant

Cada empresa accede por su subdominio: `https://{empresa}.neypier.com`

### Módulos del CRM

#### 1. Dashboard
- Resumen de ventas del día / mes
- Estado de caja actual
- Alertas de inventario bajo
- Gráficos de rendimiento

#### 2. Ventas
- **Nueva Factura**: seleccionar cliente → agregar productos → método de pago → generar NCF → confirmar
- **Nueva Cotización**: crear cotización → enviar al cliente → convertir a factura
- **Historial**: buscar, filtrar y ver detalle de todas las ventas

#### 3. Cuentas por Cobrar
- Ver facturas pendientes de cobro
- Registrar pagos parciales o totales
- Generar recibos de pago
- Reportes de cobros por período

#### 4. Caja
- **Apertura de caja**: ingresar monto inicial, seleccionar sucursal
- **Movimientos**: registrar entradas y salidas durante el día
- **Cierre de caja**: arqueo, verificar diferencias, reporte de cierre

#### 5. Inventario
- Gestión de categorías y productos
- Control de stock con alertas de stock bajo
- Movimientos de inventario (entradas, salidas, ajustes)
- Historial de movimientos

#### 6. Clientes
- Base de datos de clientes con información de contacto
- Historial de compras por cliente
- Estado de cuenta y saldo pendiente
- Límites de crédito

#### 7. CRM (Seguimiento)
- Gestión de tareas y recordatorios
- Notas por cliente
- Seguimiento de cobros atrasados
- Actividad reciente

#### 8. Reportes
- Ventas por período
- Utilidad y márgenes
- Estado de inventario
- Cuentas por cobrar
- Flujo de caja

#### 9. Configuración
- **Empresa**: nombre, logo, información fiscal, dirección
- **Sucursales**: crear y gestionar sucursales, asignar gerentes
- **Usuarios**: crear usuarios, asignar roles y sucursales
- **NCF**: secuencias de comprobantes fiscales (República Dominicana)
- **Parámetros**: configuraciones generales del sistema

---

## 👥 Roles y Permisos

| Módulo | 🔴 Admin | 🟡 Supervisor | 🟢 Operador | 🔵 Cajero |
|--------|---------|--------------|------------|---------|
| Dashboard | ✅ | ✅ | ✅ | ✅ |
| Ventas | ✅ | ✅ | ✅ | ✅ (sin descuentos) |
| Cotizaciones | ✅ | ✅ | ✅ | ❌ |
| Cuentas por Cobrar | ✅ | ✅ | ❌ | ✅ |
| Caja | ✅ | ✅ | ❌ | ✅ |
| Inventario | ✅ | ✅ | ✅ (consulta) | ❌ |
| Clientes | ✅ | ✅ | ✅ | ❌ |
| CRM | ✅ | ✅ | ✅ (básico) | ❌ |
| Reportes | ✅ | ✅ | ❌ | ❌ |
| Configuración | ✅ | ❌ | ❌ | ❌ |
| Usuarios | ✅ | ❌ | ❌ | ❌ |

---

## 🔄 Flujo de Trabajo Completo

### Escenario: Incorporar una Nueva Empresa

```
1. SUPER ADMIN (SaaS Admin)
   └─> Ir a Tenants > "Nuevo Tenant"
   └─> Completar: nombre, subdominio, email admin, plan
   └─> El sistema crea automáticamente:
       ├─> Base de datos: crm_tenant_{subdominio}
       ├─> Usuario administrador inicial
       └─> Configuración base del tenant

2. ADMIN DE LA EMPRESA (CRM Tenant)
   └─> Accede a https://{subdominio}.neypier.com
   └─> Configuración inicial:
       ├─> Datos de la empresa (Configuración > Empresa)
       ├─> Crear sucursal principal
       ├─> Agregar usuarios y asignar roles
       ├─> Configurar NCF si aplica (RD)
       └─> Cargar inventario inicial

3. OPERADORES (día a día)
   └─> Abrir caja
   └─> Registrar ventas
   └─> Gestionar inventario
   └─> Registrar cobros
   └─> Cerrar caja

4. SUPERVISOR / ADMIN (análisis)
   └─> Revisar reportes diarios/mensuales
   └─> Gestionar cobros atrasados (CRM)
   └─> Ajustar inventario
```

### Escenario: Actualizar Productos del Website

```
1. SUPER ADMIN (SaaS Admin)
   └─> Ir a "Productos Website"
   └─> Crear / editar producto:
       ├─> Subir imagen (drag & drop)
       ├─> Completar datos
       └─> Guardar
   └─> El website muestra los cambios de inmediato
```

---

## 🖥️ Infraestructura y Despliegue

### Servidor
- **VPS**: 66.94.111.139 (Hostinger)
- **OS**: Ubuntu / Docker Compose
- **Usuario SSH**: `elvis`

### Servicios Docker
```bash
# Ver estado de los contenedores
docker compose ps

# Ver logs del backend
docker compose logs backend --tail=50

# Reiniciar un servicio
docker compose restart backend

# Rebuild completo
docker compose build backend
docker compose up -d backend
```

### Actualizar el sistema (deploy)
```bash
# 1. En local: hacer push de los cambios
git add -A && git commit -m "descripción" && git push origin main

# 2. En el VPS (via SSH)
cd /home/elvis/proyecto-crm
git pull origin main
docker compose build backend frontend
docker compose up -d
```

### Migraciones de Base de Datos
```bash
# Ejecutar migraciones pendientes dentro del contenedor
docker compose exec backend npx prisma migrate deploy

# Seed de productos del website
docker compose exec -T backend npx ts-node prisma/seed-website-products.ts
```

### Variables de Entorno (backend)
```env
DATABASE_URL=postgresql://postgres:{PASSWORD}@postgres:5432/crm_master
JWT_SECRET={SECRET}
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=info@neypier.com
SMTP_PASS={PASSWORD}
```

---

## 🔧 Solución de Problemas

### El website no muestra los productos actualizados
- Verificar que el producto esté **Activo** en el panel de Productos Website
- Comprobar la API: `https://admin.neypier.com/api/website/products`

### No puedo subir imagen al producto
- Verificar que la imagen sea JPG, PNG, SVG o WebP
- El tamaño máximo es **5MB**
- Si el error persiste, usar una URL externa en el campo de texto

### Error 502 Bad Gateway
- El backend se está reiniciando. Esperar 10-15 segundos
- Revisar logs: `docker compose logs backend --tail=20`

### Error de autenticación en el CRM
- Verificar que el tenant esté **Activo** en el SaaS Admin
- Verificar que el usuario existe en la base del tenant
- Si el tenant está en **Modo Mantenimiento**, solo el admin puede entrar

### Base de datos no responde
```bash
# Verificar que postgres esté corriendo
docker compose ps postgres

# Reiniciar si es necesario
docker compose restart postgres
```

### Tenant bloqueado por límite de usuarios/facturas
- Ingresar al SaaS Admin → Tenants → Seleccionar el tenant
- Aumentar el límite correspondiente en la sección de configuración del tenant

---

## 📚 Información Técnica

| Componente | Tecnología |
|---|---|
| Backend | Node.js + Express + TypeScript |
| ORM | Prisma |
| Base de Datos | PostgreSQL 15 |
| Frontend | React + TypeScript + Vite |
| Estilos | Tailwind CSS |
| Proxy | Nginx + Let's Encrypt (HTTPS) |
| Contenerización | Docker Compose |
| Email | Nodemailer + Hostinger SMTP |
| Subida de archivos | Multer |

---

## 🆘 Soporte

- **Email**: info@neypier.com
- **Website**: https://neypier.com

---

**Última actualización**: Febrero 2026
**Versión del Sistema**: 1.2.0
