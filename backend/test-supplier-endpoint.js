const { Pool } = require('pg');

async function testSupplierEndpoint() {
  const pool = new Pool({
    connectionString: 'postgresql://postgres:postgres@localhost:5434/crm_tenant_mi_empresa_demo'
  });

  try {
    console.log('🔗 Conectando a BD del tenant...');
    
    // Verificar conexión
    const dbResult = await pool.query('SELECT current_database()');
    console.log('✅ Conectado a:', dbResult.rows[0].current_database);
    
    // Ejecutar la consulta de proveedores
    const result = await pool.query(`
      SELECT 
        s.*,
        COALESCE(COUNT(DISTINCT p.id), 0)::int as "_count_purchases",
        COALESCE(COUNT(DISTINCT si.id), 0)::int as "_count_invoices",
        COALESCE(COUNT(DISTINCT sp.id), 0)::int as "_count_payments"
      FROM "Supplier" s
      LEFT JOIN "Purchase" p ON p."supplierId" = s.id
      LEFT JOIN "SupplierInvoice" si ON si."supplierId" = s.id
      LEFT JOIN "SupplierPayment" sp ON sp."supplierId" = s.id
      GROUP BY s.id
      ORDER BY s.name ASC
    `);
    
    console.log('\n✅ Consulta exitosa!');
    console.log('📊 Proveedores encontrados:', result.rows.length);
    
    if (result.rows.length > 0) {
      console.log('\n📋 Primer proveedor:');
      console.log('  - ID:', result.rows[0].id);
      console.log('  - Código:', result.rows[0].code);
      console.log('  - Nombre:', result.rows[0].name);
      console.log('  - Email:', result.rows[0].email);
      console.log('  - Compras:', result.rows[0]._count_purchases);
      console.log('  - Facturas:', result.rows[0]._count_invoices);
      console.log('  - Pagos:', result.rows[0]._count_payments);
    }
    
    console.log('\n✅ El código funciona correctamente con pg!');
    console.log('⚠️  El problema es que tsx watch no recarga los cambios.');
    console.log('💡 Solución: Reiniciar manualmente el backend.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

testSupplierEndpoint();
