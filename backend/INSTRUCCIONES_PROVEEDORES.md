# Instrucciones para Configurar el Módulo de Proveedores

## Problema Actual

El módulo de proveedores está mostrando errores 500 porque:
1. PostgreSQL no está corriendo
2. Las tablas del módulo de proveedores no existen en la base de datos del tenant

## Solución

### Paso 1: Iniciar PostgreSQL

```bash
# En macOS con Homebrew
brew services start postgresql@14

# O si usas otra versión
brew services start postgresql

# Verificar que está corriendo
brew services list
```

### Paso 2: Crear las Tablas en la Base de Datos del Tenant

Una vez PostgreSQL esté corriendo, ejecuta:

```bash
cd backend

# Opción 1: Usar Prisma para sincronizar el schema (RECOMENDADO)
npx prisma db push

# Opción 2: Crear una migración
npx prisma migrate dev --name add_supplier_tables
```

### Paso 3: Verificar que las Tablas Existen

```bash
node sync-supplier-schema.js
```

Deberías ver:
```
✅ Tabla Supplier existe
✅ Tabla Purchase existe
✅ Tabla SupplierInvoice existe
✅ Tabla SupplierPayment existe
```

### Paso 4: Reiniciar el Backend

```bash
npm run dev
```

## Tablas Necesarias

El módulo de proveedores requiere estas tablas:

1. **Supplier** - Información de proveedores
2. **Purchase** - Órdenes de compra
3. **PurchaseItem** - Items de las compras
4. **SupplierInvoice** - Facturas de proveedores (cuentas por pagar)
5. **SupplierPayment** - Pagos realizados a proveedores
6. **SupplierPaymentDetail** - Relación entre pagos y facturas

## Endpoints Disponibles

### Proveedores
- `GET /api/v1/suppliers` - Listar proveedores
- `GET /api/v1/suppliers/:id` - Obtener proveedor
- `POST /api/v1/suppliers` - Crear proveedor
- `PUT /api/v1/suppliers/:id` - Actualizar proveedor
- `DELETE /api/v1/suppliers/:id` - Eliminar proveedor
- `GET /api/v1/suppliers/stats` - Estadísticas

### Compras
- `GET /api/v1/purchases` - Listar compras
- `GET /api/v1/purchases/:id` - Obtener compra
- `POST /api/v1/purchases` - Crear compra
- `PUT /api/v1/purchases/:id` - Actualizar compra
- `DELETE /api/v1/purchases/:id` - Eliminar compra

### Facturas de Proveedores
- `GET /api/v1/supplier-invoices` - Listar facturas
- `GET /api/v1/supplier-invoices/:id` - Obtener factura
- `POST /api/v1/supplier-invoices` - Crear factura
- `PUT /api/v1/supplier-invoices/:id` - Actualizar factura
- `DELETE /api/v1/supplier-invoices/:id` - Eliminar factura
- `GET /api/v1/supplier-invoices/stats` - Estadísticas

### Pagos a Proveedores
- `GET /api/v1/supplier-payments` - Listar pagos
- `GET /api/v1/supplier-payments/:id` - Obtener pago
- `POST /api/v1/supplier-payments` - Crear pago
- `DELETE /api/v1/supplier-payments/:id` - Eliminar pago
- `GET /api/v1/supplier-payments/stats` - Estadísticas

## Verificación

Para verificar que todo funciona:

1. Inicia PostgreSQL
2. Ejecuta `npx prisma db push` en el backend
3. Reinicia el backend
4. Accede a `http://mi-empresa-demo.localhost:5174/suppliers-dashboard`
5. No deberías ver errores 500

## Notas

- El backend usa Prisma con multi-tenancy
- Cada tenant tiene su propia base de datos
- Las tablas deben existir en la base de datos del tenant específico
- El tenant de prueba es: `tenant_mi_empresa_demo`
