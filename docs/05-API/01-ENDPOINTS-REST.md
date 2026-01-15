# API REST - Endpoints

Este documento describe los endpoints REST del sistema, organizados por módulo.

---

## 🔐 Autenticación

Todos los endpoints (excepto login) requieren autenticación mediante JWT.

**Header requerido:**
```
Authorization: Bearer <jwt_token>
```

**Headers adicionales:**
```
X-Tenant-Id: <tenant_uuid>  // Identificador del tenant
```

---

## 📋 Convenciones

- **Base URL:** `/api/v1`
- **Métodos HTTP:** GET, POST, PUT, PATCH, DELETE
- **Formato:** JSON
- **Códigos de respuesta:** HTTP estándar (200, 201, 400, 401, 403, 404, 500)

---

## 🔑 Autenticación

### POST /auth/login
Iniciar sesión.

**Request:**
```json
{
  "email": "usuario@empresa.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "usuario@empresa.com",
    "name": "Juan Pérez",
    "role": "OPERATOR"
  },
  "tenant": {
    "id": "uuid",
    "name": "Mi Empresa"
  }
}
```

### POST /auth/logout
Cerrar sesión.

**Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

### GET /auth/me
Obtener información del usuario autenticado.

**Response (200):**
```json
{
  "id": "uuid",
  "email": "usuario@empresa.com",
  "name": "Juan Pérez",
  "role": "OPERATOR",
  "permissions": ["sales:read", "sales:create"]
}
```

---

## 📊 Dashboard

### GET /dashboard/summary
Obtener resumen ejecutivo del dashboard.

**Query params:**
- `branchId` (opcional): Filtrar por sucursal
- `date` (opcional): Fecha específica (default: hoy)

**Response (200):**
```json
{
  "salesToday": {
    "amount": 24500.00,
    "trend": 12.5
  },
  "salesMonth": {
    "amount": 280500.00,
    "progress": 75.5
  },
  "receivables": {
    "total": 34600.00,
    "overdue": 7
  },
  "cash": {
    "currentBalance": 20750.00,
    "status": "OPEN",
    "branch": "Sucursal A"
  },
  "alerts": {
    "overdueInvoices": 5,
    "lowStock": 2,
    "unclosedCash": 1
  }
}
```

### GET /dashboard/sales-trend
Obtener tendencia de ventas.

**Query params:**
- `days` (default: 7): Días a mostrar
- `branchId` (opcional)

**Response (200):**
```json
{
  "period": "last_7_days",
  "data": [
    {
      "date": "2024-04-15",
      "amount": 24500.00
    },
    // ...
  ]
}
```

### GET /dashboard/recent-activity
Obtener actividad reciente.

**Query params:**
- `limit` (default: 10): Cantidad de registros

**Response (200):**
```json
{
  "activities": [
    {
      "date": "2024-04-15T10:30:00Z",
      "type": "INVOICE",
      "reference": "FACE-00123",
      "amount": 9000.00
    },
    // ...
  ]
}
```

---

## 📄 Módulo Ventas

### Facturas

#### GET /sales/invoices
Listar facturas.

