# 💰 FUNCIONALIDAD DE PAGOS A COMPRAS - IMPLEMENTADA

## ✅ **CAMBIOS REALIZADOS**

### **1. Schema de Base de Datos**

**Modelo `Purchase` actualizado:**
```prisma
model Purchase {
  // ... campos existentes ...
  paid              Decimal             @default(0) @db.Decimal(12, 2) // ✨ NUEVO
  balance           Decimal             @default(0) @db.Decimal(12, 2) // ✨ NUEVO
  paymentDetails    PurchasePaymentDetail[] // ✨ NUEVO - Pagos aplicados
}
```

**Nuevo modelo `PurchasePaymentDetail`:**
```prisma
model PurchasePaymentDetail {
  id                String              @id @default(uuid())
  paymentId         String
  purchaseId        String
  amount            Decimal             @default(0) @db.Decimal(12, 2)
  createdAt         DateTime            @default(now())
  
  payment           SupplierPayment     @relation(fields: [paymentId], references: [id], onDelete: Cascade)
  purchase          Purchase            @relation(fields: [purchaseId], references: [id])
}
```

**Modelo `SupplierPayment` actualizado:**
```prisma
model SupplierPayment {
  // ... campos existentes ...
  details           SupplierPaymentDetail[]    // Pagos a facturas
  purchaseDetails   PurchasePaymentDetail[]    // ✨ NUEVO - Pagos a compras
}
```

### **2. Migración Aplicada**

✅ Migración: `20260219162552_add_purchase_payments`
- Columnas `paid` y `balance` agregadas a tabla `Purchase`
- Tabla `PurchasePaymentDetail` creada
- Relaciones configuradas correctamente

### **3. Backend - Controller Actualizado**

**`purchase.controller.ts`:**
- Al crear una compra, se inicializa `paid = 0` y `balance = total`

**`supplier-payment.controller.ts`:**
- Ahora acepta parámetro `purchases` además de `invoices`
- Procesa pagos a compras actualizando `paid` y `balance`
- Crea registros en `PurchasePaymentDetail`

## 🎯 **CÓMO FUNCIONA**

### **Flujo de Pago a Compra:**

1. **Usuario crea una compra:**
   - Total: $1000
   - Paid: $0
   - Balance: $1000

2. **Usuario registra un pago:**
   ```json
   POST /api/v1/supplier-payments
   {
     "supplierId": "xxx",
     "amount": 500,
     "paymentMethod": "CASH",
     "purchases": [
       { "purchaseId": "xxx", "amount": 500 }
     ]
   }
   ```

3. **Sistema actualiza la compra:**
   - Paid: $500
   - Balance: $500

4. **Usuario puede abonar más:**
   ```json
   {
     "amount": 500,
     "purchases": [
       { "purchaseId": "xxx", "amount": 500 }
     ]
   }
   ```

5. **Compra queda pagada:**
   - Paid: $1000
   - Balance: $0

## 📊 **ESTRUCTURA DE DATOS**

### **Pago Mixto (Facturas + Compras):**

Puedes pagar facturas Y compras en un solo pago:

```json
POST /api/v1/supplier-payments
{
  "supplierId": "xxx",
  "amount": 1500,
  "paymentMethod": "TRANSFER",
  "invoices": [
    { "invoiceId": "invoice-1", "amount": 1000 }
  ],
  "purchases": [
    { "purchaseId": "purchase-1", "amount": 500 }
  ]
}
```

El sistema valida que: `sum(invoices.amount) + sum(purchases.amount) = amount`

## 🔧 **PRÓXIMOS PASOS PARA COMPLETAR**

### **Frontend (Pendiente):**

1. **Actualizar interface `Purchase`:**
   ```typescript
   interface Purchase {
     // ... campos existentes ...
     paid: number;
     balance: number;
   }
   ```

2. **Modificar `Purchases.tsx`:**
   - Mostrar columnas `Pagado` y `Saldo` en la tabla
   - Agregar botón "Registrar Pago" para compras con balance > 0
   - Crear modal de pago similar al de facturas

3. **Crear componente `PurchasePaymentModal`:**
   - Seleccionar compras pendientes del proveedor
   - Ingresar monto a pagar
   - Distribuir pago entre compras
   - Enviar a `/api/v1/supplier-payments` con parámetro `purchases`

## 🧪 **PRUEBA CON CURL**

```bash
# 1. Crear una compra
curl -X POST http://localhost:3001/api/v1/purchases \
  -H "Content-Type: application/json" \
  -H "x-tenant-subdomain: demo" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "supplierId": "4d70459b-6f39-4bb4-90e6-5eaf0922206d",
    "total": 1000,
    "notes": "Compra de prueba"
  }'

# 2. Registrar pago a la compra
curl -X POST http://localhost:3001/api/v1/supplier-payments \
  -H "Content-Type: application/json" \
  -H "x-tenant-subdomain: demo" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "supplierId": "4d70459b-6f39-4bb4-90e6-5eaf0922206d",
    "amount": 500,
    "paymentMethod": "CASH",
    "purchases": [
      { "purchaseId": "ID_DE_LA_COMPRA", "amount": 500 }
    ]
  }'

# 3. Verificar la compra actualizada
curl http://localhost:3001/api/v1/purchases/ID_DE_LA_COMPRA \
  -H "x-tenant-subdomain: demo" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 📝 **RESUMEN**

✅ **Backend completamente funcional**
- Schema actualizado
- Migración aplicada
- Controllers implementados
- Validaciones agregadas

⏳ **Frontend pendiente**
- Actualizar interfaces TypeScript
- Agregar columnas paid/balance a tabla
- Crear botón y modal de pago
- Integrar con API

**El backend está listo para recibir pagos a compras. Solo falta la interfaz de usuario.**
