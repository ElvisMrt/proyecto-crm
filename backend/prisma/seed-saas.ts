import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de SaaS...');

  // Crear superadmin
  const superAdminPassword = await bcrypt.hash('admin123', 10);
  
  const superAdmin = await prisma.masterUser.upsert({
    where: { email: 'superadmin@crm.com' },
    update: {},
    create: {
      email: 'superadmin@crm.com',
      password: superAdminPassword,
      name: 'Super Administrador',
      role: 'SUPER_ADMIN',
    },
  });

  console.log('✅ Superadmin creado:', superAdmin.email);

  // Crear tenant de ejemplo (demo)
  const demoTenant = await prisma.tenant.upsert({
    where: { slug: 'demo' },
    update: {},
    create: {
      slug: 'demo',
      name: 'Empresa Demo',
      subdomain: 'demo',
      email: 'demo@empresa.com',
      phone: '+1-809-555-0001',
      address: 'Av. Demo 123, Santo Domingo',
      rnc: '123456789',
      country: 'DO',
      status: 'ACTIVE',
      plan: 'PROFESSIONAL',
      databaseName: 'crm_tenant_demo',
      databaseUrl: process.env.DATABASE_URL?.replace('crm_master', 'crm_tenant_demo') || '',
      billingEmail: 'demo@empresa.com',
      settings: JSON.stringify({
        theme: 'light',
        currency: 'DOP',
        timezone: 'America/Santo_Domingo',
        language: 'es',
      }),
      limits: JSON.stringify({
        maxUsers: 10,
        maxStorage: '5GB',
        maxBranches: 3,
      }),
    },
  });

  console.log('✅ Tenant demo creado:', demoTenant.name);

  // Crear admin del tenant demo (si el modelo existe)
  try {
    const tenantAdminPassword = await bcrypt.hash('admin123', 10);
    
    // @ts-ignore - El modelo puede no existir en el Prisma Client aún
    const tenantAdmin = await prisma.tenantAdmin?.upsert({
      where: {
        tenantId_email: {
          tenantId: demoTenant.id,
          email: 'admin@demo.com',
        },
      },
      update: {},
      create: {
        tenantId: demoTenant.id,
        email: 'admin@demo.com',
        name: 'Administrador Demo',
        password: tenantAdminPassword,
        role: 'OWNER',
        isActive: true,
      },
    });

    if (tenantAdmin) {
      console.log('✅ Admin de tenant creado:', tenantAdmin.email);
    }
  } catch (e) {
    console.log('⚠️  Tabla TenantAdmin no disponible, saltando...');
  }

  // Crear factura de ejemplo (si el modelo existe)
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // @ts-ignore - El modelo puede no existir en el Prisma Client aún
    await prisma.tenantInvoice?.create({
      data: {
        tenantId: demoTenant.id,
        amount: 79.00,
        currency: 'USD',
        status: 'PAID',
        periodStart: startOfMonth,
        periodEnd: endOfMonth,
        paidAt: new Date(),
        paymentMethod: 'CARD',
        notes: 'Pago inicial - Plan Profesional',
      },
    });

    console.log('✅ Factura de ejemplo creada');
  } catch (e) {
    console.log('⚠️  Tabla TenantInvoice no disponible, saltando...');
  }

  console.log('\n🎉 Seed completado exitosamente!');
  console.log('\nCredenciales de acceso:');
  console.log('Superadmin: superadmin@crm.com / admin123');
  console.log('Tenant Admin: admin@demo.com / admin123');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