**Query params:**
- `page` (default: 1)
- `limit` (default: 10)
- `status` (opcional): ISSUED, PAID, OVERDUE, CANCELLED
- `type` (opcional): FISCAL, NON_FISCAL
- `clientId` (opcional)
- `dateFrom` (opcional)
- `dateTo` (opcional)
- `search` (opcional): Buscar por número o NCF

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "number": "#FA-3221",
      "ncf": "FACE-00131",
      "client": {
        "id": "uuid",
        "name": "Comercial Mendoza"
      },
      "status": "ISSUED",
      "total": 7000.00,
      "balance": 7000.00,
      "issueDate": "2024-04-15T10:00:00Z"
    },
    // ...
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 583,
    "totalPages": 59
  }
}
```

#### GET /sales/invoices/:id
Obtener detalle de factura.

**Response (200):**
```json
{
  "id": "uuid",
  "number": "#FA-3221",
  "ncf": "FACE-00131",
  "client": { /* ... */ },
  "items": [
    {
      "product": { /* ... */ },
      "quantity": 2,
      "price": 3500.00,
      "subtotal": 7000.00
    }
  ],
  "subtotal": 7000.00,
  "tax": 1260.00,
  "total": 8260.00,
  "balance": 8260.00,
  "status": "ISSUED",
  "issueDate": "2024-04-15T10:00:00Z",
  "dueDate": "2024-04-30T10:00:00Z"
}
```

#### POST /sales/invoices
Crear factura.

**Request:**
```json
{
  "clientId": "uuid",
  "type": "FISCAL",
  "paymentMethod": "CREDIT",
  "dueDate": "2024-04-30T10:00:00Z",
  "items": [
    {
      "productId": "uuid",
      "quantity": 2,
      "price": 3500.00,
      "discount": 0
    }
  ],
  "discount": 0,
  "observations": "Notas adicionales"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "number": "#FA-3222",
  "ncf": "FACE-00132",
  // ... datos completos
}
```

#### POST /sales/invoices/:id/cancel
Anular factura.

**Request:**
```json
{
  "reason": "Error en datos del cliente"
}
```

**Response (200):**
```json
{
  "message": "Invoice cancelled successfully",
  "invoice": { /* ... */ }
}
```

### Cotizaciones

#### GET /sales/quotes
Listar cotizaciones.

**Query params:** Similar a facturas

#### POST /sales/quotes
Crear cotización.

#### POST /sales/quotes/:id/convert
Convertir cotización a factura.

**Response (201):**
```json
{
  "invoice": { /* factura creada */ },
  "quote": { /* cotización actualizada */ }
}
```

### Punto de Venta (POS)

#### POST /sales/pos/sell
Realizar venta rápida desde POS.

**Request:**
```json
{
  "clientId": "uuid", // opcional
  "items": [
    {
      "productId": "uuid",
      "quantity": 1
    }
  ],
  "paymentMethod": "CASH",
  "discount": 0
}
```

**Response (201):**
```json
{
  "invoice": { /* factura creada */ },
  "change": 0, // Vuelto (si es efectivo)
  "receipt": "url_to_print"
}
```

### Notas de Crédito

#### GET /sales/credit-notes
Listar notas de crédito.

#### POST /sales/credit-notes
Crear nota de crédito.

**Request:**
```json
{
  "invoiceId": "uuid",
  "reason": "Devolución de producto",
  "items": [
    {
      "productId": "uuid",
      "quantity": 1
    }
  ]
}
```

---

## 💰 Módulo Cuentas por Cobrar

### GET /receivables/status/:clientId
Obtener estado de cuenta de un cliente.

**Response (200):**
```json
{
  "client": { /* ... */ },
  "summary": {
    "totalReceivable": 123400.00,
    "totalOverdue": 45300.00,
    "averageDaysOverdue": 15
  },
  "invoices": [
    {
      "id": "uuid",
      "number": "#FA-3221",
      "total": 9000.00,
      "paid": 0,
      "balance": 9000.00,
      "dueDate": "2024-04-10T10:00:00Z",
      "daysOverdue": 11,
      "status": "OVERDUE"
    },
    // ...
  ]
}
```

### GET /receivables/overdue
Listar facturas vencidas.

**Query params:**
- `days` (opcional): Rango de días (0-30, 31-60, etc.)
- `branchId` (opcional)
- `clientId` (opcional)

**Response (200):**
```json
{
  "data": [
    {
      "client": { /* ... */ },
      "invoice": {
        "number": "#FA-3221",
        "balance": 9000.00,
        "dueDate": "2024-04-10T10:00:00Z",
        "daysOverdue": 11
      }
    },
    // ...
  ]
}
```

### POST /receivables/payments
Registrar pago.

**Request:**
```json
{
  "clientId": "uuid",
  "invoiceIds": ["uuid1", "uuid2"],
  "amount": 5000.00,
  "method": "CASH",
  "reference": "TRF-12345",
  "paymentDate": "2024-04-15T10:00:00Z",
  "observations": "Pago parcial"
}
```

**Response (201):**
```json
{
  "payment": { /* ... */ },
  "invoices": [
    {
      "id": "uuid",
      "balance": 4000.00,
      "status": "ISSUED"
    }
  ]
}
```

### GET /receivables/payments
Listar pagos (historial).

**Query params:**
- `clientId` (opcional)
- `invoiceId` (opcional)
- `dateFrom` (opcional)
- `dateTo` (opcional)

### GET /receivables/summary
Obtener resumen de CxC.

**Response (200):**
```json
{
  "totalReceivable": 123400.00,
  "totalOverdue": 45300.00,
  "delinquentClients": 32,
  "byAge": {
    "0-30": 26300.00,
    "31-60": 12000.00,
    "61-90": 7000.00,
    "90+": 0
  }
}
```

---

## 💵 Módulo Caja

### POST /cash/open
Abrir caja.

**Request:**
```json
{
  "branchId": "uuid",
  "initialAmount": 5000.00,
  "observations": "Apertura del día"
}
```

**Response (201):**
```json
{
  "cashRegister": {
    "id": "uuid",
    "status": "OPEN",
    "initialAmount": 5000.00,
    "openedAt": "2024-04-15T08:00:00Z"
  }
}
```

### GET /cash/current
Obtener caja actual abierta.

**Query params:**
- `branchId` (opcional)

**Response (200):**
```json
{
  "id": "uuid",
  "status": "OPEN",
  "initialAmount": 5000.00,
  "currentBalance": 8250.00,
  "openedAt": "2024-04-15T08:00:00Z",
  "summary": {
    "totalIncome": 15250.00,
    "totalExpenses": 7000.00
  }
}
```

### GET /cash/movements
Listar movimientos de caja.

**Query params:**
- `cashRegisterId` (opcional)
- `date` (opcional)
- `type` (opcional)

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "type": "SALE",
      "concept": "Factura FACE-00130",
      "amount": 1500.00,
      "movementDate": "2024-04-15T12:15:00Z",
      "user": { /* ... */ }
    },
    // ...
  ]
}
```

