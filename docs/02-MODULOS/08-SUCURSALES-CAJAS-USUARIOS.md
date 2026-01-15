# Módulo: Sucursales, Cajas y Usuarios

## 🎯 Objetivo del Módulo

Gestionar de forma integrada:
- **Sucursales**: Ubicaciones físicas del negocio
- **Cajas**: Control de efectivo por sucursal
- **Usuarios**: Personal del sistema con asignación a sucursales

Este módulo es fundamental para operaciones multi-sucursal y control de acceso.

---

## 📋 Estado Actual

### ✅ Lo que ya existe:

1. **Sucursales (Branches)**
   - Modelo en base de datos: `Branch`
   - CRUD básico en backend (`settings.controller.ts`)
   - Endpoints: GET, POST, PUT para sucursales
   - Relaciones: Con `Stock`, `Invoice`, `CashRegister`, `InventoryMovement`

2. **Cajas (Cash)**
   - Modelo en base de datos: `CashRegister` y `CashMovement`
   - Apertura y cierre de caja
   - Movimientos de caja
   - Relación con sucursales: Una caja por sucursal

3. **Usuarios (Users)**
   - Modelo en base de datos: `User`
   - CRUD básico en backend
   - Roles: ADMINISTRATOR, SUPERVISOR, OPERATOR, CASHIER
   - Autenticación y permisos

### ❌ Lo que falta:

1. **Asignación de Usuarios a Sucursales**
   - No existe relación directa `User.branchId`
   - No se puede asignar un usuario a una sucursal específica
   - No hay restricción de acceso por sucursal

2. **Gestión Completa de Sucursales**
   - Falta frontend completo para gestión de sucursales
   - Falta validación de sucursales activas
   - Falta historial de cambios en sucursales

3. **Gestión Completa de Usuarios**
   - Falta frontend completo para gestión de usuarios
   - Falta asignación de usuarios a sucursales
   - Falta gestión de permisos por usuario
   - Falta historial de actividad de usuarios

4. **Integración Sucursal-Usuario-Caja**
   - Falta flujo completo: Usuario → Sucursal → Caja
   - Falta validación: Usuario solo puede abrir caja en su sucursal asignada
   - Falta filtrado: Usuario solo ve datos de su sucursal (si aplica)

5. **Reportes y Estadísticas**
   - Falta reporte de cajas por sucursal
   - Falta reporte de usuarios por sucursal
   - Falta estadísticas de actividad por sucursal

---

## 🏗️ Arquitectura Propuesta

### 1. Modelo de Datos

#### Branch (Sucursal) - Mejoras necesarias:

```prisma
model Branch {
  id          String   @id @default(uuid())
  name        String   @unique
  code        String?  @unique // Código corto: "CENTRO", "NORTE"
  address     String?
  phone       String?
  email       String?
  managerId   String?  // Usuario responsable/gerente
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relaciones existentes
  cashRegisters      CashRegister[]
  adjustments        InventoryAdjustment[]
  inventoryMovements InventoryMovement[]
  stocks             Stock[]
  invoices           Invoice[]
  ncfSequences       NcfSequence[]
  
  // Nueva relación
  users              User[] // Usuarios asignados a esta sucursal
  
  manager            User?  @relation("BranchManager", fields: [managerId], references: [id])
  
  @@index([name])
  @@index([code])
  @@index([isActive])
  @@index([managerId])
}
```

#### User (Usuario) - Mejoras necesarias:

```prisma
model User {
  id                   String                @id @default(uuid())
  email                String                @unique
  password             String
  name                 String
  phone                String?
  role                 Role                  @default(OPERATOR)
  branchId             String?               // Nueva: Sucursal asignada
  isActive             Boolean               @default(true)
  lastLogin            DateTime?
  createdAt            DateTime              @default(now())
  updatedAt            DateTime              @updatedAt
  
  // Relaciones existentes
  cashMovements        CashMovement[]
  closedCashRegisters  CashRegister[]        @relation("ClosedCashRegister")
  openedCashRegisters  CashRegister[]        @relation("OpenedCashRegister")
  creditNotes          CreditNote[]
  inventoryAdjustments InventoryAdjustment[]
  inventoryMovements   InventoryMovement[]
  invoices             Invoice[]
  payments             Payment[]
  quotes               Quote[]
  tasks                 Task[]
  
  // Nueva relación
  branch                Branch?              @relation(fields: [branchId], references: [id])
  managedBranches       Branch[]              @relation("BranchManager") // Sucursales que gestiona
  
  @@index([email])
  @@index([role])
  @@index([isActive])
  @@index([branchId]) // Nueva: Índice para filtrado
}
```

---

## 🎯 Funcionalidades a Implementar

### 1. Gestión de Sucursales

