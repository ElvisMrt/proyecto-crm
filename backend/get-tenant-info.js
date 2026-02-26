const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function getTenantInfo() {
  try {
    const slug = process.argv[2] || 'neypier';
    
    console.log(`\n🔍 Buscando tenant: ${slug}\n`);
    
    // Buscar tenant por slug o subdomain
    const tenant = await prisma.tenant.findFirst({
      where: {
        OR: [
          { slug: slug },
          { subdomain: slug }
        ]
      },
      select: {
        id: true,
        name: true,
        slug: true,
        subdomain: true,
        email: true,
        status: true,
        plan: true,
        createdAt: true
      }
    });

    if (!tenant) {
      console.log(`❌ Tenant "${slug}" no encontrado\n`);
      return;
    }

    console.log('✅ TENANT ENCONTRADO:\n');
    console.log(`   Nombre:     ${tenant.name}`);
    console.log(`   Slug:       ${tenant.slug}`);
    console.log(`   Subdomain:  ${tenant.subdomain}`);
    console.log(`   Email:      ${tenant.email}`);
    console.log(`   Status:     ${tenant.status}`);
    console.log(`   Plan:       ${tenant.plan}`);
    console.log(`   Creado:     ${tenant.createdAt.toLocaleString()}`);

    // Buscar usuarios del CRM para este tenant
    console.log('\n👥 USUARIOS CRM:\n');
    
    const users = await prisma.user.findMany({
      where: { isActive: true },
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      },
      take: 10
    });

    if (users.length === 0) {
      console.log('   ⚠️  No hay usuarios CRM creados para este tenant\n');
    } else {
      users.forEach((user, i) => {
        console.log(`   ${i + 1}. ${user.name}`);
        console.log(`      Email: ${user.email}`);
        console.log(`      Role:  ${user.role}`);
      });
    }

    console.log('\n📋 CREDENCIALES DE ACCESO:\n');
    console.log(`   URL:      http://localhost:5174/login`);
    console.log(`   Tenant:   ${tenant.subdomain} (detectado automáticamente en localhost)`);
    
    if (users.length > 0) {
      console.log(`\n   Usuario administrador:`);
      console.log(`   Email:    ${users[0].email}`);
      console.log(`   Password: [La que configuraste al crear el tenant]`);
    }
    
    console.log('\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

getTenantInfo();