### POST /cash/movements
Registrar movimiento manual.

**Request:**
```json
{
  "type": "MANUAL_EXIT",
  "concept": "Gastos menores",
  "amount": 200.00,
  "method": "CASH",
  "reason": "Almuerzo",
  "observations": "Efectivo para almuerzo"
}
```

### POST /cash/close
Cerrar caja.

**Request:**
```json
{
  "cashRegisterId": "uuid",
  "countedAmount": 8250.00,
  "observations": "Cierre correcto"
}
```

**Response (200):**
```json
{
  "cashRegister": {
    "id": "uuid",
    "status": "CLOSED",
    "finalAmount": 8250.00,
    "difference": 0,
    "closedAt": "2024-04-15T18:00:00Z"
  },
  "summary": { /* resumen completo */ }
}
```

### GET /cash/history
Listar historial de cajas.

**Query params:**
- `branchId` (opcional)
- `status` (opcional): OPEN, CLOSED
- `dateFrom` (opcional)
- `dateTo` (opcional)

---

## 📦 Módulo Inventario

### Productos

#### GET /inventory/products
Listar productos.

**Query params:**
- `categoryId` (opcional)
- `search` (opcional): Buscar por código o nombre
- `controlsStock` (opcional): true/false

#### GET /inventory/products/:id
Obtener detalle de producto.

#### POST /inventory/products
Crear producto.

