import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Agregando productos de farmacia al sistema existente...');

  // Obtener categorías existentes o crear las de farmacia si no existen
  const categories = await Promise.all([
    // Buscar o crear categoría de Medicamentos
    prisma.category.upsert({
      where: { name: 'Medicamentos' },
      update: {},
      create: {
        name: 'Medicamentos',
        description: 'Medicamentos recetados y de venta libre',
      },
    }),
    // Buscar o crear categoría de Cuidado Personal
    prisma.category.upsert({
      where: { name: 'Cuidado Personal' },
      update: {},
      create: {
        name: 'Cuidado Personal',
        description: 'Productos de higiene y cuidado personal',
      },
    }),
    // Buscar o crear categoría de Vitaminas
    prisma.category.upsert({
      where: { name: 'Vitaminas y Suplementos' },
      update: {},
      create: {
        name: 'Vitaminas y Suplementos',
        description: 'Vitaminas, minerales y suplementos dietéticos',
      },
    }),
    // Buscar o crear categoría de Equipamiento Médico
    prisma.category.upsert({
      where: { name: 'Equipamiento Médico' },
      update: {},
      create: {
        name: 'Equipamiento Médico',
        description: 'Equipos y suministros médicos',
      },
    }),
    // Buscar o crear categoría de Bebés
    prisma.category.upsert({
      where: { name: 'Bebés' },
      update: {},
      create: {
        name: 'Bebés',
        description: 'Productos para cuidado de bebés',
      },
    }),
  ]);

  // Obtener la primera sucursal (debería existir del seed original)
  const branches = await prisma.branch.findMany({ take: 1 });
  if (branches.length === 0) {
    console.log('❌ No se encontraron sucursales. Ejecuta primero el seed principal.');
    return;
  }
  const mainBranch = branches[0];

  // Crear productos de farmacia
  const pharmacyProducts = [
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
    {
      code: 'MED-004',
      barcode: '7501234567893',
      name: 'Omeprazol 20mg',
      description: 'Cápsulas de omeprazol 20mg, para acidez estomacal',
      categoryId: categories[0].id,
      brand: 'AstraZeneca',
      unit: 'CAJA',
      salePrice: 220.00,
      cost: 150.00,
      hasTax: true,
      taxPercent: 18,
      controlsStock: true,
      minStock: 12,
    },
    {
      code: 'MED-005',
      barcode: '7501234567894',
      name: 'Loratadina 10mg',
      description: 'Tabletas de loratadina 10mg, antialérgico',
      categoryId: categories[0].id,
      brand: 'Schering-Plough',
      unit: 'CAJA',
      salePrice: 180.00,
      cost: 120.00,
      hasTax: true,
      taxPercent: 18,
      controlsStock: true,
      minStock: 18,
    },
    // Cuidado Personal
    {
      code: 'CP-001',
      barcode: '7501234567895',
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
      barcode: '7501234567896',
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
    {
      code: 'CP-003',
      barcode: '7501234567897',
      name: 'Papel Higiénico',
      description: 'Paquete de papel higiénico 4 rollos',
      categoryId: categories[1].id,
      brand: 'Scott',
      unit: 'PAQUETE',
      salePrice: 85.00,
      cost: 55.00,
      hasTax: true,
      taxPercent: 18,
      controlsStock: true,
      minStock: 40,
    },
    {
      code: 'CP-004',
      barcode: '7501234567898',
      name: 'Crema Corporal',
      description: 'Crema hidratante corporal 250ml',
      categoryId: categories[1].id,
      brand: 'Nivea',
      unit: 'UNIDAD',
      salePrice: 150.00,
      cost: 95.00,
      hasTax: true,
      taxPercent: 18,
      controlsStock: true,
      minStock: 20,
    },
    // Vitaminas
    {
      code: 'VIT-001',
      barcode: '7501234567899',
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
      barcode: '7501234567800',
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
    {
      code: 'VIT-003',
      barcode: '7501234567801',
      name: 'Vitamina D3',
      description: 'Cápsulas de vitamina D3 1000 UI, frasco con 100 cápsulas',
      categoryId: categories[2].id,
      brand: 'Solgar',
      unit: 'FRASCO',
      salePrice: 380.00,
      cost: 240.00,
      hasTax: true,
      taxPercent: 18,
      controlsStock: true,
      minStock: 8,
    },
    {
      code: 'VIT-004',
      barcode: '7501234567802',
      name: 'Omega 3',
      description: 'Cápsulas de aceite de pescado omega 3, frasco con 120 cápsulas',
      categoryId: categories[2].id,
      brand: 'Nordic Naturals',
      unit: 'FRASCO',
      salePrice: 520.00,
      cost: 320.00,
      hasTax: true,
      taxPercent: 18,
      controlsStock: true,
      minStock: 6,
    },
    // Equipamiento Médico
    {
      code: 'EQ-001',
      barcode: '7501234567803',
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
      barcode: '7501234567804',
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
    {
      code: 'EQ-003',
      barcode: '7501234567805',
      name: 'Glucómetro',
      description: 'Glucómetro para medición de glucosa en sangre',
      categoryId: categories[3].id,
      brand: 'Accu-Chek',
      unit: 'KIT',
      salePrice: 850.00,
      cost: 600.00,
      hasTax: true,
      taxPercent: 18,
      controlsStock: true,
      minStock: 8,
    },
    {
      code: 'EQ-004',
      barcode: '7501234567806',
      name: 'Nebulizador',
      description: 'Nebulizador portátil para tratamientos respiratorios',
      categoryId: categories[3].id,
      brand: 'Philips',
      unit: 'UNIDAD',
      salePrice: 3200.00,
      cost: 2400.00,
      hasTax: true,
      taxPercent: 18,
      controlsStock: true,
      minStock: 3,
    },
    // Bebés
    {
      code: 'BEB-001',
      barcode: '7501234567807',
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
      barcode: '7501234567808',
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
    {
      code: 'BEB-003',
      barcode: '7501234567809',
      name: 'Toallitas Húmedas',
      description: 'Toallitas húmedas para bebés, paquete con 80 unidades',
      categoryId: categories[4].id,
      brand: 'Pampers',
      unit: 'PAQUETE',
      salePrice: 95.00,
      cost: 65.00,
      hasTax: true,
      taxPercent: 18,
      controlsStock: true,
      minStock: 35,
    },
    {
      code: 'BEB-004',
      barcode: '7501234567810',
      name: 'Shampoo para Bebés',
      description: 'Shampoo suave para bebés 200ml',
      categoryId: categories[4].id,
      brand: 'Johnson\'s',
      unit: 'UNIDAD',
      salePrice: 110.00,
      cost: 75.00,
      hasTax: true,
      taxPercent: 18,
      controlsStock: true,
      minStock: 25,
    },
  ];

  // Insertar productos sin duplicar códigos
  const createdProducts = [];
  for (const productData of pharmacyProducts) {
    try {
      const product = await prisma.product.upsert({
        where: { code: productData.code },
        update: productData,
        create: productData,
      });
      createdProducts.push(product);
      console.log(`✅ Producto creado/actualizado: ${product.name}`);
    } catch (error) {
      console.log(`⚠️ Error al crear producto ${productData.code}:`, error);
    }
  }

  // Crear stock para los nuevos productos
  for (const product of createdProducts) {
    try {
      await prisma.stock.upsert({
        where: {
          productId_branchId: {
            productId: product.id,
            branchId: mainBranch.id,
          },
        },
        update: {
          quantity: Math.floor(Math.random() * 50) + 20, // Stock entre 20-70
        },
        create: {
          productId: product.id,
          branchId: mainBranch.id,
          quantity: Math.floor(Math.random() * 50) + 20, // Stock entre 20-70
          minStock: product.minStock,
        },
      });
      console.log(`📦 Stock creado para: ${product.name}`);
    } catch (error) {
      console.log(`⚠️ Error al crear stock para ${product.name}:`, error);
    }
  }

  console.log('✅ Productos de farmacia agregados exitosamente');
  console.log(`📊 Total de productos agregados: ${createdProducts.length}`);
  console.log('🏬 El sistema ahora tiene productos de farmacia manteniendo los usuarios originales');
}

main()
  .catch((e) => {
    console.error('❌ Error en el seed de productos de farmacia:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
