/**
 * Script para convertir controllers de Prisma global a tenantPrisma
 * Uso: node fix-controllers.js
 */

const fs = require('fs');
const path = require('path');

const controllersDir = path.join(__dirname, '../backend/src/controllers');

// Patrones a buscar y reemplazar
const patterns = [
  {
    name: 'Import PrismaClient',
    find: /import\s+{\s*PrismaClient\s*}\s+from\s+['"]@prisma\/client['"];?/,
    replace: ""
  },
  {
    name: 'Add getTenantPrisma import',
    find: /import\s+{\s*AuthRequest\s*}\s+from\s+['"]\.\.\/middleware\/auth\.middleware['"];?/,
    replace: "import { AuthRequest } from '../middleware/auth.middleware';\nimport { getTenantPrisma } from '../middleware/tenant.middleware';"
  },
  {
    name: 'Remove const prisma = new PrismaClient',
    find: /const\s+prisma\s*=\s*new\s+PrismaClient\(\);?\n/,
    replace: ""
  },
  {
    name: 'Add prisma to first function in getSummary',
    find: /(export\s+const\s+getSummary\s*=\s*async\s*\(\s*req:\s*AuthRequest[^)]*\)\s*=>\s*{\s*\n\s*try\s*{\s*\n)(\s*const\s+branchId)/,
    replace: "$1    const prisma = req.tenantPrisma || getTenantPrisma(process.env.DATABASE_URL!);\n$2"
  },
  {
    name: 'Add prisma to getSalesTrend',
    find: /(export\s+const\s+getSalesTrend\s*=\s*async\s*\(\s*req:\s*AuthRequest[^)]*\)\s*=>\s*{\s*\n\s*try\s*{\s*\n)(\s*const\s+days)/,
    replace: "$1    const prisma = req.tenantPrisma || getTenantPrisma(process.env.DATABASE_URL!);\n$2"
  },
  {
    name: 'Add prisma to getRecentActivity',
    find: /(export\s+const\s+getRecentActivity\s*=\s*async\s*\(\s*req:\s*AuthRequest[^)]*\)\s*=>\s*{\s*\n\s*try\s*{\s*\n)(\s*const\s+limit)/,
    replace: "$1    const prisma = req.tenantPrisma || getTenantPrisma(process.env.DATABASE_URL!);\n$2"
  }
];

// Funciones para sales.controller.ts
const salesPatterns = [
  {
    name: 'Import InvoiceStatus etc without PrismaClient',
    find: /import\s+{\s*PrismaClient,\s*(InvoiceStatus[^}]+)}\s+from\s+['"]@prisma\/client['"];?/,
    replace: "import { $1 } from '@prisma/client';\nimport { getTenantPrisma } from '../middleware/tenant.middleware';"
  },
  {
    name: 'Remove const prisma',
    find: /const\s+prisma\s*=\s*new\s+PrismaClient\(\);?\n/,
    replace: ""
  },
  {
    name: 'Add prisma to getInvoices',
    find: /(export\s+const\s+getInvoices\s*=\s*async\s*\(\s*req:\s*AuthRequest[^)]*\)\s*=>\s*{\s*\n\s*try\s*{\s*\n)(\s*const\s+page)/,
    replace: "$1    const prisma = req.tenantPrisma || getTenantPrisma(process.env.DATABASE_URL!);\n$2"
  },
  {
    name: 'Add prisma to getInvoice',
    find: /(export\s+const\s+getInvoice\s*=\s*async\s*\(\s*req:\s*AuthRequest[^)]*\)\s*=>\s*{\s*\n\s*try\s*{\s*\n)(\s*const\s+{\s*id\s*})/,
    replace: "$1    const prisma = req.tenantPrisma || getTenantPrisma(process.env.DATABASE_URL!);\n$2"
  },
  {
    name: 'Add prisma to createInvoice',
    find: /(export\s+const\s+createInvoice\s*=\s*async\s*\(\s*req:\s*AuthRequest[^)]*\)\s*=>\s*{\s*\n\s*try\s*{\s*\n)(\s*const\s+data)/,
    replace: "$1    const prisma = req.tenantPrisma || getTenantPrisma(process.env.DATABASE_URL!);\n$2"
  },
  {
    name: 'Add prisma to updateInvoice',
    find: /(export\s+const\s+updateInvoice\s*=\s*async\s*\(\s*req:\s*AuthRequest[^)]*\)\s*=>\s*{\s*\n\s*try\s*{\s*\n)(\s*const\s+{\s*id\s*})/,
    replace: "$1    const prisma = req.tenantPrisma || getTenantPrisma(process.env.DATABASE_URL!);\n$2"
  },
  {
    name: 'Add prisma to cancelInvoice',
    find: /(export\s+const\s+cancelInvoice\s*=\s*async\s*\(\s*req:\s*AuthRequest[^)]*\)\s*=>\s*{\s*\n\s*try\s*{\s*\n)(\s*const\s+{\s*id\s*})/,
    replace: "$1    const prisma = req.tenantPrisma || getTenantPrisma(process.env.DATABASE_URL!);\n$2"
  },
  {
    name: 'Add prisma to recordPayment',
    find: /(export\s+const\s+recordPayment\s*=\s*async\s*\(\s*req:\s*AuthRequest[^)]*\)\s*=>\s*{\s*\n\s*try\s*{\s*\n)(\s*const\s+{\s*id\s*})/,
    replace: "$1    const prisma = req.tenantPrisma || getTenantPrisma(process.env.DATABASE_URL!);\n$2"
  },
  {
    name: 'Add prisma to getQuotes',
    find: /(export\s+const\s+getQuotes\s*=\s*async\s*\(\s*req:\s*AuthRequest[^)]*\)\s*=>\s*{\s*\n\s*try\s*{\s*\n)(\s*const\s+page)/,
    replace: "$1    const prisma = req.tenantPrisma || getTenantPrisma(process.env.DATABASE_URL!);\n$2"
  },
  {
    name: 'Add prisma to getQuote',
    find: /(export\s+const\s+getQuote\s*=\s*async\s*\(\s*req:\s*AuthRequest[^)]*\)\s*=>\s*{\s*\n\s*try\s*{\s*\n)(\s*const\s+{\s*id\s*})/,
    replace: "$1    const prisma = req.tenantPrisma || getTenantPrisma(process.env.DATABASE_URL!);\n$2"
  },
  {
    name: 'Add prisma to createQuote',
    find: /(export\s+const\s+createQuote\s*=\s*async\s*\(\s*req:\s*AuthRequest[^)]*\)\s*=>\s*{\s*\n\s*try\s*{\s*\n)(\s*const\s+data)/,
    replace: "$1    const prisma = req.tenantPrisma || getTenantPrisma(process.env.DATABASE_URL!);\n$2"
  },
  {
    name: 'Add prisma to updateQuote',
    find: /(export\s+const\s+updateQuote\s*=\s*async\s*\(\s*req:\s*AuthRequest[^)]*\)\s*=>\s*{\s*\n\s*try\s*{\s*\n)(\s*const\s+{\s*id\s*})/,
    replace: "$1    const prisma = req.tenantPrisma || getTenantPrisma(process.env.DATABASE_URL!);\n$2"
  },
  {
    name: 'Add prisma to convertQuoteToInvoice',
    find: /(export\s+const\s+convertQuoteToInvoice\s*=\s*async\s*\(\s*req:\s*AuthRequest[^)]*\)\s*=>\s*{\s*\n\s*try\s*{\s*\n)(\s*const\s+{\s*id\s*})/,
    replace: "$1    const prisma = req.tenantPrisma || getTenantPrisma(process.env.DATABASE_URL!);\n$2"
  },
  {
    name: 'Add prisma to getCreditNotes',
    find: /(export\s+const\s+getCreditNotes\s*=\s*async\s*\(\s*req:\s*AuthRequest[^)]*\)\s*=>\s*{\s*\n\s*try\s*{\s*\n)(\s*const\s+page)/,
    replace: "$1    const prisma = req.tenantPrisma || getTenantPrisma(process.env.DATABASE_URL!);\n$2"
  },
  {
    name: 'Add prisma to getCreditNote',
    find: /(export\s+const\s+getCreditNote\s*=\s*async\s*\(\s*req:\s*AuthRequest[^)]*\)\s*=>\s*{\s*\n\s*try\s*{\s*\n)(\s*const\s+{\s*id\s*})/,
    replace: "$1    const prisma = req.tenantPrisma || getTenantPrisma(process.env.DATABASE_URL!);\n$2"
  },
  {
    name: 'Add prisma to createCreditNote',
    find: /(export\s+const\s+createCreditNote\s*=\s*async\s*\(\s*req:\s*AuthRequest[^)]*\)\s*=>\s*{\s*\n\s*try\s*{\s*\n)(\s*const\s+data)/,
    replace: "$1    const prisma = req.tenantPrisma || getTenantPrisma(process.env.DATABASE_URL!);\n$2"
  }
];

function fixController(filePath, customPatterns = null) {
  console.log(`Processing ${path.basename(filePath)}...`);
  let content = fs.readFileSync(filePath, 'utf8');
  const patternsToUse = customPatterns || patterns;
  
  for (const pattern of patternsToUse) {
    const matches = content.match(pattern.find);
    if (matches) {
      console.log(`  - Applying: ${pattern.name} (${matches.length} matches)`);
      content = content.replace(pattern.find, pattern.replace);
    } else {
      console.log(`  - Skipped: ${pattern.name} (no matches)`);
    }
  }
  
  fs.writeFileSync(filePath, content);
  console.log(`  ✓ Saved\n`);
}

// Fix dashboard (ya está corregido)
// fixController(path.join(controllersDir, 'dashboard.controller.ts'), patterns);

// Fix sales (usar patrones específicos)
fixController(path.join(controllersDir, 'sales.controller.ts'), salesPatterns);

console.log('Done!');
