import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Limpiando todos los datos excepto usuarios...');

  // Eliminar datos en orden correcto (respetando foreign keys)
  await prisma.auditLog.deleteMany();
  await prisma.cashMovement.deleteMany();
  await prisma.cashRegister.deleteMany();
  await prisma.inventoryMovement.deleteMany();
  await prisma.inventoryAdjustmentItem.deleteMany();
  await prisma.inventoryAdjustment.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.creditNoteItem.deleteMany();
  await prisma.creditNote.deleteMany();
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.quoteItem.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.task.deleteMany();
  await prisma.stock.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.client.deleteMany();
  await prisma.branch.deleteMany();
  await prisma.ncfSequence.deleteMany();
  await prisma.whatsAppTemplate.deleteMany();

  console.log('✅ Datos eliminados exitosamente');

  // Crear usuarios básicos si no existen
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const users = [
    {
      email: 'admin@crm.com',
      password: hashedPassword,
      name: 'Administrador CRM',
      phone: '809-555-0100',
      role: 'ADMINISTRATOR',
    },
    {
      email: 'supervisor@crm.com',
      password: hashedPassword,
      name: 'Supervisor CRM',
      phone: '809-555-0101',
      role: 'SUPERVISOR',
    },
    {
      email: 'cajero@crm.com',
      password: hashedPassword,
      name: 'Cajero CRM',
      phone: '809-555-0102',
      role: 'CASHIER',
    },
  ];

  for (const userData of users) {
    await prisma.user.upsert({
      where: { email: userData.email },
      update: userData,
      create: userData,
    });
  }

  console.log('✅ Usuarios básicos creados/actualizados');
  console.log('🔑 Credenciales de acceso:');
  console.log('   - Admin: admin@crm.com / admin123');
  console.log('   - Supervisor: supervisor@crm.com / admin123');
  console.log('   - Cajero: cajero@crm.com / admin123');
}

main()
  .catch((e) => {
    console.error('❌ Error en el seed limpio:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
