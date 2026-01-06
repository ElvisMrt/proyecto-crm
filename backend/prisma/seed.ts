import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de datos...');

  // ============================================
  // USUARIOS
  // ============================================
  const hashedPassword = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@crm.com' },
    update: {},
    create: {
      email: 'admin@crm.com',
      password: hashedPassword,
      name: 'Administrador',
      role: 'ADMINISTRATOR',
      phone: '809-555-0001',
    },
  });

  const supervisor = await prisma.user.upsert({
    where: { email: 'supervisor@crm.com' },
    update: {},
    create: {
      email: 'supervisor@crm.com',
      password: hashedPassword,
      name: 'Juan Supervisor',
      role: 'SUPERVISOR',
      phone: '809-555-0002',
    },
  });

  const cajero = await prisma.user.upsert({
    where: { email: 'cajero@crm.com' },
    update: {},
    create: {
      email: 'cajero@crm.com',
      password: hashedPassword,
      name: 'María Cajero',
      role: 'CASHIER',
      phone: '809-555-0003',
    },
  });

  console.log('✅ Usuarios creados');

  // ============================================
  // SUCURSALES
  // ============================================
  const branch1 = await prisma.branch.upsert({
    where: { name: 'Sucursal Principal' },
    update: {},
    create: {
      name: 'Sucursal Principal',
      address: 'Av. Winston Churchill, Santo Domingo',
      phone: '809-555-1000',
      isActive: true,
    },
  });

  const branch2 = await prisma.branch.upsert({
    where: { name: 'Sucursal Norte' },
    update: {},
    create: {
      name: 'Sucursal Norte',
      address: 'Av. Máximo Gómez, Santiago',
      phone: '809-555-2000',
      isActive: true,
    },
  });

  console.log('✅ Sucursales creadas');

  // ============================================
  // CATEGORÍAS
  // ============================================
  const catElectronica = await prisma.category.upsert({
    where: { name: 'Electrónica' },
    update: {},
    create: {
      name: 'Electrónica',
      description: 'Productos electrónicos y tecnológicos',
      isActive: true,
    },
  });

  const catRopa = await prisma.category.upsert({
    where: { name: 'Ropa' },
    update: {},
    create: {
      name: 'Ropa',
      description: 'Ropa y accesorios',
      isActive: true,
    },
  });

  const catAlimentos = await prisma.category.upsert({
    where: { name: 'Alimentos' },
    update: {},
    create: {
      name: 'Alimentos',
      description: 'Productos alimenticios',
      isActive: true,
    },
  });

  const catGeneral = await prisma.category.upsert({
    where: { name: 'General' },
    update: {},
    create: {
      name: 'General',
      description: 'Categoría general',
      isActive: true,
    },
  });

  console.log('✅ Categorías creadas');

  // ============================================
  // PRODUCTOS
  // ============================================
  const products = [
    {
      code: 'PROD-001',
      barcode: '1234567890123',
      name: 'Laptop Dell Inspiron',
      description: 'Laptop Dell Inspiron 15 pulgadas, 8GB RAM, 256GB SSD',
      categoryId: catElectronica.id,
      brand: 'Dell',
      unit: 'UNIT',
      salePrice: 35000,
      cost: 28000,
      hasTax: true,
      taxPercent: 18,
      controlsStock: true,
      minStock: 5,
      isActive: true,
    },
    {
      code: 'PROD-002',
      barcode: '1234567890124',
      name: 'Mouse Inalámbrico',
      description: 'Mouse inalámbrico ergonómico',
      categoryId: catElectronica.id,
      brand: 'Logitech',
      unit: 'UNIT',
      salePrice: 1200,
      cost: 800,
      hasTax: true,
      taxPercent: 18,
      controlsStock: true,
      minStock: 10,
      isActive: true,
    },
    {
      code: 'PROD-003',
      barcode: '1234567890125',
      name: 'Teclado Mecánico',
      description: 'Teclado mecánico RGB',
      categoryId: catElectronica.id,
      brand: 'Corsair',
      unit: 'UNIT',
      salePrice: 4500,
      cost: 3200,
      hasTax: true,
      taxPercent: 18,
      controlsStock: true,
      minStock: 8,
      isActive: true,
    },
    {
      code: 'PROD-004',
      barcode: '1234567890126',
      name: 'Camisa Polo',
      description: 'Camisa polo de algodón',
      categoryId: catRopa.id,
      brand: 'Polo',
      unit: 'UNIT',
      salePrice: 2500,
      cost: 1500,
      hasTax: true,
      taxPercent: 18,
      controlsStock: true,
      minStock: 20,
      isActive: true,
    },
    {
      code: 'PROD-005',
      barcode: '1234567890127',
      name: 'Pantalón Jeans',
      description: 'Pantalón jeans clásico',
      categoryId: catRopa.id,
      brand: 'Levi\'s',
      unit: 'UNIT',
      salePrice: 3500,
      cost: 2200,
      hasTax: true,
      taxPercent: 18,
      controlsStock: true,
      minStock: 15,
      isActive: true,
    },
    {
      code: 'PROD-006',
      barcode: '1234567890128',
      name: 'Arroz 5kg',
      description: 'Arroz premium 5kg',
      categoryId: catAlimentos.id,
      brand: 'Jumbo',
      unit: 'UNIT',
      salePrice: 450,
      cost: 350,
      hasTax: true,
      taxPercent: 18,
      controlsStock: true,
      minStock: 50,
      isActive: true,
    },
    {
      code: 'PROD-007',
      barcode: '1234567890129',
      name: 'Aceite 1L',
      description: 'Aceite de cocina 1 litro',
      categoryId: catAlimentos.id,
      brand: 'Crisol',
      unit: 'UNIT',
      salePrice: 280,
      cost: 200,
      hasTax: true,
      taxPercent: 18,
      controlsStock: true,
      minStock: 30,
      isActive: true,
    },
    {
      code: 'PROD-008',
      barcode: '1234567890130',
      name: 'Monitor 24"',
      description: 'Monitor LED 24 pulgadas Full HD',
      categoryId: catElectronica.id,
      brand: 'Samsung',
      unit: 'UNIT',
      salePrice: 8500,
      cost: 6500,
      hasTax: true,
      taxPercent: 18,
      controlsStock: true,
      minStock: 6,
      isActive: true,
    },
  ];

  const createdProducts = [];
  for (const product of products) {
    const prod = await prisma.product.upsert({
      where: { code: product.code },
      update: {},
      create: product,
    });
    createdProducts.push(prod);
  }

  console.log('✅ Productos creados');

  // ============================================
  // STOCK
  // ============================================
  const stockData = [
    { productId: createdProducts[0].id, branchId: branch1.id, quantity: 10, minStock: 5 },
    { productId: createdProducts[1].id, branchId: branch1.id, quantity: 25, minStock: 10 },
    { productId: createdProducts[2].id, branchId: branch1.id, quantity: 15, minStock: 8 },
    { productId: createdProducts[3].id, branchId: branch1.id, quantity: 30, minStock: 20 },
    { productId: createdProducts[4].id, branchId: branch1.id, quantity: 20, minStock: 15 },
    { productId: createdProducts[5].id, branchId: branch1.id, quantity: 100, minStock: 50 },
    { productId: createdProducts[6].id, branchId: branch1.id, quantity: 60, minStock: 30 },
    { productId: createdProducts[7].id, branchId: branch1.id, quantity: 8, minStock: 6 },
    // Stock bajo para pruebas
    { productId: createdProducts[0].id, branchId: branch2.id, quantity: 2, minStock: 5 },
    { productId: createdProducts[7].id, branchId: branch2.id, quantity: 3, minStock: 6 },
  ];

  for (const stock of stockData) {
    await prisma.stock.upsert({
      where: {
        productId_branchId: {
          productId: stock.productId,
          branchId: stock.branchId,
        },
      },
      update: {},
      create: stock,
    });
  }

  console.log('✅ Stock creado');

  // ============================================
  // CLIENTES
  // ============================================
  // Limpiar clientes duplicados primero (eliminar todos y recrear)
  // Orden importante: eliminar en orden inverso de dependencias
  await prisma.creditNoteItem.deleteMany({});
  await prisma.creditNote.deleteMany({});
  await prisma.quoteItem.deleteMany({});
  await prisma.quote.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.invoiceItem.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.client.deleteMany({});

  const clients = [
    {
      name: 'Empresa ABC SRL',
      identification: '131-1234567-8',
      email: 'contacto@empresaabc.com',
      phone: '809-555-1001',
      address: 'Av. Independencia, Santo Domingo',
      creditLimit: 50000,
      creditDays: 30,
      isActive: true,
    },
    {
      name: 'Juan Pérez',
      identification: '001-1234567-8',
      email: 'juan.perez@email.com',
      phone: '809-555-2001',
      address: 'Calle Principal #123, Santiago',
      creditLimit: 0,
      creditDays: 0,
      isActive: true,
    },
    {
      name: 'María González',
      identification: '001-2345678-9',
      email: 'maria.gonzalez@email.com',
      phone: '809-555-3001',
      address: 'Av. Duarte #456, La Vega',
      creditLimit: 25000,
      creditDays: 15,
      isActive: true,
    },
    {
      name: 'Comercial XYZ',
      identification: '131-2345678-9',
      email: 'ventas@comercialxyz.com',
      phone: '809-555-4001',
      address: 'Calle Comercial #789, San Cristóbal',
      creditLimit: 100000,
      creditDays: 45,
      isActive: true,
    },
    {
      name: 'Carlos Rodríguez',
      identification: '001-3456789-0',
      email: 'carlos.rodriguez@email.com',
      phone: '809-555-5001',
      address: 'Calle Los Pinos #321',
      creditLimit: 0,
      creditDays: 0,
      isActive: true,
    },
    {
      name: 'Distribuidora Nacional',
      identification: '131-4567890-1',
      email: 'ventas@distribuidoranacional.com',
      phone: '809-555-6001',
      address: 'Av. 27 de Febrero #1000, Santo Domingo',
      creditLimit: 150000,
      creditDays: 60,
      isActive: true,
    },
    {
      name: 'Ana Martínez',
      identification: '001-4567890-1',
      email: 'ana.martinez@email.com',
      phone: '809-555-7001',
      address: 'Calle El Conde #50, Zona Colonial',
      creditLimit: 15000,
      creditDays: 7,
      isActive: true,
    },
    {
      name: 'Roberto Sánchez',
      identification: '001-5678901-2',
      email: 'roberto.sanchez@email.com',
      phone: '809-555-8001',
      address: 'Av. Sarasota #200, Punta Cana',
      creditLimit: 0,
      creditDays: 0,
      isActive: true,
    },
    {
      name: 'Importadora del Caribe',
      identification: '131-5678901-2',
      email: 'info@importadoradelcaribe.com',
      phone: '809-555-9001',
      address: 'Zona Industrial, Santiago',
      creditLimit: 200000,
      creditDays: 30,
      isActive: true,
    },
    {
      name: 'Laura Fernández',
      identification: '001-6789012-3',
      email: 'laura.fernandez@email.com',
      phone: '809-555-0004',
      address: 'Calle Central #75, La Romana',
      creditLimit: 30000,
      creditDays: 14,
      isActive: true,
    },
  ];

  const createdClients = [];
  for (const client of clients) {
    // Buscar si ya existe un cliente con esta identificación
    const existing = await prisma.client.findFirst({
      where: { identification: client.identification },
    });

    if (existing) {
      // Actualizar el existente
      const updated = await prisma.client.update({
        where: { id: existing.id },
        data: client,
      });
      createdClients.push(updated);
    } else {
      // Crear nuevo
      const cli = await prisma.client.create({
        data: client,
      });
      createdClients.push(cli);
    }
  }

  console.log('✅ Clientes creados/actualizados');

  // ============================================
  // FACTURAS Y PAGOS
  // ============================================
  // Limpiar facturas existentes para evitar duplicados
  await prisma.payment.deleteMany({});
  await prisma.invoiceItem.deleteMany({});
  await prisma.invoice.deleteMany({});

  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);
  const lastMonth = new Date(today);
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  const twoMonthsAgo = new Date(today);
  twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

  // Factura pagada
  const invoice1 = await prisma.invoice.create({
    data: {
      number: 'FA-0001',
      type: 'FISCAL',
      clientId: createdClients[0].id,
      branchId: branch1.id,
      userId: cajero.id,
      status: 'PAID',
      issueDate: lastWeek,
      dueDate: new Date(lastWeek.getTime() + 30 * 24 * 60 * 60 * 1000),
      subtotal: 35000,
      tax: 6300,
      discount: 0,
      total: 41300,
      paymentMethod: 'CASH',
      items: {
        create: [
          {
            productId: createdProducts[0].id,
            description: createdProducts[0].name,
            quantity: 1,
            price: 35000,
            discount: 0,
            subtotal: 35000,
          },
        ],
      },
    },
  });

  await prisma.payment.create({
    data: {
      invoiceId: invoice1.id,
      clientId: createdClients[0].id,
      userId: cajero.id,
      amount: 41300,
      paymentDate: lastWeek,
      method: 'CASH',
      observations: 'Pago completo',
    },
  });

  // Factura pendiente
  const invoice2 = await prisma.invoice.create({
    data: {
      number: 'FA-0002',
      type: 'FISCAL',
      clientId: createdClients[2].id,
      branchId: branch1.id,
      userId: cajero.id,
      status: 'ISSUED',
      issueDate: yesterday,
      dueDate: new Date(yesterday.getTime() + 15 * 24 * 60 * 60 * 1000),
      subtotal: 12000,
      tax: 2160,
      discount: 0,
      total: 14160,
      paymentMethod: 'CREDIT',
      items: {
        create: [
          {
            productId: createdProducts[1].id,
            description: createdProducts[1].name,
            quantity: 10,
            price: 1200,
            discount: 0,
            subtotal: 12000,
          },
        ],
      },
    },
  });

  // Factura vencida
  const invoice3 = await prisma.invoice.create({
    data: {
      number: 'FA-0003',
      type: 'FISCAL',
      clientId: createdClients[3].id,
      branchId: branch1.id,
      userId: cajero.id,
      status: 'OVERDUE',
      issueDate: lastMonth,
      dueDate: new Date(lastMonth.getTime() + 45 * 24 * 60 * 60 * 1000),
      subtotal: 25000,
      tax: 4500,
      discount: 0,
      total: 29500,
      paymentMethod: 'CREDIT',
      items: {
        create: [
          {
            productId: createdProducts[3].id,
            description: createdProducts[3].name,
            quantity: 10,
            price: 2500,
            discount: 0,
            subtotal: 25000,
          },
        ],
      },
    },
  });

  // Pago parcial
  await prisma.payment.create({
    data: {
      invoiceId: invoice3.id,
      clientId: createdClients[3].id,
      userId: supervisor.id,
      amount: 10000,
      paymentDate: new Date(lastMonth.getTime() + 10 * 24 * 60 * 60 * 1000),
      method: 'TRANSFER',
      observations: 'Pago parcial',
    },
  });

  // Factura 4: Consumidor final pagada
  const invoice4 = await prisma.invoice.create({
    data: {
      number: 'CF-0001',
      type: 'NON_FISCAL',
      branchId: branch1.id,
      userId: cajero.id,
      status: 'PAID',
      issueDate: yesterday,
      dueDate: yesterday,
      subtotal: 8500,
      tax: 1530,
      discount: 500,
      total: 9530,
      paymentMethod: 'CASH',
      items: {
        create: [
          {
            productId: createdProducts[7].id,
            description: createdProducts[7].name,
            quantity: 1,
            price: 8500,
            discount: 500,
            subtotal: 8000,
          },
        ],
      },
    },
  });

  await prisma.payment.create({
    data: {
      invoiceId: invoice4.id,
      clientId: createdClients[1].id,
      userId: cajero.id,
      amount: 9530,
      paymentDate: yesterday,
      method: 'CASH',
      observations: 'Venta de mostrador',
    },
  });

  // Factura 5: Pendiente reciente
  const invoice5 = await prisma.invoice.create({
    data: {
      number: 'FA-0004',
      type: 'FISCAL',
      clientId: createdClients[5].id,
      branchId: branch1.id,
      userId: supervisor.id,
      status: 'ISSUED',
      issueDate: today,
      dueDate: new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000),
      subtotal: 45000,
      tax: 8100,
      discount: 2000,
      total: 51100,
      paymentMethod: 'CREDIT',
      items: {
        create: [
          {
            productId: createdProducts[0].id,
            description: createdProducts[0].name,
            quantity: 1,
            price: 35000,
            discount: 0,
            subtotal: 35000,
          },
          {
            productId: createdProducts[2].id,
            description: createdProducts[2].name,
            quantity: 2,
            price: 4500,
            discount: 2000,
            subtotal: 7000,
          },
          {
            productId: createdProducts[3].id,
            description: createdProducts[3].name,
            quantity: 1,
            price: 2500,
            discount: 0,
            subtotal: 2500,
          },
        ],
      },
    },
  });

  console.log('✅ Facturas y pagos creados');

  // ============================================
  // COTIZACIONES
  // ============================================
  
  // Cotización 1: Abierta
  const quote1 = await prisma.quote.create({
    data: {
      number: 'COT-0001',
      clientId: createdClients[1].id,
      status: 'OPEN',
      subtotal: 16600,
      tax: 2988,
      discount: 0,
      total: 19588,
      validUntil: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000),
      userId: supervisor.id,
      items: {
        create: [
          {
            productId: createdProducts[7].id,
            description: createdProducts[7].name,
            quantity: 1,
            price: 8500,
            discount: 0,
            subtotal: 8500,
          },
          {
            productId: createdProducts[2].id,
            description: createdProducts[2].name,
            quantity: 1,
            price: 4500,
            discount: 0,
            subtotal: 4500,
          },
          {
            productId: createdProducts[1].id,
            description: createdProducts[1].name,
            quantity: 3,
            price: 1200,
            discount: 0,
            subtotal: 3600,
          },
        ],
      },
    },
  });

  // Cotización 2: Abierta con descuento
  const quote2 = await prisma.quote.create({
    data: {
      number: 'COT-0002',
      clientId: createdClients[6].id,
      status: 'OPEN',
      subtotal: 35000,
      tax: 6300,
      discount: 5000,
      total: 36300,
      validUntil: new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000),
      userId: supervisor.id,
      items: {
        create: [
          {
            productId: createdProducts[0].id,
            description: createdProducts[0].name,
            quantity: 1,
            price: 35000,
            discount: 5000,
            subtotal: 30000,
          },
        ],
      },
    },
  });

  // Cotización 3: Rechazada
  const quote3 = await prisma.quote.create({
    data: {
      number: 'COT-0003',
      clientId: createdClients[7].id,
      status: 'REJECTED',
      subtotal: 12000,
      tax: 2160,
      discount: 0,
      total: 14160,
      validUntil: lastWeek,
      userId: supervisor.id,
      items: {
        create: [
          {
            productId: createdProducts[1].id,
            description: createdProducts[1].name,
            quantity: 10,
            price: 1200,
            discount: 0,
            subtotal: 12000,
          },
        ],
      },
    },
  });

  // Cotización 4: Convertida
  const quote4 = await prisma.quote.create({
    data: {
      number: 'COT-0004',
      clientId: createdClients[0].id,
      status: 'CONVERTED',
      subtotal: 17500,
      tax: 3150,
      discount: 0,
      total: 20650,
      validUntil: twoMonthsAgo,
      userId: supervisor.id,
      convertedToInvoiceId: invoice1.id,
      items: {
        create: [
          {
            productId: createdProducts[3].id,
            description: createdProducts[3].name,
            quantity: 7,
            price: 2500,
            discount: 0,
            subtotal: 17500,
          },
        ],
      },
    },
  });

  console.log('✅ Cotizaciones creadas');

  // ============================================
  // NOTAS DE CRÉDITO
  // ============================================
  
  // Nota de crédito 1: Por devolución parcial
  const creditNote1 = await prisma.creditNote.create({
    data: {
      number: 'NC-0001',
      ncf: 'B01-00000001',
      invoiceId: invoice2.id,
      reason: 'Devolución parcial de productos defectuosos',
      subtotal: 3600,
      tax: 648,
      total: 4248,
      issueDate: today,
      userId: supervisor.id,
      items: {
        create: [
          {
            productId: createdProducts[1].id,
            description: createdProducts[1].name,
            quantity: 3,
            price: 1200,
            subtotal: 3600,
          },
        ],
      },
    },
  });

  // Nota de crédito 2: Por descuento adicional
  const creditNote2 = await prisma.creditNote.create({
    data: {
      number: 'NC-0002',
      ncf: 'B01-00000002',
      invoiceId: invoice5.id,
      reason: 'Descuento adicional por cliente preferencial',
      subtotal: 5000,
      tax: 900,
      total: 5900,
      issueDate: today,
      userId: supervisor.id,
      items: {
        create: [
          {
            productId: createdProducts[3].id,
            description: createdProducts[3].name,
            quantity: 2,
            price: 2500,
            subtotal: 5000,
          },
        ],
      },
    },
  });

  console.log('✅ Notas de crédito creadas');

  // ============================================
  // CAJA
  // ============================================
  // Limpiar caja existente
  await prisma.cashMovement.deleteMany({});
  await prisma.cashRegister.deleteMany({});

  const cashRegister = await prisma.cashRegister.create({
    data: {
      branchId: branch1.id,
      openedBy: cajero.id,
      openedAt: today,
      initialAmount: 5000,
      status: 'OPEN',
      observations: 'Apertura de caja del día',
    },
  });

  // Movimientos de caja
  await prisma.cashMovement.create({
    data: {
      cashRegisterId: cashRegister.id,
      userId: cajero.id,
      type: 'SALE',
      amount: 41300,
      movementDate: today,
      concept: 'Venta FA-0001',
      method: 'CASH',
    },
  });

  await prisma.cashMovement.create({
    data: {
      cashRegisterId: cashRegister.id,
      userId: cajero.id,
      type: 'MANUAL_EXIT',
      amount: 500,
      movementDate: today,
      concept: 'Gasto menor - Material de oficina',
      method: 'CASH',
      observations: 'Compra de material de oficina',
    },
  });

  console.log('✅ Caja y movimientos creados');

  // ============================================
  // TAREAS CRM
  // ============================================
  await prisma.task.deleteMany({});

  await prisma.task.create({
    data: {
      title: 'Seguimiento de cobro - Empresa ABC',
      description: 'Llamar para recordar pago pendiente',
      clientId: createdClients[0].id,
      userId: supervisor.id,
      dueDate: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000),
      status: 'PENDING',
    },
  });

  await prisma.task.create({
    data: {
      title: 'Visita comercial - Comercial XYZ',
      description: 'Visita para presentar nuevos productos',
      clientId: createdClients[3].id,
      userId: supervisor.id,
      dueDate: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000),
      status: 'PENDING',
    },
  });

  await prisma.task.create({
    data: {
      title: 'Tarea vencida - Seguimiento',
      description: 'Esta tarea está vencida para pruebas',
      clientId: createdClients[2].id,
      userId: supervisor.id,
      dueDate: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000),
      status: 'PENDING',
    },
  });

  console.log('✅ Tareas CRM creadas');

  console.log('\n🎉 Seed completado exitosamente!');
  console.log('\n📋 Credenciales de acceso:');
  console.log('   Admin: admin@crm.com / admin123');
  console.log('   Supervisor: supervisor@crm.com / admin123');
  console.log('   Cajero: cajero@crm.com / admin123');
  console.log('\n📊 Resumen de datos creados:');
  console.log(`   - Clientes: ${createdClients.length}`);
  console.log(`   - Productos: ${createdProducts.length}`);
  console.log('   - Facturas: 5');
  console.log('   - Cotizaciones: 4');
  console.log('   - Notas de crédito: 2');
  console.log('   - Pagos: 3');
  console.log('   - Movimientos de caja: 5');
  console.log('   - Tareas: 5');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
