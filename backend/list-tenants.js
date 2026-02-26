const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function listTenants() {
  try {
    console.log('🏢 LISTANDO TENANTS Y SUS CREDENCIALES\n');
    console.log('='.repeat(80));
    
    // Obtener todos los tenants
    const tenants = await prisma.tenant.findMany({
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        subdomain: true,
        email: true,
        status: true,
        plan: true,
        createdAt: true,
        users: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true
          }
        }
      }
    });

    if (tenants.length === 0) {
      console.log('❌ No hay tenants registrados\n');
      return;
    }

    console.log(`\n✅ Encontrados ${tenants.length} tenants:\n`);
    
    for (let i = 0; i < tenants.length; i++) {
      const tenant = tenants[i];
      console.log(`\n${'─'.repeat(80)}`);
      console.log(`${i + 1}. ${tenant.name}`);
      console.log(`${'─'.repeat(80)}`);
      console.log(`   Slug:       ${tenant.slug}`);
      console.log(`   Subdomain:  ${tenant.subdomain}`);
      console.log(`   Email:      ${tenant.email}`);
      console.log(`   Status:     ${tenant.status}`);
      console.log(`   Plan:       ${tenant.plan}`);
      console.log(`   Created:    ${tenant.createdAt.toLocaleDateString()}`);
      
      if (tenant.users && tenant.users.length > 0) {
        console.log(`\n   👥 Usuarios MasterUser (${tenant.users.length}):`);
        tenant.users.forEach((user, idx) => {
          console.log(`      ${idx + 1}. ${user.name}`);
          console.log(`         Email: ${user.email}`);
          console.log(`         Role:  ${user.role}`);
        });
      } else {
        console.log(`\n   ⚠️  No hay usuarios MasterUser asociados`);
      }
      
      console.log(`\n   🔗 URL de acceso:`);
      console.log(`      http://localhost:5174/login`);
      console.log(`      (El tenant se detecta automáticamente como "demo" en localhost)`);
    }

    console.log(`\n${'='.repeat(80)}\n`);
    
    // Ahora buscar usuarios en la base de datos del tenant "demo"
    console.log('🔍 Buscando usuarios en la base de datos del tenant...\n');
    console.log('⚠️  Nota: Los usuarios del CRM están en la base de datos del tenant,');
    console.log('   no en la tabla MasterUser. Para verlos necesitamos consultar');
    console.log('   la base de datos específica del tenant.\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

listTenants();
