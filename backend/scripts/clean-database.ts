const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanDatabase() {
  console.log('🧹 Limpiando base de datos...');
  console.log('⚠️  ADVERTENCIA: Esta operación eliminará TODOS los datos excepto usuarios');
  console.log('');

  try {
    // Eliminar en orden para respetar foreign keys
    
    console.log('1. Eliminando movimientos de caja...');
    await prisma.cashMovement.deleteMany({});
    
    console.log('2. Eliminando cajas...');
    await prisma.cashRegister.deleteMany({});
    
    console.log('3. Eliminando pagos...');
    await prisma.payment.deleteMany({});
    
    console.log('4. Eliminando facturas...');
    await prisma.invoice.deleteMany({});
    
    console.log('5. Eliminando items de inventario...');
    await prisma.inventoryMovement.deleteMany({});
    await prisma.inventory.deleteMany({});
    
    console.log('6. Eliminando productos...');
    await prisma.product.deleteMany({});
    
    console.log('7. Eliminando categorías...');
    await prisma.category.deleteMany({});
    
    console.log('8. Eliminando clientes...');
    await prisma.client.deleteMany({});
    
    console.log('9. Eliminando tareas CRM...');
    await prisma.task.deleteMany({});
    
    console.log('10. Eliminando cuentas por cobrar...');
    await prisma.receivable.deleteMany({});
    
    console.log('11. Eliminando sucursales...');
    await prisma.branch.deleteMany({});
    
    console.log('12. Eliminando tenants...');
    await prisma.tenant.deleteMany({});
    
    console.log('');
    console.log('✅ Base de datos limpiada exitosamente');
    console.log('👤 Solo los usuarios permanecen en el sistema');
    
    // Verificar usuarios restantes
    const userCount = await prisma.user.count();
    console.log(`📊 Usuarios en el sistema: ${userCount}`);
    
  } catch (error) {
    console.error('❌ Error limpiando la base de datos:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

cleanDatabase()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
