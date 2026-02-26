/**
 * Script para convertir TODOS los controllers de Prisma global a tenantPrisma
 * Este script procesa cada función y agrega la línea de prisma al inicio
 */

const fs = require('fs');
const path = require('path');

const controllersDir = path.join(__dirname, '../backend/src/controllers');

// Función para procesar un archivo controller
function processController(filePath) {
  const fileName = path.basename(filePath);
  console.log(`\n📄 Procesando ${fileName}...`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // 1. Reemplazar import de PrismaClient
  const importPrismaRegex = /import\s*{\s*PrismaClient[^}]*}\s*from\s*['"]@prisma\/client['"];?\n?/g;
  if (importPrismaRegex.test(content)) {
    content = content.replace(importPrismaRegex, '');
    console.log('  ✓ Eliminado import de PrismaClient');
    modified = true;
  }
  
  // 2. Agregar import de getTenantPrisma si no existe
  if (!content.includes('getTenantPrisma')) {
    // Buscar línea de import de AuthRequest y agregar después
    const authImportRegex = /(import\s*{\s*AuthRequest\s*}\s*from\s*['"]\.\.\/middleware\/auth\.middleware['"];)/;
    content = content.replace(authImportRegex, 
      `$1\nimport { getTenantPrisma } from '../middleware/tenant.middleware';`);
    console.log('  ✓ Agregado import de getTenantPrisma');
    modified = true;
  }
  
  // 3. Eliminar declaración global de prisma
  const globalPrismaRegex = /const\s+prisma\s*=\s*new\s+PrismaClient\(\);?\n/g;
  if (globalPrismaRegex.test(content)) {
    content = content.replace(globalPrismaRegex, '');
    console.log('  ✓ Eliminado prisma global');
    modified = true;
  }
  
  // 4. Agregar prisma al inicio de cada función exportada
  // Patrón: export const X = async (req: AuthRequest, res: Response) => {
  //           try {
  // Agregar después del try: const prisma = req.tenantPrisma || getTenantPrisma(...)
  
  const functionPattern = /(export\s+const\s+\w+\s*=\s*async\s*\(\s*req:\s*AuthRequest[^)]*\)\s*=>\s*{\s*\n\s*try\s*{\s*\n)(?!\s*const\s+prisma\s*=)/g;
  let match;
  let functionCount = 0;
  
  while ((match = functionPattern.exec(content)) !== null) {
    functionCount++;
  }
  
  if (functionCount > 0) {
    content = content.replace(functionPattern, 
      `$1    const prisma = req.tenantPrisma || getTenantPrisma(process.env.DATABASE_URL!);\n`);
    console.log(`  ✓ Agregado prisma a ${functionCount} funciones`);
    modified = true;
  } else {
    console.log('  ℹ No se encontraron funciones para modificar (o ya tienen prisma)');
  }
  
  // 5. Guardar archivo si fue modificado
  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log('  💾 Archivo guardado');
  } else {
    console.log('  ⏭ No se realizaron cambios');
  }
}

// Procesar todos los archivos .controller.ts
const files = fs.readdirSync(controllersDir)
  .filter(f => f.endsWith('.controller.ts'))
  .map(f => path.join(controllersDir, f));

console.log(`Encontrados ${files.length} controllers para procesar:`);
files.forEach(f => console.log(`  - ${path.basename(f)}`));

// Procesar cada archivo
files.forEach(processController);

console.log('\n✅ Proceso completado!');
console.log('Ahora reinicia el backend con: docker compose restart backend');
