const { execSync } = require('child_process');

// URL de la base de datos del tenant
const tenantDbUrl = 'postgresql://postgres:postgres@localhost:5434/tenant_mi_empresa_demo';

console.log('🔄 Sincronizando schema de Prisma con la base de datos del tenant...');
console.log(`📦 Base de datos: tenant_mi_empresa_demo`);

try {
  // Ejecutar prisma db push con la URL del tenant
  execSync(`DATABASE_URL="${tenantDbUrl}" npx prisma db push --skip-generate`, {
    stdio: 'inherit',
    cwd: __dirname
  });
  
  console.log('\n✅ ¡Schema sincronizado exitosamente!');
  console.log('✅ Todas las tablas del módulo de proveedores han sido creadas');
  
} catch (error) {
  console.error('\n❌ Error al sincronizar schema:', error.message);
  process.exit(1);
}
