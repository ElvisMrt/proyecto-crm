# ¿Cómo se Abre la Caja?

## 📋 Guía Paso a Paso

Esta guía explica el proceso completo de apertura de caja, desde la perspectiva del usuario hasta los detalles técnicos.

---

## 🎯 Proceso para el Usuario

### Paso 1: Acceder al Módulo de Caja

1. El usuario inicia sesión en el sistema
2. Navega al módulo **"Caja"** desde el menú principal
3. Se muestra el panel de estado de caja

### Paso 2: Verificar Estado Actual

El sistema muestra automáticamente:
- ✅ **Si hay caja abierta**: Muestra información de la caja actual
- ❌ **Si no hay caja abierta**: Muestra mensaje "Caja Cerrada"

### Paso 3: Ir a la Pestaña "Apertura de Caja"

1. Click en la pestaña **"Apertura de Caja"** (icono de candado abierto)
2. Si ya hay caja abierta, se muestra un mensaje informativo
3. Si no hay caja abierta, se muestra el formulario

### Paso 4: Completar el Formulario

El formulario muestra:

#### Información del Usuario (Automática)
- **Nombre**: Se muestra automáticamente el nombre del usuario logueado
- **Email**: Se muestra automáticamente el email del usuario
- Esta información es **solo informativa** (no editable)

#### Seleccionar Sucursal
- **Campo**: Dropdown con todas las sucursales activas
- **Comportamiento**:
  - Si solo hay **1 sucursal**: Se selecciona automáticamente
  - Si hay **varias sucursales**: El usuario debe elegir
  - Si **no hay sucursales**: Muestra mensaje de error y deshabilita el formulario
- **Validación**: Campo obligatorio

#### Ingresar Monto Inicial
- **Campo**: Input numérico
- **Formato**: RD$ XX,XXX.XX
- **Validación**: 
  - Debe ser >= 0
  - No puede ser negativo
- **Ayuda**: Muestra el monto formateado debajo del campo

#### Observaciones (Opcional)
- **Campo**: Textarea
- **Ejemplos de uso**:
  - "Fondo de caja del día anterior"
  - "Apertura nueva sucursal"
  - "Efectivo contado: RD$ 5,000"

### Paso 5: Confirmar Apertura

1. Click en el botón **"Abrir Caja"** (verde)
2. El sistema valida:
   - ✅ Sucursal seleccionada
   - ✅ Monto inicial válido (>= 0)
   - ✅ No existe otra caja abierta para esa sucursal
   - ✅ Usuario tiene permisos
   - ✅ Usuario tiene acceso a la sucursal seleccionada (si tiene sucursal asignada)

### Paso 6: Confirmación

Si todo es correcto:
- ✅ Mensaje de éxito: "Caja abierta exitosamente"
- ✅ El panel de estado se actualiza automáticamente
- ✅ Muestra "Caja Abierta" con badge verde
- ✅ Muestra información de la caja abierta

---

## 🔧 Proceso Técnico (Backend)

### 1. Validación de Autenticación

```typescript
// El usuario debe estar autenticado
if (!req.user) {
  return res.status(401).json({ error: 'Not authenticated' });
}
```

### 2. Validación de Acceso a Sucursal

```typescript
// Si el usuario tiene sucursal asignada, solo puede abrir en esa sucursal
// (excepto ADMINISTRATOR que puede abrir en cualquier sucursal)
if (req.user?.branchId && req.user.branchId !== data.branchId) {
  if (req.user.role !== 'ADMINISTRATOR') {
    return res.status(403).json({
      error: 'No tiene permisos para abrir caja en esta sucursal'
    });
  }
}
```

### 3. Validación de Caja Existente

```typescript
// Verificar que no haya otra caja abierta para esta sucursal
const existingCash = await prisma.cashRegister.findFirst({
  where: {
    branchId: data.branchId,
    status: 'OPEN',
  },
});

if (existingCash) {
  return res.status(400).json({
    error: 'Ya existe una caja abierta para esta sucursal'
  });
}
```

