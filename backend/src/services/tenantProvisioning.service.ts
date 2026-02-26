import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import bcrypt from 'bcryptjs';

const execAsync = promisify(exec);

export class TenantProvisioningService {
  private masterPrisma: PrismaClient;

  constructor(masterPrisma: PrismaClient) {
    this.masterPrisma = masterPrisma;
  }

  /**
   * Crea una nueva base de datos física para un tenant
   * ACTUALIZADO: Ahora crea bases de datos separadas para cada tenant
   */
  async createTenantDatabase(databaseName: string): Promise<boolean> {
    try {
      console.log(`[Provisioning] Creando base de datos física: ${databaseName}`);
      
      // Ejecutar comando SQL para crear la base de datos
      const createDbCommand = `docker exec crm_postgres psql -U postgres -c "CREATE DATABASE ${databaseName};"`;
      
      try {
        await execAsync(createDbCommand);
        console.log(`[Provisioning] ✅ Base de datos ${databaseName} creada exitosamente`);
        return true;
      } catch (error: any) {
        // Si la base de datos ya existe, no es un error
        if (error.stderr && error.stderr.includes('already exists')) {
          console.log(`[Provisioning] ℹ️  Base de datos ${databaseName} ya existe`);
          return true;
        }
        throw error;
      }
    } catch (error) {
      console.error('[Provisioning] Error creando base de datos:', error);
      return false;
    }
  }

  /**
   * Aplica el schema del CRM a la base de datos del tenant
   * ACTUALIZADO: Ahora aplica migraciones a cada base de datos separada
   */
  async applyTenantSchema(databaseUrl: string): Promise<boolean> {
    try {
      console.log('[Provisioning] Aplicando schema CRM a base de datos separada...');
      
      // Ejecutar migraciones de Prisma en la base de datos del tenant
      const migrateCommand = `DATABASE_URL="${databaseUrl}" npx prisma migrate deploy`;
      
      try {
        await execAsync(migrateCommand, {
          cwd: process.cwd(),
        });
        console.log('[Provisioning] ✅ Schema aplicado exitosamente');
        return true;
      } catch (error: any) {
        console.error('[Provisioning] Error aplicando schema:', error);
        return false;
      }
    } catch (error) {
      console.error('[Provisioning] Error aplicando schema:', error);
      return false;
    }
  }

  /**
   * Crea datos iniciales para un tenant (usuario admin, sucursal default, etc.)
   */
  async seedTenantData(tenantId: string, adminData: {
    name: string;
    email: string;
    password: string;
    companyName: string;
  }): Promise<boolean> {
    try {
      const tenant = await this.masterPrisma.tenant.findUnique({
        where: { id: tenantId },
      });

      if (!tenant) {
        throw new Error('Tenant no encontrado');
      }

      // Crear Prisma Client para la DB del tenant
      const tenantPrisma = new PrismaClient({
        datasources: {
          db: { url: tenant.databaseUrl },
        },
      });

      console.log('[Provisioning] Creando datos iniciales...');

      // 1. Crear usuario administrador
      const hashedPassword = await bcrypt.hash(adminData.password, 10);

      const adminUser = await tenantPrisma.user.create({
        data: {
          email: adminData.email,
          password: hashedPassword,
          name: adminData.name,
          role: 'ADMINISTRATOR',
          isActive: true,
        },
      });

      // 2. Crear sucursal principal
      const mainBranch = await tenantPrisma.branch.create({
        data: {
          name: 'Sucursal Principal',
          code: 'MAIN001',
          address: tenant.address || 'Dirección no especificada',
          phone: tenant.phone,
          email: tenant.email,
          isActive: true,
        },
      });

      // 3. Asignar sucursal al admin
      await tenantPrisma.user.update({
        where: { id: adminUser.id },
        data: { branchId: mainBranch.id },
      });

      // 4. Crear categoría de productos por defecto
      await tenantPrisma.category.create({
        data: {
          name: 'General',
          description: 'Categoría por defecto para productos',
          isActive: true,
        },
      });

      // 5. Crear secuencia NCF por defecto
      await tenantPrisma.ncfSequence.create({
        data: {
          prefix: 'B01',
          description: 'Facturas de Crédito Fiscal',
          startRange: 1,
          endRange: 1000000,
          currentNumber: 0,
          isActive: true,
          branchId: mainBranch.id,
        },
      });

      await tenantPrisma.$disconnect();

      console.log('[Provisioning] Datos iniciales creados exitosamente');
      return true;
    } catch (error) {
      console.error('[Provisioning] Error creando datos iniciales:', error);
      return false;
    }
  }

  /**
   * Provisioning completo de un tenant
   */
  async provisionTenant(tenantId: string, adminData: {
    name: string;
    email: string;
    password: string;
    companyName: string;
  }): Promise<{ success: boolean; message: string }> {
    try {
      const tenant = await this.masterPrisma.tenant.findUnique({
        where: { id: tenantId },
      });

      if (!tenant) {
        return { success: false, message: 'Tenant no encontrado' };
      }

      console.log(`\n[Provisioning] Iniciando provisioning para tenant: ${tenant.name}`);
      console.log(`[Provisioning] Database: ${tenant.databaseName}`);
      console.log(`[Provisioning] URL: ${tenant.databaseUrl}\n`);

      // 1. Crear base de datos física
      const dbCreated = await this.createTenantDatabase(tenant.databaseName);
      if (!dbCreated) {
        return { success: false, message: 'Error creando base de datos física' };
      }

      // 2. Aplicar schema CRM
      const schemaApplied = await this.applyTenantSchema(tenant.databaseUrl);
      if (!schemaApplied) {
        return { success: false, message: 'Error aplicando schema CRM' };
      }

      // 3. Crear datos iniciales
      const dataSeeded = await this.seedTenantData(tenantId, adminData);
      if (!dataSeeded) {
        return { success: false, message: 'Error creando datos iniciales' };
      }

      // 4. Actualizar estado del tenant a ACTIVE
      await this.masterPrisma.tenant.update({
        where: { id: tenantId },
        data: { 
          status: 'ACTIVE',
          lastActiveAt: new Date(),
        },
      });

      console.log(`\n[Provisioning] ✅ Tenant ${tenant.name} provisionado exitosamente!\n`);

      return { 
        success: true, 
        message: 'Tenant provisionado exitosamente',
      };
    } catch (error: any) {
      console.error('[Provisioning] Error general:', error);
      return { success: false, message: error.message || 'Error en provisioning' };
    }
  }

  /**
   * Elimina la base de datos de un tenant (uso con precaución)
   */
  async deleteTenantDatabase(databaseName: string): Promise<boolean> {
    try {
      const baseDatabaseUrl = process.env.DATABASE_URL || '';
      const baseUrl = baseDatabaseUrl.replace(/\/[^/]*$/, '/postgres');

      console.log(`[Provisioning] Eliminando base de datos: ${databaseName}`);

      // Terminar conexiones activas
      const terminateCommand = `psql "${baseUrl}" -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${databaseName}' AND pid <> pg_backend_pid();"`;
      await execAsync(terminateCommand).catch(() => {}); // Ignorar errores aquí

      // Eliminar base de datos
      const dropCommand = `psql "${baseUrl}" -c "DROP DATABASE IF EXISTS \\"${databaseName}\\";"`;
      await execAsync(dropCommand);

      console.log(`[Provisioning] Base de datos ${databaseName} eliminada`);
      return true;
    } catch (error) {
      console.error('[Provisioning] Error eliminando base de datos:', error);
      return false;
    }
  }
}

export default TenantProvisioningService;
