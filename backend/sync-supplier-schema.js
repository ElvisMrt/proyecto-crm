const { PrismaClient } = require('@prisma/client');

// Crear instancia de Prisma para el tenant
const tenantDbUrl = 'postgresql://postgres:postgres@localhost:5434/tenant_mi_empresa_demo';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: tenantDbUrl
    }
  }
});

async function syncSupplierSchema() {
  try {
    console.log('🔄 Verificando conexión a la base de datos del tenant...');
    
    // Verificar conexión
    await prisma.$connect();
    console.log('✅ Conectado a la base de datos del tenant');

    // Verificar si las tablas existen intentando hacer una consulta simple
    try {
      await prisma.$queryRaw`SELECT COUNT(*) FROM "Supplier"`;
      console.log('✅ Tabla Supplier existe');
    } catch (error) {
      console.log('⚠️  Tabla Supplier no existe, necesitas ejecutar migraciones de Prisma');
      console.log('\nEjecuta estos comandos:');
      console.log('1. cd backend');
      console.log('2. npx prisma migrate dev --name add_supplier_tables');
      console.log('\nO si prefieres sincronizar sin crear migración:');
      console.log('npx prisma db push');
    }

    try {
      await prisma.$queryRaw`SELECT COUNT(*) FROM "Purchase"`;
      console.log('✅ Tabla Purchase existe');
    } catch (error) {
      console.log('⚠️  Tabla Purchase no existe');
    }

    try {
      await prisma.$queryRaw`SELECT COUNT(*) FROM "SupplierInvoice"`;
      console.log('✅ Tabla SupplierInvoice existe');
    } catch (error) {
      console.log('⚠️  Tabla SupplierInvoice no existe');
    }

    try {
      await prisma.$queryRaw`SELECT COUNT(*) FROM "SupplierPayment"`;
      console.log('✅ Tabla SupplierPayment existe');
    } catch (error) {
      console.log('⚠️  Tabla SupplierPayment no existe');
    }

    console.log('\n✅ Verificación completada');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.code === 'P1001' || error.message.includes('ECONNREFUSED')) {
      console.log('\n⚠️  PostgreSQL no está corriendo.');
      console.log('Inicia PostgreSQL con: brew services start postgresql@14');
      console.log('O verifica que el servicio esté corriendo.');
    }
  } finally {
    await prisma.$disconnect();
  }
}

syncSupplierSchema()
  .then(() => {
    console.log('\n🎉 Proceso completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error fatal:', error);
    process.exit(1);
  });
