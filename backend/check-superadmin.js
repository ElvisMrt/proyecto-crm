const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkSuperAdmins() {
  try {
    console.log('🔍 Buscando usuarios SUPER_ADMIN...\n');
    
    const superAdmins = await prisma.masterUser.findMany({
      where: {
        role: 'SUPER_ADMIN'
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        tenantId: true
      }
    });

    if (superAdmins.length === 0) {
      console.log('❌ No hay usuarios con rol SUPER_ADMIN');
      console.log('\n💡 El panel SaaS Admin requiere usuarios con rol SUPER_ADMIN');
      console.log('   Los usuarios actuales tienen roles: SUPPORT\n');
      return;
    }

    console.log(`✅ Encontrados ${superAdmins.length} usuarios SUPER_ADMIN:\n`);
    
    superAdmins.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   TenantId: ${user.tenantId || 'null (usuario SaaS global)'}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkSuperAdmins();
