const { Pool } = require('pg');
require('dotenv').config();

async function createTestInvoices() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log('Conectando a la base de datos...');

    // Buscar o crear un proveedor
    let result = await pool.query(`
      SELECT * FROM "Supplier" WHERE code = 'PROV001' LIMIT 1
    `);

    let supplierId;
    if (result.rows.length === 0) {
      console.log('Creando proveedor de prueba...');
      result = await pool.query(`
        INSERT INTO "Supplier" (id, code, name, email, phone, "isActive", country, "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), 'PROV001', 'Proveedor Demo', 'proveedor@demo.com', '809-555-1234', true, 'DO', NOW(), NOW())
        RETURNING id, name
      `);
      supplierId = result.rows[0].id;
      console.log('Proveedor creado:', result.rows[0].name);
    } else {
      supplierId = result.rows[0].id;
      console.log('Usando proveedor existente:', result.rows[0].name);
    }

    // Crear facturas de prueba
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const invoices = [
      {
        code: 'FINV-001',
        invoiceDate: lastWeek.toISOString(),
        dueDate: yesterday.toISOString(),
        subtotal: 5000,
        total: 5000,
        paid: 0,
        balance: 5000,
        status: 'PENDING',
        notes: 'Factura vencida - Compra de materiales'
      },
      {
        code: 'FINV-002',
        invoiceDate: yesterday.toISOString(),
        dueDate: nextWeek.toISOString(),
        subtotal: 3000,
        total: 3000,
        paid: 1000,
        balance: 2000,
        status: 'PARTIAL',
        notes: 'Factura parcialmente pagada'
      },
      {
        code: 'FINV-003',
        invoiceDate: today.toISOString(),
        dueDate: nextWeek.toISOString(),
        subtotal: 8000,
        total: 8000,
        paid: 0,
        balance: 8000,
        status: 'PENDING',
        notes: 'Factura pendiente - Próxima a vencer'
      }
    ];

    console.log('\nCreando facturas de prueba...');
    for (const invoice of invoices) {
      const existing = await pool.query(`
        SELECT * FROM "SupplierInvoice" WHERE code = $1
      `, [invoice.code]);

      if (existing.rows.length === 0) {
        await pool.query(`
          INSERT INTO "SupplierInvoice" 
          (id, code, "supplierId", "invoiceDate", "dueDate", subtotal, tax, discount, total, paid, balance, status, notes, "createdAt", "updatedAt")
          VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, 0, 0, $6, $7, $8, $9, $10, NOW(), NOW())
        `, [
          invoice.code,
          supplierId,
          invoice.invoiceDate,
          invoice.dueDate,
          invoice.subtotal,
          invoice.total,
          invoice.paid,
          invoice.balance,
          invoice.status,
          invoice.notes
        ]);
        console.log(`✓ Factura ${invoice.code} creada - Balance: $${invoice.balance}`);
      } else {
        console.log(`- Factura ${invoice.code} ya existe`);
      }
    }

    // Mostrar resumen
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as count,
        SUM(balance) as total_balance
      FROM "SupplierInvoice"
      WHERE balance > 0 AND status IN ('PENDING', 'PARTIAL')
    `);

    const overdueStats = await pool.query(`
      SELECT 
        COUNT(*) as count,
        SUM(balance) as total_balance
      FROM "SupplierInvoice"
      WHERE balance > 0 AND "dueDate" < NOW() AND status IN ('PENDING', 'PARTIAL')
    `);

    console.log('\n=== RESUMEN ===');
    console.log(`Total facturas pendientes: ${stats.rows[0].count}`);
    console.log(`Deuda total: $${stats.rows[0].total_balance || 0}`);
    console.log(`Facturas vencidas: ${overdueStats.rows[0].count}`);
    console.log(`Deuda vencida: $${overdueStats.rows[0].total_balance || 0}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

createTestInvoices();