#### 1.1 Lista de Sucursales
- Tabla con todas las sucursales
- Columnas: Nombre, Código, Dirección, Teléfono, Gerente, Estado, Acciones
- Filtros: Por estado (Activa/Inactiva), por gerente
- Búsqueda: Por nombre o código

#### 1.2 Crear/Editar Sucursal
- Formulario con campos:
  - Nombre* (obligatorio, único)
  - Código (opcional, único, ej: "CENTRO", "NORTE")
  - Dirección
  - Teléfono
  - Email
  - Gerente (selector de usuarios con rol SUPERVISOR o ADMINISTRATOR)
  - Estado (Activa/Inactiva)
- Validaciones:
  - Nombre único
  - Código único (si se proporciona)
  - Email válido (si se proporciona)

#### 1.3 Vista de Detalle de Sucursal
- Información general
- Estadísticas:
  - Total de usuarios asignados
  - Cajas abiertas/cerradas
  - Ventas del mes
  - Stock total
- Historial de cambios

#### 1.4 Desactivar Sucursal
- Validar que no tenga:
  - Cajas abiertas
  - Usuarios activos asignados
  - Stock pendiente
- Opción de reactivar

---

### 2. Gestión de Usuarios

#### 2.1 Lista de Usuarios
- Tabla con todos los usuarios
- Columnas: Nombre, Email, Rol, Sucursal, Estado, Último acceso, Acciones
- Filtros: Por rol, por sucursal, por estado
- Búsqueda: Por nombre o email

#### 2.2 Crear/Editar Usuario
- Formulario con campos:
  - Nombre* (obligatorio)
  - Email* (obligatorio, único)
  - Teléfono
  - Rol* (ADMINISTRATOR, SUPERVISOR, OPERATOR, CASHIER)
  - Sucursal (selector, opcional)
  - Contraseña* (solo al crear, opcional al editar)
  - Estado (Activo/Inactivo)
- Validaciones:
  - Email único
  - Contraseña mínimo 6 caracteres
  - Si es SUPERVISOR, puede asignarse a sucursal

#### 2.3 Vista de Detalle de Usuario
- Información general
- Estadísticas:
  - Ventas realizadas
  - Cajas abiertas/cerradas
  - Última actividad
- Historial de actividad

#### 2.4 Cambiar Contraseña
- Formulario separado para cambio de contraseña
- Validación de contraseña actual (si es el mismo usuario)
- Nueva contraseña con confirmación

#### 2.5 Desactivar Usuario
- Validar que no tenga:
  - Cajas abiertas
  - Operaciones pendientes
- Opción de reactivar

---

### 3. Integración Sucursal-Usuario-Caja

#### 3.1 Flujo de Apertura de Caja Mejorado

```
1. Usuario intenta abrir caja
   ↓
2. Sistema verifica:
   - ¿Usuario tiene sucursal asignada?
     - Si: Solo puede abrir caja en su sucursal
     - No: Puede abrir en cualquier sucursal (si tiene permisos)
   ↓
3. Sistema valida:
   - ¿Ya hay caja abierta en esa sucursal?
   - ¿Usuario tiene permisos para abrir caja?
   ↓
4. Se crea CashRegister con:
   - branchId: Sucursal seleccionada/asignada
   - openedBy: Usuario actual
```

#### 3.2 Filtrado por Sucursal

**Para usuarios con sucursal asignada:**
- Dashboard: Solo muestra datos de su sucursal
- Ventas: Solo ve facturas de su sucursal
- Inventario: Solo ve stock de su sucursal
- Caja: Solo ve cajas de su sucursal

**Para usuarios sin sucursal (ADMINISTRATOR):**
- Ve todos los datos
- Puede filtrar por sucursal

#### 3.3 Validaciones de Acceso

- **SUPERVISOR con sucursal**: Solo puede gestionar su sucursal
- **OPERATOR con sucursal**: Solo puede operar en su sucursal
- **CASHIER con sucursal**: Solo puede abrir/cerrar caja de su sucursal
- **ADMINISTRATOR**: Acceso total sin restricciones

---

### 4. Gestión de Cajas por Sucursal

#### 4.1 Vista de Cajas por Sucursal
- Lista de todas las cajas agrupadas por sucursal
- Estado de cada caja (Abierta/Cerrada)
- Balance actual
- Usuario responsable

#### 4.2 Historial de Cajas por Sucursal
- Filtro por sucursal
- Filtro por rango de fechas
- Filtro por usuario
- Exportar a Excel/PDF

---

## 📊 Reportes y Estadísticas

### 1. Reporte de Sucursales
- Lista de todas las sucursales
- Estadísticas por sucursal:
  - Total de usuarios
  - Ventas del mes
  - Stock total
  - Cajas abiertas
- Exportar a Excel/PDF

### 2. Reporte de Usuarios por Sucursal
- Lista de usuarios agrupados por sucursal
- Estadísticas por usuario:
  - Ventas realizadas
  - Cajas abiertas/cerradas
  - Última actividad
