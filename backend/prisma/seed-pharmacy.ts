import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de datos para farmacia...');

  // Limpiar datos existentes
  console.log('🗑️ Eliminando datos existentes...');
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
  await prisma.user.deleteMany();
  await prisma.branch.deleteMany();
  await prisma.ncfSequence.deleteMany();
  await prisma.whatsAppTemplate.deleteMany();

  console.log('✅ Datos eliminados exitosamente');

  // Crear sucursal principal
  const mainBranch = await prisma.branch.create({
    data: {
      name: 'Farmacia Central',
      code: 'FC-001',
      address: 'Calle Principal #123, Santo Domingo',
      phone: '809-555-0100',
      email: 'central@farmacia.com',
    },
  });

  // Crear categorías de productos farmacéuticos
  const categories = await Promise.all([
    { name: 'Medicamentos', description: 'Medicamentos recetados y de venta libre' },
    { name: 'Cuidado Personal', description: 'Productos de higiene y cuidado personal' },
    { name: 'Vitaminas y Suplementos', description: 'Vitaminas, minerales y suplementos dietéticos' },
    { name: 'Equipamiento Médico', description: 'Equipos y suministros médicos' },
    { name: 'Bebés', description: 'Productos para cuidado de bebés' },
  ].map(cat => prisma.category.create({ data: cat })));

  // Crear productos de farmacia
  const products = await Promise.all([
    // Medicamentos
    {
      code: 'MED-001',
      barcode: '7501234567890',
      name: 'Paracetamol 500mg',
      description: 'Tabletas de paracetamol 500mg, analgésico y antipirético',
      categoryId: categories[0].id,
      brand: 'Genfar',
      unit: 'CAJA',
      salePrice: 125.50,
      cost: 85.00,
      hasTax: true,
      taxPercent: 18,
      controlsStock: true,
      minStock: 10,
    },
    {
      code: 'MED-002',
      barcode: '7501234567891',
      name: 'Ibuprofeno 400mg',
      description: 'Tabletas de ibuprofeno 400mg, antiinflamatorio',
      categoryId: categories[0].id,
      brand: 'Novartis',
      unit: 'CAJA',
      salePrice: 145.00,
      cost: 95.00,
      hasTax: true,
      taxPercent: 18,
      controlsStock: true,
      minStock: 15,
    },
    {
      code: 'MED-003',
      barcode: '7501234567892',
      name: 'Amoxicilina 500mg',
      description: 'Cápsulas de amoxicilina 500mg, antibiótico',
      categoryId: categories[0].id,
      brand: 'GSK',
      unit: 'CAJA',
      salePrice: 280.00,
      cost: 180.00,
      hasTax: true,
      taxPercent: 18,
      controlsStock: true,
      minStock: 20,
    },
    // Cuidado Personal
    {
      code: 'CP-001',
      barcode: '7501234567893',
      name: 'Jabón Antibacterial',
      description: 'Jabón líquido antibacterial 500ml',
      categoryId: categories[1].id,
      brand: 'Dove',
      unit: 'UNIDAD',
      salePrice: 65.00,
      cost: 40.00,
      hasTax: true,
      taxPercent: 18,
      controlsStock: true,
      minStock: 25,
    },
    {
      code: 'CP-002',
      barcode: '7501234567894',
      name: 'Shampoo Anticaspa',
      description: 'Shampoo anticaspa 400ml',
      categoryId: categories[1].id,
      brand: 'Head & Shoulders',
      unit: 'UNIDAD',
      salePrice: 120.00,
      cost: 75.00,
      hasTax: true,
      taxPercent: 18,
      controlsStock: true,
      minStock: 30,
    },
    // Vitaminas
    {
      code: 'VIT-001',
      barcode: '7501234567895',
      name: 'Vitamina C 1000mg',
      description: 'Comprimidos de vitamina C 1000mg, frasco con 60 tabletas',
      categoryId: categories[2].id,
      brand: 'Nature Made',
      unit: 'FRASCO',
      salePrice: 350.00,
      cost: 220.00,
      hasTax: true,
      taxPercent: 18,
      controlsStock: true,
      minStock: 12,
    },
    {
      code: 'VIT-002',
      barcode: '7501234567896',
      name: 'Multivitaminico Adulto',
      description: 'Comprimidos multivitamínicos para adultos, frasco con 30 tabletas',
      categoryId: categories[2].id,
      brand: 'Centrum',
      unit: 'FRASCO',
      salePrice: 450.00,
      cost: 280.00,
      hasTax: true,
      taxPercent: 18,
      controlsStock: true,
      minStock: 10,
    },
    // Equipamiento Médico
    {
      code: 'EQ-001',
      barcode: '7501234567897',
      name: 'Tensiómetro Digital',
      description: 'Tensiómetro digital de brazo automático',
      categoryId: categories[3].id,
      brand: 'Omron',
      unit: 'UNIDAD',
      salePrice: 2500.00,
      cost: 1800.00,
      hasTax: true,
      taxPercent: 18,
      controlsStock: true,
      minStock: 5,
    },
    {
      code: 'EQ-002',
      barcode: '7501234567898',
      name: 'Termómetro Digital',
      description: 'Termómetro digital clínico',
      categoryId: categories[3].id,
      brand: 'Braun',
      unit: 'UNIDAD',
      salePrice: 450.00,
      cost: 320.00,
      hasTax: true,
      taxPercent: 18,
      controlsStock: true,
      minStock: 15,
    },
    // Bebés
    {
      code: 'BEB-001',
      barcode: '7501234567899',
      name: 'Pañales Premium',
      description: 'Pañales desechables tamaño mediano, paquete con 30 unidades',
      categoryId: categories[4].id,
      brand: 'Huggies',
      unit: 'PAQUETE',
      salePrice: 280.00,
      cost: 180.00,
      hasTax: true,
      taxPercent: 18,
      controlsStock: true,
      minStock: 20,
    },
    {
      code: 'BEB-002',
      barcode: '7501234567800',
      name: 'Leche en Polvo Infantil',
      description: 'Leche en polvo para bebés etapa 1, lata de 400g',
      categoryId: categories[4].id,
      brand: 'NAN',
      unit: 'LATA',
      salePrice: 320.00,
      cost: 220.00,
      hasTax: true,
      taxPercent: 18,
      controlsStock: true,
      minStock: 15,
    },
  ].map(product => prisma.product.create({ data: product })));

  // Crear stock inicial
  await Promise.all(products.map((product, index) => 
    prisma.stock.create({
      data: {
        productId: product.id,
        branchId: mainBranch.id,
        quantity: Math.floor(Math.random() * 50) + 20, // Stock entre 20-70
        minStock: product.minStock,
      },
    })
  ));

  // Crear clientes
  const clients = await Promise.all([
    {
      name: 'Juan Pérez',
      identification: '001-1234567-8',
      email: 'juan.perez@email.com',
      phone: '809-555-0101',
      address: 'Calle Duarte #456, Santo Domingo',
      creditLimit: 5000.00,
      creditDays: 30,
    },
    {
      name: 'María Rodríguez',
      identification: '002-2345678-9',
      email: 'maria.rodriguez@email.com',
      phone: '809-555-0102',
      address: 'Avenida Lincoln #789, Santo Domingo',
      creditLimit: 3000.00,
      creditDays: 15,
    },
    {
      name: 'Carlos Sánchez',
      identification: '003-3456789-0',
      email: 'carlos.sanchez@email.com',
      phone: '809-555-0103',
      address: 'Calle 27 de Febrero #101, Santiago',
      creditLimit: 7500.00,
      creditDays: 45,
    },
    {
      name: 'Ana Martínez',
      identification: '004-4567890-1',
      email: 'ana.martinez@email.com',
      phone: '809-555-0104',
      address: 'Calle del Sol #202, La Romana',
      creditLimit: 2000.00,
      creditDays: 7,
    },
    {
      name: 'Luis Gómez',
      identification: '005-5678901-2',
      email: 'luis.gomez@email.com',
      phone: '809-555-0105',
      address: 'Avenida Bolívar #303, Puerto Plata',
      creditLimit: 4000.00,
      creditDays: 30,
    },
  ].map(client => prisma.client.create({ data: client })));

  // Crear usuarios
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const users = await Promise.all([
    {
      email: 'admin@farmacia.com',
      password: hashedPassword,
      name: 'Administrador Farmacia',
      phone: '809-555-0100',
      role: 'ADMINISTRATOR',
      branchId: mainBranch.id,
    },
    {
      email: 'cajero@farmacia.com',
      password: hashedPassword,
      name: 'Cajero Principal',
      phone: '809-555-0101',
      role: 'CASHIER',
      branchId: mainBranch.id,
    },
    {
      email: 'supervisor@farmacia.com',
      password: hashedPassword,
      name: 'Supervisor de Ventas',
      phone: '809-555-0102',
      role: 'SUPERVISOR',
      branchId: mainBranch.id,
    },
  ].map(user => prisma.user.create({ data: user })));

  // Crear secuencias NCF
  await Promise.all([
    {
      prefix: 'B0100000001',
      description: 'Facturas de Crédito Fiscal para Consumidores Finales',
      startRange: 10000001,
      endRange: 19999999,
      currentNumber: 10000001,
      branchId: mainBranch.id,
    },
    {
      prefix: 'B0200000001',
      description: 'Facturas de Crédito Fiscal para Regímenes Especiales',
      startRange: 20000001,
      endRange: 29999999,
      currentNumber: 20000001,
      branchId: mainBranch.id,
    },
    {
      prefix: 'B0300000001',
      description: 'Facturas de Crédito Fiscal para Gubernamentales',
      startRange: 30000001,
      endRange: 39999999,
      currentNumber: 30000001,
      branchId: mainBranch.id,
    },
  ].map(ncf => prisma.ncfSequence.create({ data: ncf })));

  // Crear caja registradora
  const cashRegister = await prisma.cashRegister.create({
    data: {
      branchId: mainBranch.id,
      status: 'OPEN',
      initialAmount: 5000.00,
      openedAt: new Date(),
      openedBy: users[1].id, // Cajero
      observations: 'Caja inicial del día',
    },
  });

  // Crear algunas facturas de ejemplo
  const invoices = await Promise.all([
    {
      number: 'F001',
      ncf: 'B0100000001',
      clientId: clients[0].id,
      type: 'FISCAL',
      status: 'ISSUED',
      paymentMethod: 'CASH',
      subtotal: 245.50,
      tax: 44.19,
      discount: 0,
      total: 289.69,
      balance: 0,
      userId: users[1].id,
      branchId: mainBranch.id,
      observations: 'Venta de medicamentos',
    },
    {
      number: 'F002',
      ncf: 'B0100000002',
      clientId: clients[1].id,
      type: 'FISCAL',
      status: 'ISSUED',
      paymentMethod: 'CARD',
      subtotal: 570.00,
      tax: 102.60,
      discount: 20.00,
      total: 652.60,
      balance: 0,
      userId: users[1].id,
      branchId: mainBranch.id,
      observations: 'Venta de cuidado personal y vitaminas',
    },
    {
      number: 'F003',
      clientId: clients[2].id,
      type: 'FISCAL',
      status: 'ISSUED',
      paymentMethod: 'CREDIT',
      subtotal: 2950.00,
      tax: 531.00,
      discount: 100.00,
      total: 3381.00,
      balance: 3381.00,
      userId: users[2].id,
      branchId: mainBranch.id,
      observations: 'Venta a crédito de equipamiento médico',
    },
  ].map(invoice => prisma.invoice.create({ data: invoice })));

  // Crear items de facturas
  await Promise.all([
    // Items para F001
    {
      invoiceId: invoices[0].id,
      productId: products[0].id,
      description: 'Paracetamol 500mg',
      quantity: 1,
      price: 125.50,
      discount: 0,
      subtotal: 125.50,
    },
    {
      invoiceId: invoices[0].id,
      productId: products[1].id,
      description: 'Ibuprofeno 400mg',
      quantity: 1,
      price: 145.00,
      discount: 0,
      subtotal: 145.00,
    },
    // Items para F002
    {
      invoiceId: invoices[1].id,
      productId: products[3].id,
      description: 'Jabón Antibacterial',
      quantity: 2,
      price: 65.00,
      discount: 10.00,
      subtotal: 120.00,
    },
    {
      invoiceId: invoices[1].id,
      productId: products[4].id,
      description: 'Shampoo Anticaspa',
      quantity: 1,
      price: 120.00,
      discount: 0,
      subtotal: 120.00,
    },
    {
      invoiceId: invoices[1].id,
      productId: products[5].id,
      description: 'Vitamina C 1000mg',
      quantity: 1,
      price: 350.00,
      discount: 10.00,
      subtotal: 340.00,
    },
    // Items para F003
    {
      invoiceId: invoices[2].id,
      productId: products[7].id,
      description: 'Tensiómetro Digital',
      quantity: 1,
      price: 2500.00,
      discount: 100.00,
      subtotal: 2400.00,
    },
    {
      invoiceId: invoices[2].id,
      productId: products[8].id,
      description: 'Termómetro Digital',
      quantity: 2,
      price: 450.00,
      discount: 0,
      subtotal: 900.00,
    },
  ].map(item => prisma.invoiceItem.create({ data: item })));

  // Crear movimientos de caja
  await Promise.all([
    {
      cashRegisterId: cashRegister.id,
      type: 'OPENING',
      concept: 'Apertura de caja',
      amount: 5000.00,
      method: 'CASH',
      userId: users[1].id,
      movementDate: new Date(),
    },
    {
      cashRegisterId: cashRegister.id,
      type: 'SALE',
      concept: 'Venta F001',
      amount: 289.69,
      method: 'CASH',
      invoiceId: invoices[0].id,
      userId: users[1].id,
      movementDate: new Date(),
    },
    {
      cashRegisterId: cashRegister.id,
      type: 'SALE',
      concept: 'Venta F002',
      amount: 652.60,
      method: 'CARD',
      invoiceId: invoices[1].id,
      userId: users[1].id,
      movementDate: new Date(),
    },
    {
      cashRegisterId: cashRegister.id,
      type: 'SALE',
      concept: 'Venta F003',
      amount: 3381.00,
      method: 'CREDIT',
      invoiceId: invoices[2].id,
      userId: users[2].id,
      movementDate: new Date(),
    },
  ].map(movement => prisma.cashMovement.create({ data: movement })));

  // Crear tareas CRM
  await Promise.all([
    {
      title: 'Seguimiento cliente Juan Pérez',
      description: 'Recordar pago de factura F003',
      clientId: clients[0].id,
      userId: users[2].id,
      status: 'PENDING',
      priority: 'HIGH',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días
    },
    {
      title: 'Contactar María Rodríguez',
      description: 'Ofrecer productos de cuidado personal',
      clientId: clients[1].id,
      userId: users[1].id,
      status: 'PENDING',
      priority: 'MEDIUM',
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 días
    },
    {
      title: 'Revisar inventario',
      description: 'Verificar stock de medicamentos',
      userId: users[2].id,
      status: 'PENDING',
      priority: 'LOW',
      dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 día
    },
  ].map(task => prisma.task.create({ data: task })));

  // Crear plantillas WhatsApp
  await Promise.all([
    {
      name: 'Confirmación de Pedido',
      type: 'ORDER_CONFIRMATION',
      subject: 'Su pedido ha sido confirmado',
      message: 'Estimado {customer_name}, su pedido #{order_number} ha sido confirmado. Total: {total}. Gracias por su compra.',
    },
    {
      name: 'Recordatorio de Pago',
      type: 'PAYMENT_REMINDER',
      subject: 'Recordatorio de pago',
      message: 'Estimado {customer_name}, este es un recordatorio de su factura #{invoice_number} por un monto de {amount} vence el {due_date}.',
    },
    {
      name: 'Promoción Especial',
      type: 'PROMOTION',
      subject: 'Promoción Especial',
      message: '¡Oferta especial! {product_name} con {discount}% de descuento. Válido hasta {end_date}.',
    },
  ].map(template => prisma.whatsAppTemplate.create({ data: template })));

  console.log('✅ Seed de farmacia completado exitosamente');
  console.log('📊 Resumen de datos creados:');
  console.log(`   - Sucursales: 1`);
  console.log(`   - Categorías: ${categories.length}`);
  console.log(`   - Productos: ${products.length}`);
  console.log(`   - Clientes: ${clients.length}`);
  console.log(`   - Usuarios: ${users.length}`);
  console.log(`   - Facturas: ${invoices.length}`);
  console.log(`   - Tareas: 3`);
  console.log(`   - Plantillas WhatsApp: 3`);
  console.log('\n🔑 Credenciales de prueba:');
  console.log('   - Administrador: admin@farmacia.com / admin123');
  console.log('   - Cajero: cajero@farmacia.com / admin123');
  console.log('   - Supervisor: supervisor@farmacia.com / admin123');
}

main()
  .catch((e) => {
    console.error('❌ Error en el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
