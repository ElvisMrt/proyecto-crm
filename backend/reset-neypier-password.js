const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resetPassword() {
  try {
    console.log('🔐 Reseteando contraseña para tenant neypier...\n');
    
    // Buscar usuario administrador de neypier
    const user = await prisma.user.findFirst({
      where: {
        email: {
          contains: 'neypier'
        },
        role: 'ADMINISTRATOR'
      }
    });

    if (!user) {
      console.log('❌ No se encontró usuario administrador para neypier');
      console.log('   Buscando todos los usuarios...\n');
      
      const allUsers = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true
        }
      });
      
      console.log(`Usuarios encontrados: ${allUsers.length}\n`);
      allUsers.forEach((u, i) => {
        console.log(`${i + 1}. ${u.name}`);
        console.log(`   Email: ${u.email}`);
        console.log(`   Role: ${u.role}`);
        console.log(`   Active: ${u.isActive}`);
        console.log('');
      });
      
      return;
    }

    console.log('✅ Usuario encontrado:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Role: ${user.role}`);
    
    // Hashear nueva contraseña
    const newPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Actualizar contraseña
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        password: hashedPassword,
        isActive: true
      }
    });

    console.log('\n✅ Contraseña actualizada exitosamente!\n');
    console.log('📋 CREDENCIALES:');
    console.log(`   URL:      http://localhost:5174/login`);
    console.log(`   Email:    ${user.email}`);
    console.log(`   Password: admin123`);
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

resetPassword();