### 4. Creación del Registro de Caja

```typescript
const cashRegister = await prisma.cashRegister.create({
  data: {
    branchId: data.branchId,           // Sucursal seleccionada
    status: CashStatus.OPEN,           // Estado: ABIERTA
    initialAmount: data.initialAmount, // Monto inicial
    openedBy: req.user.id,             // Usuario que abre (automático)
    openedAt: new Date(),              // Fecha/hora (automático)
    observations: data.observations,    // Observaciones (opcional)
  },
});
```

### 5. Creación del Movimiento de Apertura

```typescript
// Se crea automáticamente un movimiento de tipo OPENING
await prisma.cashMovement.create({
  data: {
    cashRegisterId: cashRegister.id,
    type: 'OPENING',                    // Tipo: Apertura
    concept: 'Apertura de caja',        // Concepto fijo
    amount: data.initialAmount,         // Monto inicial
    method: 'CASH',                     // Método: Efectivo
    userId: req.user.id,                // Usuario (automático)
    observations: data.observations,     // Observaciones (opcional)
  },
});
```

---

## 📊 Datos que se Registran

Cuando se abre una caja, se guardan los siguientes datos:

### En `CashRegister`:
- ✅ **ID único** de la caja
- ✅ **Sucursal** (`branchId`)
- ✅ **Estado**: `OPEN`
- ✅ **Monto inicial** (`initialAmount`)
- ✅ **Usuario que abre** (`openedBy`)
- ✅ **Fecha y hora de apertura** (`openedAt`)
- ✅ **Observaciones** (opcional)

### En `CashMovement`:
- ✅ **Tipo**: `OPENING`
- ✅ **Concepto**: "Apertura de caja"
- ✅ **Monto**: Igual al monto inicial
- ✅ **Método**: `CASH`
- ✅ **Usuario**: Usuario que abrió
- ✅ **Fecha**: Fecha y hora de apertura
- ✅ **Observaciones**: Las mismas que en la caja

---

## ✅ Validaciones que se Realizan

### En el Frontend:
1. ✅ Sucursal seleccionada
2. ✅ Monto inicial >= 0
3. ✅ Formato de campos correcto

### En el Backend:
1. ✅ Usuario autenticado
2. ✅ Usuario tiene permisos (`CASH_OPEN`)
3. ✅ Usuario tiene acceso a la sucursal (si tiene sucursal asignada)
4. ✅ No existe otra caja abierta para esa sucursal
5. ✅ Sucursal existe y está activa
6. ✅ Monto inicial >= 0

---

## ⚠️ Errores Comunes y Soluciones

### Error: "Ya existe una caja abierta para esta sucursal"
**Causa**: Hay otra caja abierta en la misma sucursal  
**Solución**: Cerrar la caja existente primero

### Error: "No tiene permisos para abrir caja en esta sucursal"
**Causa**: El usuario tiene una sucursal asignada diferente  
**Solución**: 
- Seleccionar la sucursal asignada al usuario
- O contactar al administrador para cambiar la asignación

### Error: "No hay sucursales disponibles"
**Causa**: No se han creado sucursales en el sistema  
**Solución**: 
1. Ir a Configuración → Sucursales
2. Crear al menos una sucursal
3. Volver a intentar abrir caja

### Error: "Not authenticated"
**Causa**: El usuario no está logueado o el token expiró  
**Solución**: Cerrar sesión y volver a iniciar sesión

---

## 🎯 Flujo Visual Completo

