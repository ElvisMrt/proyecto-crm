# 📦 MÓDULO DE PROVEEDORES Y COMPRAS - GUÍA DE USO

## 📋 ÍNDICE
1. [Descripción General](#descripción-general)
2. [Flujo Completo del Módulo](#flujo-completo-del-módulo)
3. [Gestión de Proveedores](#gestión-de-proveedores)
4. [Gestión de Compras](#gestión-de-compras)
5. [Gestión de Facturas](#gestión-de-facturas)
6. [Gestión de Pagos](#gestión-de-pagos)
7. [Casos de Uso Comunes](#casos-de-uso-comunes)
8. [Endpoints del Backend](#endpoints-del-backend)

---

## 🎯 DESCRIPCIÓN GENERAL

El módulo de Proveedores y Compras gestiona todo el ciclo de **cuentas por pagar**, desde la creación de proveedores hasta el pago de facturas.

### **Acceso al Módulo:**
- **Ruta:** `/suppliers-dashboard`
- **Desde Dashboard Principal:** Click en tarjeta "Por Pagar"
- **Menú Principal:** Proveedores y Compras

### **Componentes Principales:**
- **Dashboard:** Vista general con estadísticas
- **Proveedores:** Gestión de proveedores
- **Compras:** Órdenes de compra
- **Facturas Vencidas:** Cuentas por pagar
- **Historial de Pagos:** Registro de pagos realizados

---

## 🔄 FLUJO COMPLETO DEL MÓDULO

```
┌─────────────────┐
│ 1. PROVEEDOR    │
│ Crear/Gestionar │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 2. COMPRA       │
│ Estado: PENDING │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 3. RECIBIR      │
│ Estado: RECEIVED│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 4. FACTURA      │
│ Generar desde   │
│ compra o manual │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 5. PAGO         │
│ Aplicar a       │
│ factura(s)      │
└─────────────────┘
```

---

## 👥 GESTIÓN DE PROVEEDORES

### **Crear Proveedor:**

1. **Ir a:** Tab "Proveedores"
2. **Click:** Botón "Nuevo Proveedor"
3. **Completar:**
   - Código (opcional - se genera automáticamente: PROV0001, PROV0002...)
   - Nombre *
   - RNC/Cédula
   - Email
   - Teléfono
   - Estado (Activo/Inactivo)
4. **Guardar**

### **Información del Proveedor:**
- **Total Comprado:** Suma de todas las compras
- **Saldo Pendiente:** Balance por pagar
- **Facturas Vencidas:** Cantidad de facturas vencidas

### **Acciones Disponibles:**
- ✏️ **Editar:** Modificar datos del proveedor
- 🗑️ **Eliminar:** Solo si no tiene facturas pendientes

---

## 🛒 GESTIÓN DE COMPRAS

### **Crear Orden de Compra:**

1. **Ir a:** Tab "Compras"
2. **Click:** Botón "Nueva Compra"
3. **Completar:**
   - Proveedor * (buscar por nombre)
   - Fecha de compra
   - Total
   - Notas
4. **Guardar**

### **Estados de Compra:**

| Estado | Descripción | Color | Acciones Disponibles |
|--------|-------------|-------|---------------------|
| `PENDING` | Pendiente de recibir | Amarillo | Recibir Compra, Editar, Eliminar |
| `RECEIVED` | Recibida | Verde | Generar Factura, Editar, Eliminar |
| `CANCELLED` | Cancelada | Gris | Editar, Eliminar |

### **Recibir Compra:**

1. **Ubicar compra** con estado PENDING
2. **Click:** Menú de acciones (⋮)
3. **Seleccionar:** "Recibir Compra"
4. **Confirmar**
5. **Resultado:** Estado cambia a RECEIVED

### **Generar Factura desde Compra:**

1. **Ubicar compra** con estado RECEIVED
2. **Click:** Menú de acciones (⋮)
3. **Seleccionar:** "Generar Factura"
4. **Confirmar**
5. **Resultado:** 
   - Se crea factura automáticamente
   - Vinculada a la compra (`purchaseId`)
   - Total = Total de la compra
   - Balance = Total (sin pagar)
   - Estado = PENDING

---

## 📄 GESTIÓN DE FACTURAS

### **Crear Factura Manual:**

1. **Ir a:** Tab "Facturas Vencidas"
2. **Click:** Botón "Nueva Factura"
3. **Completar:**
   - Proveedor *
   - Número de Factura (referencia)
   - Fecha de Emisión *
   - Fecha de Vencimiento *
   - Subtotal *
   - ITBIS (impuesto)
   - Descuento
   - **Total:** Se calcula automáticamente
   - Notas
4. **Guardar**

### **Origen de Facturas:**

| Origen | Badge | Descripción |
|--------|-------|-------------|
| **Compra** | 🔵 Azul | Generada desde una compra recibida |
| **Manual** | ⚪ Gris | Creada manualmente |

### **Estados de Factura:**

| Estado | Descripción | Condición |
|--------|-------------|-----------|
| `PENDING` | Pendiente de pago | Balance > 0, no vencida |
| `PARTIAL` | Parcialmente pagada | 0 < Balance < Total |
| `PAID` | Pagada completamente | Balance = 0 |
| `OVERDUE` | Vencida | Balance > 0 y dueDate < hoy |

### **Cálculos Automáticos:**
```
Total = Subtotal + ITBIS - Descuento
Balance = Total - Pagado
```

---

## 💰 GESTIÓN DE PAGOS

### **Registrar Pago a Proveedor:**

1. **Ir a:** Tab "Historial de Pagos"
2. **Click:** Botón "Registrar Pago"
3. **Seleccionar Proveedor:**
   - Al seleccionar, se cargan facturas pendientes automáticamente
4. **Seleccionar Facturas a Pagar:**
   - ☑️ Marcar checkbox de cada factura
   - 💵 Ingresar monto a aplicar por factura
   - 📊 Ver total aplicado en tiempo real
5. **Completar Datos del Pago:**
   - Fecha *
   - Monto Total del Pago *
   - Método de Pago * (Efectivo, Transferencia, Cheque, Tarjeta)
   - Referencia (número de transferencia/cheque)
   - Notas
6. **Validar:**
   - Total del pago debe coincidir con suma de montos aplicados
7. **Guardar**

### **Proceso Automático al Crear Pago:**

```
1. Se crea registro en SupplierPayment
2. Se crean detalles en SupplierPaymentDetail (por cada factura)
3. Se actualiza cada factura:
   - paid += monto aplicado
   - balance = total - paid
   - Si balance = 0 → estado = PAID
   - Si 0 < balance < total → estado = PARTIAL
4. Se registra movimiento de salida en caja
```

### **Métodos de Pago:**

| Método | Código | Uso |
|--------|--------|-----|
| Efectivo | `CASH` | Pago en efectivo |
| Transferencia | `TRANSFER` | Transferencia bancaria |
| Cheque | `CHECK` | Pago con cheque |
| Tarjeta | `CARD` | Pago con tarjeta |

---

## 📚 CASOS DE USO COMUNES

### **CASO 1: Compra Simple con Pago Inmediato**

```
1. Crear Proveedor: "Ferretería Central"
2. Crear Compra: $5,000
3. Recibir Compra
4. Generar Factura (automática)
5. Registrar Pago: $5,000 completo
   → Factura estado: PAID
```

### **CASO 2: Compra a Crédito con Pagos Parciales**

```
1. Crear Proveedor: "Distribuidora XYZ"
2. Crear Compra: $10,000
3. Recibir Compra
4. Generar Factura (vence en 30 días)
5. Pago 1: $3,000
   → Factura estado: PARTIAL, balance: $7,000
6. Pago 2: $7,000
   → Factura estado: PAID, balance: $0
```

### **CASO 3: Pago Múltiple (Varias Facturas)**

```
1. Proveedor tiene 3 facturas pendientes:
   - FINV-001: $5,000
   - FINV-002: $2,000
   - FINV-003: $8,000
2. Registrar Pago de $10,000:
   - FINV-001: $5,000 → PAID
   - FINV-002: $2,000 → PAID
   - FINV-003: $3,000 → PARTIAL (balance: $5,000)
```

### **CASO 4: Factura Manual (Sin Compra)**

```
1. Proveedor envía factura de servicios
2. Crear Factura Manual:
   - No vinculada a compra
   - Origen: Manual
3. Registrar Pago cuando corresponda
```

---

## 🔌 ENDPOINTS DEL BACKEND

### **Proveedores:**

```
GET    /api/v1/suppliers              # Listar proveedores
GET    /api/v1/suppliers/stats        # Estadísticas
GET    /api/v1/suppliers/:id          # Detalle de proveedor
POST   /api/v1/suppliers              # Crear proveedor
PUT    /api/v1/suppliers/:id          # Actualizar proveedor
DELETE /api/v1/suppliers/:id          # Eliminar proveedor
```

### **Compras:**

```
GET    /api/v1/purchases              # Listar compras
GET    /api/v1/purchases/:id          # Detalle de compra
POST   /api/v1/purchases              # Crear compra
PUT    /api/v1/purchases/:id          # Actualizar compra
DELETE /api/v1/purchases/:id          # Eliminar compra
POST   /api/v1/purchases/:id/receive  # Recibir compra
POST   /api/v1/purchases/:id/create-invoice  # Generar factura
```

### **Facturas de Proveedores:**

```
GET    /api/v1/supplier-invoices              # Listar facturas
GET    /api/v1/supplier-invoices/stats        # Estadísticas
GET    /api/v1/supplier-invoices/:id          # Detalle de factura
POST   /api/v1/supplier-invoices              # Crear factura
PATCH  /api/v1/supplier-invoices/:id/status   # Actualizar estado
```

### **Pagos a Proveedores:**

```
GET    /api/v1/supplier-payments        # Listar pagos
GET    /api/v1/supplier-payments/stats  # Estadísticas
GET    /api/v1/supplier-payments/:id    # Detalle de pago
POST   /api/v1/supplier-payments        # Crear pago
DELETE /api/v1/supplier-payments/:id    # Eliminar/reversar pago
```

---

## 📊 ESTADÍSTICAS DEL DASHBOARD

### **Tarjetas Principales:**

1. **Proveedores**
   - Total de proveedores
   - Proveedores activos

2. **Deuda Total**
   - Suma de todos los balances pendientes
   - Facturas con balance > 0

3. **Vencidas**
   - Deuda vencida (dueDate < hoy)
   - Cantidad de facturas vencidas

4. **Pagado Este Mes**
   - Total pagado en el mes actual
   - Cantidad de pagos realizados

---

## ⚠️ REGLAS DE NEGOCIO

1. ❌ **No se puede eliminar un proveedor** con facturas pendientes
2. ✅ **Una compra debe estar RECEIVED** para generar factura
3. ✅ **El balance de una factura** nunca puede ser negativo
4. ✅ **Los pagos afectan automáticamente** el saldo de caja
5. ✅ **Las facturas vencidas** se calculan automáticamente (dueDate < hoy)
6. ✅ **El estado de la factura** se actualiza automáticamente según el balance
7. ✅ **Una compra solo puede tener una factura** asociada

---

## 🎨 CÓDIGOS DE COLOR

### **Estados de Compra:**
- 🟡 **PENDING:** Amarillo
- 🟢 **RECEIVED:** Verde
- ⚪ **CANCELLED:** Gris

### **Estados de Factura:**
- 🟡 **PENDING:** Amarillo
- 🟠 **PARTIAL:** Naranja
- 🔴 **OVERDUE:** Rojo
- 🟢 **PAID:** Verde

### **Origen de Factura:**
- 🔵 **Compra:** Azul
- ⚪ **Manual:** Gris

---

## 📝 DATOS DE PRUEBA ACTUALES

### **Proveedor:**
- **Código:** PROV001
- **Nombre:** Proveedor Demo

### **Facturas:**
1. **FINV-001:** $5,000 (Vencida)
2. **FINV-002:** $2,000 (Parcial - $1,000 pagado)
3. **FINV-003:** $8,000 (Pendiente)

### **Total Deuda:** $15,000

---

## 🚀 INICIO RÁPIDO

### **Crear Primera Compra:**

```bash
1. Dashboard → Proveedores y Compras
2. Tab "Proveedores" → Nuevo Proveedor
3. Tab "Compras" → Nueva Compra
4. Menú (⋮) → Recibir Compra
5. Menú (⋮) → Generar Factura
6. Tab "Historial de Pagos" → Registrar Pago
```

---

## 📞 SOPORTE

Para más información sobre el sistema, consultar:
- `ESTANDARES_SISTEMA.md` - Estándares del sistema
- `CREDENCIALES_ACCESO.md` - Credenciales de acceso

---

**Última actualización:** Febrero 2026
**Versión del módulo:** 1.0.0
