const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanupTenants() {
  try {
    console.log('🧹 LIMPIEZA DE TENANTS\n');
    console.log('='.repeat(80));
    
    // Listar todos los tenants
    const allTenants = await prisma.tenant.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        subdomain: true,
        users: {
          select: {
            id: true,
            email: true
          }
        }
      }
    });

    console.log(`\n📊 Tenants actuales: ${allTenants.length}\n`);
    
    allTenants.forEach((t, i) => {
      console.log(`${i + 1}. ${t.name} (${t.subdomain})`);
      console.log(`   ID: ${t.id}`);
      console.log(`   Usuarios MasterUser: ${t.users.length}`);
    });

    // Identificar tenant a mantener (el que tiene subdomain "demo")
    const keepTenant = allTenants.find(t => t.subdomain === 'demo');
    
    if (!keepTenant) {
      console.log('\n❌ No se encontró el tenant "demo". Abortando limpieza.');
      return;
    }

    console.log(`\n✅ Manteniendo tenant: ${keepTenant.name} (${keepTenant.subdomain})`);
    console.log(`   ID: ${keepTenant.id}`);

    // Tenants a eliminar
    const tenantsToDelete = allTenants.filter(t => t.id !== keepTenant.id);
    
    if (tenantsToDelete.length === 0) {
      console.log('\n✅ No hay tenants para eliminar.');
      return;
    }

    console.log(`\n🗑️  Tenants a eliminar: ${tenantsToDelete.length}\n`);
    
    for (const tenant of tenantsToDelete) {
      console.log(`\nEliminando: ${tenant.name} (${tenant.subdomain})`);
      
      try {
        // Eliminar usuarios MasterUser asociados
        if (tenant.users.length > 0) {
          console.log(`   - Eliminando ${tenant.users.length} usuarios MasterUser...`);
          await prisma.masterUser.deleteMany({
            where: { tenantId: tenant.id }
          });
          console.log(`   ✅ Usuarios eliminados`);
        }

        // Eliminar subscripciones
        const subsCount = await prisma.subscription.count({
          where: { tenantId: tenant.id }
        });
        if (subsCount > 0) {
          console.log(`   - Eliminando ${subsCount} subscripciones...`);
          await prisma.subscription.deleteMany({
            where: { tenantId: tenant.id }
          });
          console.log(`   ✅ Subscripciones eliminadas`);
        }

        // Eliminar facturas del tenant
        const invoicesCount = await prisma.tenantInvoice.count({
          where: { tenantId: tenant.id }
        });
        if (invoicesCount > 0) {
          console.log(`   - Eliminando ${invoicesCount} facturas...`);
          await prisma.tenantInvoice.deleteMany({
            where: { tenantId: tenant.id }
          });
          console.log(`   ✅ Facturas eliminadas`);
        }

        // Eliminar actividades
        const activitiesCount = await prisma.tenantActivity.count({
          where: { tenantId: tenant.id }
        });
        if (activitiesCount > 0) {
          console.log(`   - Eliminando ${activitiesCount} actividades...`);
          await prisma.tenantActivity.deleteMany({
            where: { tenantId: tenant.id }
          });
          console.log(`   ✅ Actividades eliminadas`);
        }

        // Eliminar el tenant
        console.log(`   - Eliminando tenant...`);
        await prisma.tenant.delete({
          where: { id: tenant.id }
        });
        console.log(`   ✅ Tenant eliminado: ${tenant.name}`);

      } catch (error) {
        console.error(`   ❌ Error eliminando ${tenant.name}:`, error.message);
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('\n✅ LIMPIEZA COMPLETADA\n');

    // Verificar estado final
    const remainingTenants = await prisma.tenant.findMany({
      select: {
        name: true,
        subdomain: true,
        users: {
          select: {
            email: true
          }
        }
      }
    });

    console.log(`📊 Tenants restantes: ${remainingTenants.length}\n`);
    remainingTenants.forEach((t, i) => {
      console.log(`${i + 1}. ${t.name} (${t.subdomain})`);
      console.log(`   Usuarios MasterUser: ${t.users.length}`);
      t.users.forEach(u => console.log(`      - ${u.email}`));
    });

    console.log('\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupTenants();