```
┌─────────────────────────────────────────────────┐
│  USUARIO: Entra a módulo Caja                    │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  SISTEMA: Verifica estado actual                 │
│  - ¿Hay caja abierta?                            │
│    • Si → Muestra información                    │
│    • No → Muestra "Caja Cerrada"                 │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  USUARIO: Click en "Apertura de Caja"            │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  SISTEMA: Muestra formulario                     │
│  - Información del usuario (automática)         │
│  - Selector de sucursal                          │
│  - Campo de monto inicial                        │
│  - Campo de observaciones                        │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  USUARIO: Completa formulario                    │
│  1. Selecciona sucursal                          │
│  2. Ingresa monto inicial                        │
│  3. (Opcional) Agrega observaciones              │
│  4. Click en "Abrir Caja"                        │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  FRONTEND: Valida campos                         │
│  - Sucursal seleccionada?                        │
│  - Monto >= 0?                                   │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  FRONTEND: Envía petición al backend            │
│  POST /api/v1/cash/open                          │
│  {                                               │
│    branchId: "uuid-sucursal",                    │
│    initialAmount: 1000.00,                       │
│    observations: "Apertura del día"               │
│  }                                               │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  BACKEND: Valida petición                        │
│  1. Usuario autenticado?                        │
│  2. Usuario tiene permisos?                      │
│  3. Usuario tiene acceso a sucursal?             │
│  4. ¿Ya hay caja abierta en esa sucursal?       │
│  5. Monto inicial válido?                        │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  BACKEND: Crea registro de caja                 │
│  - CashRegister con status OPEN                 │
│  - Asocia sucursal y usuario                     │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  BACKEND: Crea movimiento de apertura           │
│  - CashMovement tipo OPENING                    │
│  - Monto igual al inicial                        │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  BACKEND: Retorna respuesta                     │
│  {                                               │
│    id: "cash-uuid",                              │
│    branch: { name: "Sucursal Centro" },         │
│    status: "OPEN",                               │
│    initialAmount: 1000.00,                       │
│    openedAt: "2025-01-06T10:00:00Z"              │
│  }                                               │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  FRONTEND: Actualiza estado                     │
│  - Muestra mensaje de éxito                      │
│  - Actualiza panel de estado                    │
│  - Muestra "Caja Abierta"                        │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  ✅ CAJA ABIERTA - Lista para operar            │
└─────────────────────────────────────────────────┘
```

---

## 🔐 Permisos Requeridos

Para abrir caja, el usuario necesita:

### Permiso: `CASH_OPEN`

**Roles que normalmente tienen este permiso**:
- ✅ **ADMINISTRATOR**: Siempre puede abrir
- ✅ **SUPERVISOR**: Puede abrir en su sucursal asignada
- ✅ **CASHIER**: Puede abrir (si tiene permiso específico)

**Validación**:
- Se valida en el backend mediante middleware `requirePermission(PERMISSIONS.CASH_OPEN)`
- Si no tiene permiso, retorna error 403

---

## 📝 Ejemplo Práctico

### Escenario: Usuario "María Cajero" abre caja

1. **María inicia sesión** con email `cajero@crm.com`

2. **Navega a Caja** → Ve "Caja Cerrada"

3. **Click en "Apertura de Caja"** → Ve formulario

4. **Completa formulario**:
   - **Usuario**: "María Cajero" (automático)
   - **Sucursal**: Selecciona "Sucursal Centro"
   - **Monto Inicial**: Ingresa `5000.00`
   - **Observaciones**: "Fondo de caja del día anterior"

5. **Click en "Abrir Caja"**

6. **Sistema valida**:
   - ✅ María está autenticada
   - ✅ María tiene permiso `CASH_OPEN`
   - ✅ No hay otra caja abierta en "Sucursal Centro"
   - ✅ Monto es válido

7. **Sistema crea**:
   - Registro de `CashRegister` con status `OPEN`
   - Movimiento de tipo `OPENING` por RD$ 5,000

8. **María ve**:
   - ✅ Mensaje: "Caja abierta exitosamente"
   - ✅ Panel muestra "Caja Abierta" (verde)
   - ✅ Balance actual: RD$ 5,000
   - ✅ Sucursal: "Sucursal Centro"
   - ✅ Abierta por: "María Cajero"

