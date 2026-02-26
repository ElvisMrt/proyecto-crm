import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanup() {
  console.log('🧹 Eliminando cajas y facturas...');
  
  try {
    // Eliminar en orden correcto
    await prisma.cashMovement.deleteMany({});
    console.log('✅ Movimientos de caja eliminados');
    
    await prisma.cashRegister.deleteMany({});
    console.log('✅ Cajas eliminadas');
    
    await prisma.invoiceItem.deleteMany({});
    console.log('✅ Items de facturas eliminados');
    
    await prisma.payment.deleteMany({});
    console.log('✅ Pagos eliminados');
    
    await prisma.invoice.deleteMany({});
    console.log('✅ Facturas eliminadas');
    
    console.log('🎉 Limpieza completada. Ahora puedes eliminar las sucursales.');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanup();
