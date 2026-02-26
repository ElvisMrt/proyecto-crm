const { Pool } = require('pg');

// Configuración de la base de datos del tenant
const tenantDbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: 'tenant_mi_empresa_demo' // Base de datos del tenant
};

async function createSupplierTables() {
  const pool = new Pool(tenantDbConfig);
  
  try {
    console.log('🔄 Conectando a la base de datos del tenant...');
    
    // Crear tabla de proveedores
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "Supplier" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "code" TEXT NOT NULL UNIQUE,
        "name" TEXT NOT NULL,
        "taxId" TEXT,
        "email" TEXT,
        "phone" TEXT,
        "address" TEXT,
        "city" TEXT,
        "country" TEXT DEFAULT 'República Dominicana',
        "contactPerson" TEXT,
        "paymentTerms" INTEGER DEFAULT 30,
        "creditLimit" DECIMAL(10,2) DEFAULT 0,
        "isActive" BOOLEAN DEFAULT true,
        "notes" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Tabla Supplier creada');

    // Crear tabla de compras
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "Purchase" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "code" TEXT NOT NULL UNIQUE,
        "supplierId" TEXT NOT NULL,
        "branchId" TEXT,
        "userId" TEXT NOT NULL,
        "purchaseDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "expectedDeliveryDate" TIMESTAMP(3),
        "status" TEXT NOT NULL DEFAULT 'PENDING',
        "subtotal" DECIMAL(10,2) NOT NULL DEFAULT 0,
        "tax" DECIMAL(10,2) NOT NULL DEFAULT 0,
        "discount" DECIMAL(10,2) NOT NULL DEFAULT 0,
        "total" DECIMAL(10,2) NOT NULL DEFAULT 0,
        "notes" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Purchase_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE
      );
    `);
    console.log('✅ Tabla Purchase creada');

    // Crear tabla de items de compra
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "PurchaseItem" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "purchaseId" TEXT NOT NULL,
        "productId" TEXT NOT NULL,
        "quantity" INTEGER NOT NULL,
        "unitCost" DECIMAL(10,2) NOT NULL,
        "subtotal" DECIMAL(10,2) NOT NULL,
        "tax" DECIMAL(10,2) NOT NULL DEFAULT 0,
        "total" DECIMAL(10,2) NOT NULL,
        "receivedQuantity" INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PurchaseItem_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "Purchase"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);
    console.log('✅ Tabla PurchaseItem creada');

    // Crear tabla de facturas de proveedores
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "SupplierInvoice" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "code" TEXT NOT NULL UNIQUE,
        "supplierId" TEXT NOT NULL,
        "purchaseId" TEXT,
        "branchId" TEXT,
        "invoiceDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "dueDate" TIMESTAMP(3) NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'PENDING',
        "subtotal" DECIMAL(10,2) NOT NULL DEFAULT 0,
        "tax" DECIMAL(10,2) NOT NULL DEFAULT 0,
        "discount" DECIMAL(10,2) NOT NULL DEFAULT 0,
        "total" DECIMAL(10,2) NOT NULL DEFAULT 0,
        "paid" DECIMAL(10,2) NOT NULL DEFAULT 0,
        "balance" DECIMAL(10,2) NOT NULL DEFAULT 0,
        "notes" TEXT,
        "reference" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "SupplierInvoice_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT "SupplierInvoice_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "Purchase"("id") ON DELETE SET NULL ON UPDATE CASCADE
      );
    `);
    console.log('✅ Tabla SupplierInvoice creada');

    // Crear tabla de pagos a proveedores
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "SupplierPayment" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "code" TEXT NOT NULL UNIQUE,
        "supplierId" TEXT NOT NULL,
        "branchId" TEXT,
        "userId" TEXT NOT NULL,
        "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "amount" DECIMAL(10,2) NOT NULL,
        "paymentMethod" TEXT NOT NULL,
        "reference" TEXT,
        "notes" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "SupplierPayment_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE
      );
    `);
    console.log('✅ Tabla SupplierPayment creada');

    // Crear tabla de relación entre pagos y facturas
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "SupplierPaymentInvoice" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "paymentId" TEXT NOT NULL,
        "invoiceId" TEXT NOT NULL,
        "amount" DECIMAL(10,2) NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "SupplierPaymentInvoice_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "SupplierPayment"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "SupplierPaymentInvoice_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "SupplierInvoice"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "SupplierPaymentInvoice_paymentId_invoiceId_key" UNIQUE ("paymentId", "invoiceId")
      );
    `);
    console.log('✅ Tabla SupplierPaymentInvoice creada');

    // Crear índices para mejorar el rendimiento
    await pool.query(`
      CREATE INDEX IF NOT EXISTS "Supplier_code_idx" ON "Supplier"("code");
      CREATE INDEX IF NOT EXISTS "Supplier_isActive_idx" ON "Supplier"("isActive");
      CREATE INDEX IF NOT EXISTS "Purchase_supplierId_idx" ON "Purchase"("supplierId");
      CREATE INDEX IF NOT EXISTS "Purchase_status_idx" ON "Purchase"("status");
      CREATE INDEX IF NOT EXISTS "PurchaseItem_purchaseId_idx" ON "PurchaseItem"("purchaseId");
      CREATE INDEX IF NOT EXISTS "SupplierInvoice_supplierId_idx" ON "SupplierInvoice"("supplierId");
      CREATE INDEX IF NOT EXISTS "SupplierInvoice_status_idx" ON "SupplierInvoice"("status");
      CREATE INDEX IF NOT EXISTS "SupplierInvoice_dueDate_idx" ON "SupplierInvoice"("dueDate");
      CREATE INDEX IF NOT EXISTS "SupplierPayment_supplierId_idx" ON "SupplierPayment"("supplierId");
      CREATE INDEX IF NOT EXISTS "SupplierPaymentInvoice_invoiceId_idx" ON "SupplierPaymentInvoice"("invoiceId");
    `);
    console.log('✅ Índices creados');

    console.log('\n✅ ¡Todas las tablas del módulo de proveedores han sido creadas exitosamente!');
    
  } catch (error) {
    console.error('❌ Error al crear las tablas:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

createSupplierTables()
  .then(() => {
    console.log('\n🎉 Proceso completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error fatal:', error);
    process.exit(1);
  });
