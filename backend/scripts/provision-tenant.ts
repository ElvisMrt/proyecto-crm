#!/usr/bin/env ts-node
/**
 * Script standalone para provisionar tenants manualmente
 * Uso: npx ts-node scripts/provision-tenant.ts <tenant-id>
 */

import { PrismaClient } from '@prisma/client';
import TenantProvisioningService from '../src/services/tenantProvisioning.service';

const masterPrisma = new PrismaClient();

async function main() {
  const tenantId = process.argv[2];

  if (!tenantId) {
    console.error('❌ Uso: npx ts-node scripts/provision-tenant.ts <tenant-id>');
    process.exit(1);
  }

  console.log(`🔧 Provisioning manual para tenant: ${tenantId}\n`);

  // Buscar tenant
  const tenant = await masterPrisma.tenant.findUnique({
    where: { id: tenantId },
    include: { admins: true },
  });

  if (!tenant) {
    console.error('❌ Tenant no encontrado');
    process.exit(1);
  }

  console.log(`📋 Tenant: ${tenant.name}`);
  console.log(`🗄️  Database: ${tenant.databaseName}`);
  console.log(`📧 Email: ${tenant.email}`);
  console.log(`👤 Admins: ${tenant.admins.length}\n`);

  // Obtener admin
  const admin = tenant.admins[0];
  if (!admin) {
    console.error('❌ Tenant no tiene administrador asignado');
    process.exit(1);
  }

  // Crear servicio de provisioning
  const provisioningService = new TenantProvisioningService(masterPrisma);

  // Ejecutar provisioning
  const result = await provisioningService.provisionTenant(tenantId, {
    name: admin.name,
    email: admin.email,
    password: 'temp123', // El admin real usará su propia contraseña
    companyName: tenant.name,
  });

  if (result.success) {
    console.log('\n✅ Provisioning completado exitosamente!');
    console.log(`\n🔗 Acceso al tenant:`);
    console.log(`   URL: http://${tenant.subdomain}.localhost:5173`);
    console.log(`   Admin: ${admin.email}`);
  } else {
    console.error('\n❌ Error en provisioning:', result.message);
    process.exit(1);
  }
}

main()
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await masterPrisma.$disconnect();
  });
