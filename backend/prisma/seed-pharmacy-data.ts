import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Agregando datos completos de farmacia...');

  // Crear sucursal principal de farmacia
  const branch = await prisma.branch.upsert({
    where: { id: 'farmacia-main-branch' },
    update: {},
    create: {
      id: 'farmacia-main-branch',
      name: 'Farmacia Central',
      address: 'Calle Principal #123, Santo Domingo',
      phone: '809-555-0100',
      email: 'info@farmaciacentral.com',
      isActive: true,
    },
  });

  // Crear clientes de farmacia
  const clients = [
    {
      name: 'Juan Pérez',
      email: 'juan.perez@email.com',
      phone: '809-555-0201',
      address: 'Calle Luna #45, Santo Domingo',
      identification: '12345678901',
      isActive: true,
    },
    {
      name: 'María García',
      email: 'maria.garcia@email.com',
      phone: '809-555-0202',
      address: 'Avenida Sol #78, Santo Domingo',
      identification: '98765432109',
      isActive: true,
    },
    {
      name: 'Carlos Rodríguez',
      email: 'carlos.rodriguez@email.com',
      phone: '809-555-0203',
      address: 'Calle Estrella #12, Santo Domingo',
      identification: '45678901234',
      isActive: true,
    },
    {
      name: 'Ana Martínez',
      email: 'ana.martinez@email.com',
      phone: '809-555-0204',
      address: 'Avenida Luna #34, Santo Domingo',
      identification: '78901234567',
      isActive: true,
    },
    {
      name: 'Luis Sánchez',
      email: 'luis.sanchez@email.com',
      phone: '809-555-0205',
      address: 'Calle Sol #56, Santo Domingo',
      identification: '23456789012',
      isActive: true,
    },
  ];

  for (const clientData of clients) {
    try {
      await prisma.client.create({
        data: clientData,
      });
    } catch (error) {
      // Si el cliente ya existe, lo actualizamos por email
      const { identification, ...updateData } = clientData;
      await prisma.client.updateMany({
        where: { email: clientData.email },
        data: updateData,
      });
    }
  }

  // Crear caja registradora
  const adminUser = await prisma.user.findUnique({ where: { email: 'admin@crm.com' } });
  if (!adminUser) {
    throw new Error('Usuario admin no encontrado');
  }

  const cashRegister = await prisma.cashRegister.upsert({
    where: { id: 'farmacia-cash-register' },
    update: {},
    create: {
      id: 'farmacia-cash-register',
      branchId: branch.id,
      initialAmount: 50000,
      status: 'OPEN',
      openedAt: new Date(),
      openedBy: adminUser.id,
    },
  });

  // Crear secuencia NCF para facturas fiscales
  await prisma.ncfSequence.upsert({
    where: { id: 'farmacia-ncf-fiscal' },
    update: {},
    create: {
      id: 'farmacia-ncf-fiscal',
      branchId: branch.id,
      prefix: 'B0100000001',
      description: 'Secuencia NCF para facturas fiscales',
      startRange: 1001000001,
      endRange: 1001999999,
      currentNumber: 1001000001,
      isActive: true,
    },
  });

  // Crear tareas CRM para farmacia
  const supervisorUser = await prisma.user.findUnique({ where: { email: 'supervisor@crm.com' } });
  const cajeroUser = await prisma.user.findUnique({ where: { email: 'cajero@crm.com' } });

  const tasks = [
    {
      title: 'Llamar a clientes para recordatorio de medicamentos',
      description: 'Contactar a clientes que compraron medicamentos crónicos para recordatorio',
      priority: 'MEDIUM',
      status: 'PENDING',
      userId: supervisorUser?.id || adminUser.id,
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 días
      clientId: null,
    },
    {
      title: 'Revisar stock de medicamentos controlados',
      description: 'Verificar inventario de medicamentos que requieren control especial',
      priority: 'HIGH',
      status: 'PENDING',
      userId: adminUser.id,
      dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 día
      clientId: null,
    },
    {
      title: 'Ordenar productos de cuidado personal',
      description: 'Realizar pedido de jabón, shampoo y otros productos de higiene',
      priority: 'MEDIUM',
      status: 'PENDING',
      userId: cajeroUser?.id || adminUser.id,
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 días
      clientId: null,
    },
  ];

  for (const taskData of tasks) {
    await prisma.task.upsert({
      where: { id: `task-${taskData.title.toLowerCase().replace(/\s+/g, '-')}` },
      update: taskData,
      create: { ...taskData, id: `task-${taskData.title.toLowerCase().replace(/\s+/g, '-')}` },
    });
  }

  // Crear movimientos de caja iniciales
  const cashMovements = [
    {
      cashRegisterId: cashRegister.id,
      type: 'OPENING',
      concept: 'Apertura de caja inicial',
      amount: 50000,
      method: 'CASH',
      userId: adminUser.id,
      observations: null,
    },
    {
      cashRegisterId: cashRegister.id,
      type: 'SALE',
      concept: 'Venta de medicamentos',
      amount: 2500,
      method: 'CASH',
      userId: cajeroUser?.id || adminUser.id,
      observations: 'Referencia: SALE-001',
    },
    {
      cashRegisterId: cashRegister.id,
      type: 'MANUAL_EXIT',
      concept: 'Pago de servicios',
      amount: 1500,
      method: 'TRANSFER',
      userId: adminUser.id,
      observations: 'Referencia: EXP-001',
    },
  ];

  for (const movementData of cashMovements) {
    await prisma.cashMovement.upsert({
      where: { id: `movement-${movementData.type}-${Date.now()}` },
      update: movementData,
      create: { ...movementData, id: `movement-${movementData.type}-${Date.now()}` },
    });
  }

  console.log('✅ Datos de farmacia creados exitosamente');
  console.log(`📊 Resumen:`);
  console.log(`   - Sucursal: ${branch.name}`);
  console.log(`   - Clientes: ${clients.length}`);
  console.log(`   - Caja registradora: Abierta`);
  console.log(`   - Tareas CRM: ${tasks.length}`);
  console.log(`   - Movimientos de caja: ${cashMovements.length}`);
  console.log(`   - Secuencia NCF: Configurada`);
}

main()
  .catch((e) => {
    console.error('❌ Error en el seed de datos de farmacia:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
