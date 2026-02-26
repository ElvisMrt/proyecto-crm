const { PrismaClient } = require('@prisma/client');

async function createTestInvoices() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });

  try {
    console.log('Conectando a la base de datos...');

    // Buscar el tenant neypier
    const tenant = await prisma.tenant.findFirst({
      where: { subdomain: 'neypier' }
    });

    if (!tenant) {
      console.error('Tenant neypier no encontrado');
      return;
    }

    console.log('Tenant encontrado:', tenant.name);

    // Buscar o crear un proveedor
    let supplier = await prisma.supplier.findFirst({
      where: { code: 'PROV001' }
    });

    if (!supplier) {
      console.log('Creando proveedor de prueba...');
      supplier = await prisma.supplier.create({
        data: {
          code: 'PROV001',
          name: 'Proveedor Demo',
          email: 'proveedor@demo.com',
          phone: '809-555-1234',
          isActive: true
        }
      });
      console.log('Proveedor creado:', supplier.name);
    } else {
      console.log('Usando proveedor existente:', supplier.name);
    }

    // Crear facturas de prueba con diferentes estados
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
        supplierId: supplier.id,
        invoiceDate: lastWeek,
        dueDate: yesterday,
        subtotal: 5000,
        tax: 0,
        discount: 0,
        total: 5000,
        paid: 0,
        balance: 5000,
        status: 'PENDING',
        notes: 'Factura vencida - Compra de materiales'
      },
      {
        code: 'FINV-002',
        supplierId: supplier.id,
        invoiceDate: yesterday,
        dueDate: nextWeek,
        subtotal: 3000,
        tax: 0,
        discount: 0,
        total: 3000,
        paid: 1000,
        balance: 2000,
        status: 'PARTIAL',
        notes: 'Factura parcialmente pagada'
      },
      {
        code: 'FINV-003',
        supplierId: supplier.id,
        invoiceDate: today,
        dueDate: nextWeek,
        subtotal: 8000,
        tax: 0,
        discount: 0,
        total: 8000,
        paid: 0,
        balance: 8000,
        status: 'PENDING',
        notes: 'Factura pendiente - Próxima a vencer'
      }
    ];

    console.log('\nCreando facturas de prueba...');
    for (const invoice of invoices) {
      const existing = await prisma.supplierInvoice.findFirst({
        where: { code: invoice.code }
      });

      if (!existing) {
        await prisma.supplierInvoice.create({ data: invoice });
        console.log(`✓ Factura ${invoice.code} creada - Balance: $${invoice.balance}`);
      } else {
        console.log(`- Factura ${invoice.code} ya existe`);
      }
    }

    // Mostrar resumen
    const stats = await prisma.supplierInvoice.aggregate({
      where: {
        balance: { gt: 0 },
        status: { in: ['PENDING', 'PARTIAL'] }
      },
      _sum: { balance: true },
      _count: true
    });

    const overdueStats = await prisma.supplierInvoice.aggregate({
      where: {
        balance: { gt: 0 },
        dueDate: { lt: new Date() },
        status: { in: ['PENDING', 'PARTIAL'] }
      },
      _sum: { balance: true },
      _count: true
    });

    console.log('\n=== RESUMEN ===');
    console.log(`Total facturas pendientes: ${stats._count}`);
    console.log(`Deuda total: $${stats._sum.balance || 0}`);
    console.log(`Facturas vencidas: ${overdueStats._count}`);
    console.log(`Deuda vencida: $${overdueStats._sum.balance || 0}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestInvoices();
