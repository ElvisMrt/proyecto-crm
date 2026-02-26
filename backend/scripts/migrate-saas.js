#!/usr/bin/env node
/**
 * Script de migración manual para campos SaaS
 * Este script verifica y crea las columnas necesarias directamente
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Verificando schema de base de datos...\n');

  try {
    // Verificar si la tabla Tenant existe
    const tableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'Tenant'
      );
    `;

    console.log('¿Tabla Tenant existe?', tableExists);

    if (!tableExists || !tableExists[0]?.exists) {
      console.log('❌ La tabla Tenant no existe. Creando tabla completa...');
      
      // Crear tabla Tenant completa
      await prisma.$executeRawUnsafe(`
        CREATE TABLE "Tenant" (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
          slug TEXT UNIQUE NOT NULL,
          name TEXT NOT NULL,
          subdomain TEXT UNIQUE NOT NULL,
          "customDomain" TEXT UNIQUE,
          email TEXT NOT NULL,
          phone TEXT,
          address TEXT,
          rnc TEXT,
          logo TEXT,
          country TEXT DEFAULT 'DO',
          status TEXT DEFAULT 'PENDING',
          plan TEXT DEFAULT 'BASIC',
          "databaseName" TEXT NOT NULL,
          "databaseUrl" TEXT NOT NULL,
          settings JSONB,
          limits JSONB,
          "billingEmail" TEXT NOT NULL,
          "subscriptionId" TEXT,
          "trialEndsAt" TIMESTAMP,
          "lastActiveAt" TIMESTAMP,
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Crear índices
      await prisma.$executeRawUnsafe(`
        CREATE INDEX "Tenant_slug_idx" ON "Tenant"(slug);
        CREATE INDEX "Tenant_subdomain_idx" ON "Tenant"(subdomain);
        CREATE INDEX "Tenant_status_idx" ON "Tenant"(status);
        CREATE INDEX "Tenant_customDomain_idx" ON "Tenant"("customDomain");
      `);

      console.log('✅ Tabla Tenant creada exitosamente');
    } else {
      console.log('✓ Tabla Tenant existe, verificando columnas...\n');

      // Verificar columnas existentes
      const columns = await prisma.$queryRaw`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'Tenant';
      `;
      
      console.log('Columnas actuales:', columns.map(c => c.column_name).join(', '));

      // Verificar y agregar columnas faltantes
      const requiredColumns = [
        { name: 'subdomain', type: 'TEXT UNIQUE NOT NULL DEFAULT \'\'' },
        { name: 'customDomain', type: 'TEXT UNIQUE' },
        { name: 'databaseName', type: 'TEXT NOT NULL DEFAULT \'\'' },
        { name: 'databaseUrl', type: 'TEXT NOT NULL DEFAULT \'\'' },
        { name: 'settings', type: 'JSONB' },
        { name: 'limits', type: 'JSONB' },
        { name: 'billingEmail', type: 'TEXT NOT NULL DEFAULT \'\'' },
        { name: 'subscriptionId', type: 'TEXT' },
        { name: 'trialEndsAt', type: 'TIMESTAMP' },
        { name: 'lastActiveAt', type: 'TIMESTAMP' },
      ];

      const existingColumnNames = columns.map(c => c.column_name.toLowerCase());

      for (const col of requiredColumns) {
        const colNameLower = col.name.toLowerCase();
        const colNameQuoted = col.name === col.name.toLowerCase() ? `"${col.name}"` : `"${col.name}"`;
        
        // Buscar si existe la columna (comparando en minúsculas)
        const exists = columns.some(c => 
          c.column_name.toLowerCase() === colNameLower || 
          c.column_name === col.name ||
          c.column_name === `"${col.name}"`
        );

        if (!exists) {
          console.log(`➕ Agregando columna ${col.name}...`);
          try {
            await prisma.$executeRawUnsafe(`
              ALTER TABLE "Tenant" ADD COLUMN ${colNameQuoted} ${col.type};
            `);
            console.log(`  ✓ ${col.name} agregada`);
          } catch (e) {
            console.log(`  ⚠ Error agregando ${col.name}:`, e.message);
          }
        } else {
          console.log(`  ✓ ${col.name} ya existe`);
        }
      }
    }

    console.log('\n✅ Migración completada');

    // Verificar tabla final
    const finalColumns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'Tenant'
      ORDER BY ordinal_position;
    `;
    
    console.log('\n📋 Columnas en la tabla Tenant:');
    finalColumns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'required'})`);
    });

  } catch (error) {
    console.error('❌ Error en migración:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
