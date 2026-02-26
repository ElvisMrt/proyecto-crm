const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkSaaSUsers() {
  try {
    console.log('🔍 Verificando usuarios SaaS Admin...\n');
    
    const users = await prisma.masterUser.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        password: true
      }
    });

    if (users.length === 0) {
      console.log('❌ No hay usuarios SaaS Admin en la base de datos');
      return;
    }

    console.log(`✅ Encontrados ${users.length} usuarios SaaS Admin:\n`);
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name || 'Sin nombre'}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Password: ${user.password ? '✅ Configurada' : '❌ NO configurada'}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkSaaSUsers();