- Exportar a Excel/PDF

### 3. Reporte de Actividad por Sucursal
- Actividad diaria por sucursal
- Comparación entre sucursales
- Gráficos de tendencias

---

## 🔐 Permisos y Seguridad

### Permisos Necesarios

| Acción | ADMINISTRATOR | SUPERVISOR | OPERATOR | CASHIER |
|--------|--------------|------------|----------|---------|
| Ver sucursales | ✅ | ✅ | ✅ | ✅ |
| Crear sucursal | ✅ | ❌ | ❌ | ❌ |
| Editar sucursal | ✅ | Solo su sucursal | ❌ | ❌ |
| Desactivar sucursal | ✅ | ❌ | ❌ | ❌ |
| Ver usuarios | ✅ | ✅ | ❌ | ❌ |
| Crear usuario | ✅ | ❌ | ❌ | ❌ |
| Editar usuario | ✅ | Solo su sucursal | ❌ | ❌ |
| Desactivar usuario | ✅ | ❌ | ❌ | ❌ |
| Abrir caja | ✅ | ✅ | ✅ | ✅ |
| Cerrar caja | ✅ | ✅ | ❌ | ❌ |

---

## 🗂️ Estructura de Archivos

### Backend

```
backend/src/
├── controllers/
│   ├── branches.controller.ts (nuevo, separado de settings)
│   ├── users.controller.ts (nuevo, separado de settings)
│   └── settings.controller.ts (solo empresa y configuración general)
├── routes/
│   ├── branches.routes.ts (ya existe, mejorar)
│   └── users.routes.ts (nuevo)
└── middleware/
    └── branchAccess.middleware.ts (nuevo, validar acceso por sucursal)
```

### Frontend

```
frontend/src/
├── pages/
│   ├── Settings.tsx (mejorar con tabs)
│   ├── Branches.tsx (nuevo, página dedicada)
│   └── Users.tsx (nuevo, página dedicada)
└── components/
    ├── branches/
    │   ├── BranchesList.tsx
    │   ├── BranchForm.tsx
    │   └── BranchDetail.tsx
    └── users/
        ├── UsersList.tsx
        ├── UserForm.tsx
        └── UserDetail.tsx
```

---

## 📝 Plan de Implementación

### Fase 1: Base de Datos y Backend
1. ✅ Agregar `branchId` a modelo `User`
2. ✅ Agregar `code`, `email`, `managerId` a modelo `Branch`
3. ✅ Crear migración de Prisma
4. ✅ Actualizar seed para incluir relaciones
5. ✅ Crear controladores separados para branches y users
6. ✅ Crear middleware de validación de acceso por sucursal

### Fase 2: Backend - Endpoints
1. ✅ Endpoints completos de branches (CRUD + estadísticas)
2. ✅ Endpoints completos de users (CRUD + cambio de contraseña)
3. ✅ Endpoint de asignación usuario-sucursal
4. ✅ Endpoint de estadísticas por sucursal
5. ✅ Actualizar endpoints de caja para validar sucursal de usuario

### Fase 3: Frontend - Sucursales
1. ✅ Página de lista de sucursales
2. ✅ Formulario de crear/editar sucursal
3. ✅ Vista de detalle de sucursal
4. ✅ Integración con selector de sucursales en otros módulos

### Fase 4: Frontend - Usuarios
1. ✅ Página de lista de usuarios
2. ✅ Formulario de crear/editar usuario
3. ✅ Vista de detalle de usuario
4. ✅ Formulario de cambio de contraseña

### Fase 5: Integración y Validaciones
1. ✅ Actualizar apertura de caja para validar sucursal de usuario
2. ✅ Implementar filtrado por sucursal en todos los módulos
3. ✅ Actualizar dashboard para respetar sucursal de usuario
4. ✅ Implementar middleware de acceso por sucursal

### Fase 6: Reportes
1. ✅ Reporte de sucursales
2. ✅ Reporte de usuarios por sucursal
3. ✅ Reporte de actividad por sucursal

---

## 🎯 Prioridades

### Alta Prioridad (Implementar primero)
1. ✅ Agregar `branchId` a `User` (base de datos)
2. ✅ Asignación de usuarios a sucursales
3. ✅ Validación en apertura de caja (usuario solo puede abrir en su sucursal)
4. ✅ Frontend básico de gestión de sucursales
5. ✅ Frontend básico de gestión de usuarios

### Media Prioridad
1. ✅ Filtrado por sucursal en módulos principales
2. ✅ Estadísticas por sucursal
3. ✅ Historial de cambios

### Baja Prioridad
1. ✅ Reportes avanzados
2. ✅ Comparación entre sucursales
3. ✅ Dashboard por sucursal

---

**Última actualización**: Enero 2025











