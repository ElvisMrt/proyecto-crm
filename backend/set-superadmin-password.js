const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function setPassword() {
  try {
    const email = 'superadmin@crm.com';
    const newPassword = 'admin123';
    
    console.log('🔐 Configurando contraseña para superadmin...\n');
    
    // Buscar usuario
    const user = await prisma.masterUser.findUnique({
      where: { email }
    });

    if (!user) {
      console.log('❌ Usuario no encontrado:', email);
      return;
    }

    console.log('✅ Usuario encontrado:', user.name);
    console.log('   Email:', user.email);
    console.log('   Role:', user.role);
    
    // Hash de la nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Actualizar contraseña
    await prisma.masterUser.update({
      where: { email },
      data: { password: hashedPassword }
    });

    console.log('\n✅ Contraseña actualizada exitosamente!');
    console.log('\n📋 CREDENCIALES PARA PANEL SAAS ADMIN:');
    console.log('   URL:      http://localhost:5174/login?mode=saas');
    console.log('   Email:    superadmin@crm.com');
    console.log('   Password: admin123');
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

setPassword();
