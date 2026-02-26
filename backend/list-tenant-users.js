const { PrismaClient } = require('@prisma/client');

// Conectar a la base de datos (usa la misma que los tenants según tu configuración)
const prisma = new PrismaClient();

async function listTenantUsers() {
  try {
    console.log('👥 USUARIOS DEL CRM (Tenant Database)\n');
    console.log('='.repeat(80));
    
    // Obtener usuarios de la tabla User (usuarios del CRM)
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });

    if (users.length === 0) {
      console.log('\n❌ No hay usuarios en la base de datos del tenant\n');
      return;
    }

    console.log(`\n✅ Encontrados ${users.length} usuarios del CRM:\n`);
    
    users.forEach((user, i) => {
      console.log(`${i + 1}. ${user.name || 'Sin nombre'}`);
      console.log(`   Email:    ${user.email}`);
      console.log(`   Role:     ${user.role}`);
      console.log(`   Active:   ${user.isActive ? '✅' : '❌'}`);
      console.log(`   Created:  ${user.createdAt.toLocaleDateString()}`);
      console.log('');
    });

    console.log('='.repeat(80));
    console.log('\n📋 CREDENCIALES PARA PANEL CRM:');
    console.log('   URL:      http://localhost:5174/login');
    console.log('   Tenant:   demo (detectado automáticamente en localhost)');
    console.log('\n   Usuarios disponibles:');
    
    users.forEach((user, i) => {
      console.log(`   ${i + 1}. ${user.email}`);
      console.log(`      Password: [Configurada en BD - probablemente "admin123"]`);
    });
    
    console.log('\n⚠️  Nota: Las contraseñas están hasheadas en la BD.');
    console.log('   Si no conoces la contraseña, puedo crear un script para resetearla.\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.message.includes('does not exist')) {
      console.log('\n💡 La tabla User no existe o no hay datos.');
      console.log('   Esto es normal si el tenant no ha sido provisionado completamente.\n');
    }
  } finally {
    await prisma.$disconnect();
  }
}

listTenantUsers();
