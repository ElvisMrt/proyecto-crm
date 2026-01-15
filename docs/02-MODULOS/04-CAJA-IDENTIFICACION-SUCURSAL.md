# Identificación de Sucursal en Apertura de Caja

## 🔍 ¿Cómo se Identifica la Sucursal?

### Proceso Actual

Actualmente, el sistema identifica la sucursal de la siguiente manera:

#### 1. **Obtención de Sucursales Disponibles**

```typescript
// El frontend consulta todas las sucursales disponibles
GET /api/v1/branches

// Respuesta:
{
  "data": [
    { "id": "uuid-1", "name": "Sucursal Centro" },
    { "id": "uuid-2", "name": "Sucursal Norte" },
    { "id": "uuid-3", "name": "Sucursal Sur" }
  ]
}
```

#### 2. **Selección Manual por el Usuario**

El usuario **debe seleccionar manualmente** la sucursal desde un dropdown:

```
┌─────────────────────────────────────┐
│  Sucursal *                         │
│  ┌───────────────────────────────┐  │
│  │ Seleccione una sucursal    ▼ │  │
│  └───────────────────────────────┘  │
│    • Sucursal Centro                │
│    • Sucursal Norte                 │
│    • Sucursal Sur                   │
└─────────────────────────────────────┘
```

#### 3. **Auto-selección (Si Solo Hay Una)**

Si solo existe **una sucursal** en el sistema, se selecciona automáticamente:

```typescript
if (branches.length === 1) {
  // Se auto-selecciona la única sucursal disponible
  form.branchId = branches[0].id;
}
```

#### 4. **Envío al Backend**

Cuando el usuario confirma la apertura, se envía el `branchId` seleccionado:

```typescript
POST /api/v1/cash/open
{
  "branchId": "uuid-de-la-sucursal-seleccionada",
  "initialAmount": 1000.00,
  "observations": "Apertura del día"
}
```

#### 5. **Validación en el Backend**

El backend valida que:
- ✅ El `branchId` existe en la base de datos
- ✅ No hay otra caja abierta para esa sucursal
- ✅ El usuario tiene permisos

```typescript
// Backend valida
const existingCash = await prisma.cashRegister.findFirst({
  where: {
    branchId: data.branchId,  // ← Sucursal seleccionada
    status: 'OPEN',
  },
});
```

---

## 📊 Flujo Visual Completo

```
┌─────────────────────────────────────────────────────────┐
│  PASO 1: Usuario entra a "Abrir Caja"                   │
│                                                           │
│  Sistema consulta: GET /api/v1/branches                  │
│  ↓                                                        │
│  Obtiene lista de sucursales disponibles                 │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│  PASO 2: Sistema muestra selector                      │
│                                                           │
│  ┌─────────────────────────────────────┐                 │
│  │ Sucursal *                          │                 │
│  │ [Dropdown con todas las sucursales] │                 │
│  └─────────────────────────────────────┘                 │
│                                                           │
│  Si hay 1 sucursal → Auto-selecciona                     │
│  Si hay varias → Usuario debe elegir                     │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│  PASO 3: Usuario selecciona sucursal                     │
│                                                           │
│  Usuario hace click y elige:                             │
│  • "Sucursal Centro" → branchId = "uuid-1"               │
│                                                           │
│  El branchId se guarda en el estado del formulario      │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│  PASO 4: Usuario completa formulario                    │
│                                                           │
│  • Sucursal: "Sucursal Centro" (ya seleccionada)        │
│  • Monto Inicial: RD$ 1,000.00                          │
│  • Observaciones: "Apertura del día"                    │
│                                                           │
│  Click en "Abrir Caja"                                  │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│  PASO 5: Sistema envía al backend                        │
│                                                           │
│  POST /api/v1/cash/open                                  │
│  {                                                       │
│    "branchId": "uuid-1",        ← ID de la sucursal     │
│    "initialAmount": 1000.00,                            │
│    "observations": "Apertura del día"                   │
│  }                                                       │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│  PASO 6: Backend valida y crea                          │
│                                                           │
│  • Valida que branchId existe                            │
│  • Valida que no hay caja abierta para esa sucursal     │
│  • Crea registro de CashRegister con branchId            │
│  • Asocia usuario actual (req.user.id)                  │
│                                                           │
│  CashRegister {                                          │
│    id: "cash-uuid",                                      │
│    branchId: "uuid-1",      ← Sucursal identificada    │
│    openedBy: "user-uuid",   ← Usuario identificado     │
│    status: "OPEN",                                        │
│    initialAmount: 1000.00                                │
│  }                                                       │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 Identificación Final

Una vez abierta la caja, la sucursal queda **identificada y registrada**:

```typescript
// Cuando se consulta la caja actual
GET /api/v1/cash/current

// Respuesta incluye:
{
  "id": "cash-uuid",
  "branch": {
    "id": "uuid-1",
    "name": "Sucursal Centro"  ← Nombre de la sucursal
  },
  "openedBy": {
    "id": "user-uuid",
    "name": "Juan Pérez"       ← Usuario que abrió
  },
  "status": "OPEN",
  "currentBalance": 1500.00
}
```

---

## ⚠️ Situaciones Especiales

### Caso 1: No Hay Sucursales
```
❌ Error: "No hay sucursales disponibles. Contacte al administrador."
```
**Solución**: El administrador debe crear sucursales primero.

### Caso 2: Ya Hay Caja Abierta en esa Sucursal
```
❌ Error: "Ya existe una caja abierta para esta sucursal"
```
**Solución**: Debe cerrar la caja existente primero.

### Caso 3: Usuario Selecciona Sucursal Incorrecta
```
⚠️ El sistema NO valida si el usuario "debería" trabajar en esa sucursal
```
**Solución Actual**: El usuario es responsable de seleccionar correctamente.

---

## 💡 Mejoras Posibles (Futuro)

### Opción 1: Asignación de Sucursal por Usuario
```typescript
// Si el usuario tiene una sucursal asignada
User {
  id: "user-uuid",
  branchId: "uuid-1",  // ← Sucursal asignada
  name: "Juan Pérez"
}

// Auto-seleccionar la sucursal del usuario
if (user.branchId) {
  form.branchId = user.branchId;
}
```

### Opción 2: Filtrado por Permisos
```typescript
// Solo mostrar sucursales donde el usuario tiene permisos
GET /api/v1/branches?userId=user-uuid

// Respuesta filtrada:
{
  "data": [
    { "id": "uuid-1", "name": "Sucursal Centro" }  // Solo esta
  ]
}
```

### Opción 3: Detección por Ubicación
```typescript
// Si hay múltiples sucursales, detectar por IP/ubicación
// y sugerir la más cercana
```

---

## 📝 Resumen

### ¿Cómo se identifica la sucursal?

1. **Manual**: El usuario selecciona la sucursal desde un dropdown
2. **Auto-selección**: Si solo hay una sucursal, se selecciona automáticamente
3. **Validación**: El backend valida que la sucursal existe y no tiene caja abierta
4. **Registro**: La sucursal queda asociada al registro de caja en la base de datos

### ¿Dónde se guarda?

- **Frontend**: En el estado del formulario (`form.branchId`)
- **Backend**: En la tabla `CashRegister` (campo `branchId`)
- **Base de Datos**: Relación `CashRegister.branchId → Branch.id`

### ¿Cómo se muestra después?

- En el panel de estado de caja
- En el historial de cajas
- En los movimientos de caja
- En los reportes

---

**Última actualización**: Enero 2025