**Request:**
```json
{
  "code": "PROD-001",
  "barcode": "1234567890123",
  "name": "Producto Ejemplo",
  "categoryId": "uuid",
  "salePrice": 5000.00,
  "cost": 3000.00,
  "controlsStock": true,
  "minStock": 10,
  "hasTax": true,
  "taxPercent": 18
}
```

#### PUT /inventory/products/:id
Actualizar producto.

### Stock

#### GET /inventory/stock
Obtener stock de productos.

**Query params:**
- `branchId` (opcional)
- `categoryId` (opcional)
- `lowStock` (opcional): true/false (solo bajo stock mínimo)

**Response (200):**
```json
{
  "data": [
    {
      "product": { /* ... */ },
      "quantity": 50,
      "minStock": 20,
      "status": "OK" // OK, LOW, OUT
    },
    // ...
  ]
}
```

#### GET /inventory/movements
Listar movimientos de inventario (Kardex).

**Query params:**
- `productId` (opcional)
- `branchId` (opcional)
- `type` (opcional)
- `dateFrom` (opcional)
- `dateTo` (opcional)

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "product": { /* ... */ },
      "type": "SALE",
      "quantity": -2,
      "balance": 48,
      "documentType": "Invoice",
      "documentId": "uuid",
      "movementDate": "2024-04-15T10:00:00Z",
      "user": { /* ... */ }
    },
    // ...
  ]
}
```

### Ajustes

#### POST /inventory/adjustments
Crear ajuste de inventario.

**Request:**
```json
{
  "branchId": "uuid",
  "type": "ENTRY",
  "reason": "Conteo físico",
  "items": [
    {
      "productId": "uuid",
      "adjustmentQuantity": 5
    }
  ],
  "observations": "Ajuste por conteo"
}
```

**Response (201):**
```json
{
  "adjustment": { /* ... */ },
  "stockUpdated": true
}
```

#### GET /inventory/adjustments
Listar ajustes.

### Alertas

#### GET /inventory/alerts/low-stock
Obtener productos bajo stock mínimo.

**Response (200):**
```json
{
  "data": [
    {
      "product": { /* ... */ },
      "currentStock": 5,
      "minStock": 20,
      "difference": -15
    },
    // ...
  ]
}
```

---

## 👥 Módulo Clientes

### GET /clients
Listar clientes.

**Query params:**
- `search` (opcional): Buscar por nombre o identificación
- `isActive` (opcional): true/false

### GET /clients/:id
Obtener detalle de cliente.

### POST /clients
Crear cliente.

**Request:**
```json
{
  "name": "Cliente Ejemplo",
  "identification": "123456789",
  "email": "cliente@email.com",
  "phone": "809-123-4567",
  "address": "Dirección",
  "creditLimit": 50000.00,
  "creditDays": 30
}
```

### PUT /clients/:id
Actualizar cliente.

---

## 🔐 Módulo Configuración

### Roles y Permisos

#### GET /settings/roles
Listar roles.

#### GET /settings/permissions
Listar todos los permisos disponibles.

**Response (200):**
```json
{
  "permissions": [
    {
      "module": "sales",
      "actions": ["read", "create", "update", "delete", "cancel"]
    },
    // ...
  ]
}
```

---

## 📝 Notas de Implementación

1. **Paginación:** Todos los endpoints de listado soportan paginación con `page` y `limit`.

2. **Filtros:** Usar query params para filtros. No enviar arrays complejos en body para GET.

3. **Validación:** Todos los endpoints deben validar:
   - Autenticación (JWT)
   - Permisos del usuario
   - Tenant context
   - Datos de entrada (usar Zod o similar)

4. **Errores:** Formato estándar de errores:
```json
{
  "error": {
    "code": "INVALID_INPUT",
    "message": "Descripción del error",
    "details": { /* opcional */ }
  }
}
```

5. **Rate Limiting:** Implementar rate limiting para prevenir abuso.

---

**Última actualización:** [Fecha]