9. **María puede ahora**:
   - ✅ Realizar ventas
   - ✅ Registrar pagos
   - ✅ Ver movimientos
   - ✅ Registrar entradas/salidas manuales

---

## 🎯 Puntos Importantes

1. **Una caja por sucursal**: No puede haber dos cajas abiertas simultáneamente en la misma sucursal

2. **Usuario automático**: El sistema toma automáticamente el usuario logueado, no se puede cambiar

3. **Fecha automática**: La fecha y hora de apertura se registran automáticamente

4. **No se puede editar**: Una vez abierta, la caja no se puede modificar. Solo se puede cerrar.

5. **Movimiento automático**: Se crea automáticamente un movimiento de apertura con el monto inicial

6. **Validación de acceso**: Si el usuario tiene sucursal asignada, solo puede abrir en esa sucursal (excepto ADMINISTRATOR)

---

## 🔗 Relación con Otros Módulos

### Después de Abrir Caja:

- ✅ **Ventas**: Se pueden realizar ventas (se registran automáticamente en caja)
- ✅ **Pagos**: Se pueden registrar pagos (se registran automáticamente en caja)
- ✅ **Movimientos**: Se pueden registrar movimientos manuales
- ✅ **Dashboard**: Muestra estado de caja abierta

### Antes de Abrir Caja:

- ❌ **Ventas**: No se pueden realizar ventas al contado
- ❌ **Pagos en efectivo**: No se pueden registrar
- ❌ **Movimientos**: No se pueden registrar movimientos manuales

---

## 📱 Interfaz Visual

### Estado: Caja Cerrada
```
┌─────────────────────────────────────┐
│  🔒 Caja Cerrada                     │
│                                      │
│  [Abrir Caja] ← Click aquí          │
└─────────────────────────────────────┘
```

### Formulario de Apertura
```
┌─────────────────────────────────────┐
│  Abrir Caja                          │
│                                      │
│  Usuario Actual:                     │
│  👤 María Cajero                     │
│  📧 cajero@crm.com                   │
│                                      │
│  Sucursal *                          │
│  [Sucursal Centro ▼]                 │
│                                      │
│  Monto Inicial (RD$) *              │
│  [5000.00]                           │
│  RD$ 5,000.00                        │
│                                      │
│  Observaciones                       │
│  [Fondo de caja del día anterior]   │
│                                      │
│  [Abrir Caja]                        │
└─────────────────────────────────────┘
```

### Estado: Caja Abierta
```
┌─────────────────────────────────────┐
│  🔓 Caja Abierta                     │
│                                      │
│  Sucursal: Sucursal Centro          │
│  Balance: RD$ 5,000                  │
│  Abierta por: María Cajero          │
│  Fecha: 06/01/2025 10:00 AM         │
│                                      │
│  Ingresos: RD$ 0                     │
│  Egresos: RD$ 0                      │
└─────────────────────────────────────┘
```

---

## ❓ Preguntas Frecuentes

### ¿Puedo abrir caja sin efectivo inicial?
**Sí**, puedes abrir con monto inicial de RD$ 0.00

### ¿Puedo cambiar el monto inicial después de abrir?
**No**, una vez abierta la caja, no se puede modificar. Solo se puede cerrar.

### ¿Qué pasa si olvido cerrar la caja?
La caja queda abierta hasta que se cierre. El sistema no la cierra automáticamente.

### ¿Puedo abrir caja en otra sucursal si tengo una asignada?
**Solo si eres ADMINISTRATOR**. Los demás usuarios solo pueden abrir en su sucursal asignada.

### ¿Puedo tener dos cajas abiertas en diferentes sucursales?
**Sí**, pero cada caja debe ser de una sucursal diferente. No puede haber dos cajas abiertas en la misma sucursal.

---

**Última actualización**: Enero 2025











