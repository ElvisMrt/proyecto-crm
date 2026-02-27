import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import { promisify } from 'util';
import bcrypt from 'bcryptjs';

const execAsync = promisify(exec);

export class TenantProvisioningService {
  private masterPrisma: PrismaClient;

  constructor(masterPrisma: PrismaClient) {
    this.masterPrisma = masterPrisma;
  }

  /**
   * Construye la URL de DB para un tenant dado su nombre de DB
   */
  private buildTenantDbUrl(databaseName: string): string {
    const base = process.env.DATABASE_URL || '';
    return base.replace(/\/[^/?]+(\?.*)?$/, `/${databaseName}$1`);
  }

  /**
   * Crea la base de datos física del tenant usando una conexión Prisma a postgres
   */
  async createTenantDatabase(databaseName: string): Promise<boolean> {
    try {
      console.log(`[Provisioning] Creando base de datos: ${databaseName}`);

      // Conectar a la DB de administración (postgres) para ejecutar CREATE DATABASE
      const adminUrl = (process.env.DATABASE_URL || '').replace(/\/[^/?]+(\?.*)?$/, '/postgres$1');
      const adminPrisma = new PrismaClient({ datasources: { db: { url: adminUrl } } });

      try {
        await adminPrisma.$executeRawUnsafe(`CREATE DATABASE "${databaseName}"`);
        console.log(`[Provisioning] ✅ Base de datos ${databaseName} creada`);
      } catch (err: any) {
        if (err.message?.includes('already exists')) {
          console.log(`[Provisioning] ℹ️  Base de datos ${databaseName} ya existe`);
        } else {
          throw err;
        }
      } finally {
        await adminPrisma.$disconnect();
      }

      return true;
    } catch (error) {
      console.error('[Provisioning] Error creando base de datos:', error);
      return false;
    }
  }

  /**
   * Aplica migraciones Prisma a la DB del tenant usando child_process con env variable
   */
  async applyTenantSchema(databaseUrl: string): Promise<boolean> {
    try {
      console.log('[Provisioning] Aplicando migraciones Prisma...');

      const { stdout, stderr } = await execAsync(
        'npx prisma migrate deploy --schema=/app/prisma/schema.prisma',
        {
          cwd: '/app',
          env: { ...process.env, DATABASE_URL: databaseUrl },
          timeout: 60000,
        }
      );

      if (stdout) console.log('[Provisioning] migrate stdout:', stdout.slice(0, 500));
      if (stderr && !stderr.includes('warn')) console.warn('[Provisioning] migrate stderr:', stderr.slice(0, 300));

      console.log('[Provisioning] ✅ Migraciones aplicadas');
      return true;
    } catch (error: any) {
      console.error('[Provisioning] Error aplicando migraciones:', error.message);
      return false;
    }
  }

  /**
   * Crea datos iniciales para el tenant: admin, sucursal, categoría, NCF
   */
  async seedTenantData(tenantId: string, adminData: {
    name: string;
    email: string;
    password: string;
    companyName: string;
  }): Promise<boolean> {
    try {
      const tenant = await this.masterPrisma.tenant.findUnique({ where: { id: tenantId } });
      if (!tenant) throw new Error('Tenant no encontrado');

      const tenantPrisma = new PrismaClient({
        datasources: { db: { url: tenant.databaseUrl } },
      });

      console.log('[Provisioning] Creando datos iniciales para:', tenant.name);

      const hashedPassword = await bcrypt.hash(adminData.password, 10);

      // 1. Admin
      const adminUser = await tenantPrisma.user.create({
        data: {
          email: adminData.email,
          password: hashedPassword,
          name: adminData.name,
          role: 'ADMINISTRATOR',
          isActive: true,
        },
      });

      // 2. Sucursal principal
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

      // 4. Categoría por defecto
      await tenantPrisma.category.create({
        data: {
          name: 'General',
          description: 'Categoría por defecto',
          isActive: true,
        },
      });

      // 5. Secuencia NCF por defecto
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
      console.log('[Provisioning] ✅ Datos iniciales creados');
      return true;
    } catch (error) {
      console.error('[Provisioning] Error en seed:', error);
      return false;
    }
  }

  /**
   * Provisioning completo: crear DB + migraciones + seed + activar tenant
   */
  async provisionTenant(tenantId: string, adminData: {
    name: string;
    email: string;
    password: string;
    companyName: string;
  }): Promise<{ success: boolean; message: string }> {
    try {
      const tenant = await this.masterPrisma.tenant.findUnique({ where: { id: tenantId } });
      if (!tenant) return { success: false, message: 'Tenant no encontrado' };

      console.log(`\n[Provisioning] ▶ Iniciando para: ${tenant.name} (${tenant.databaseName})`);

      // Asegurarse de que la databaseUrl sea la correcta (basada en databaseName)
      const tenantDbUrl = this.buildTenantDbUrl(tenant.databaseName);

      // Actualizar databaseUrl en master si difiere
      if (tenant.databaseUrl !== tenantDbUrl) {
        await this.masterPrisma.tenant.update({
          where: { id: tenantId },
          data: { databaseUrl: tenantDbUrl },
        });
        console.log(`[Provisioning] ✅ databaseUrl actualizada: ${tenantDbUrl}`);
      }

      // 1. Crear DB
      const dbCreated = await this.createTenantDatabase(tenant.databaseName);
      if (!dbCreated) return { success: false, message: 'Error creando base de datos física' };

      // 2. Migraciones
      const schemaOk = await this.applyTenantSchema(tenantDbUrl);
      if (!schemaOk) return { success: false, message: 'Error aplicando migraciones' };

      // 3. Seed (con la URL actualizada en el tenant)
      const updatedTenant = await this.masterPrisma.tenant.findUnique({ where: { id: tenantId } });
      if (!updatedTenant) return { success: false, message: 'Tenant no encontrado tras actualización' };

      const seeded = await this.seedTenantData(tenantId, adminData);
      if (!seeded) return { success: false, message: 'Error en datos iniciales' };

      // 4. Activar
      await this.masterPrisma.tenant.update({
        where: { id: tenantId },
        data: { status: 'ACTIVE', lastActiveAt: new Date() },
      });

      console.log(`[Provisioning] ✅ Tenant ${tenant.name} provisionado y ACTIVO\n`);
      return { success: true, message: 'Tenant provisionado exitosamente' };
    } catch (error: any) {
      console.error('[Provisioning] Error general:', error);
      return { success: false, message: error.message || 'Error en provisioning' };
    }
  }

  /**
   * Elimina la base de datos de un tenant
   */
  async deleteTenantDatabase(databaseName: string): Promise<boolean> {
    try {
      const adminUrl = (process.env.DATABASE_URL || '').replace(/\/[^/?]+(\?.*)?$/, '/postgres$1');
      const adminPrisma = new PrismaClient({ datasources: { db: { url: adminUrl } } });

      try {
        // Terminar conexiones activas
        await adminPrisma.$executeRawUnsafe(
          `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${databaseName}' AND pid <> pg_backend_pid()`
        );
        await adminPrisma.$executeRawUnsafe(`DROP DATABASE IF EXISTS "${databaseName}"`);
        console.log(`[Provisioning] Base de datos ${databaseName} eliminada`);
      } finally {
        await adminPrisma.$disconnect();
      }

      return true;
    } catch (error) {
      console.error('[Provisioning] Error eliminando base de datos:', error);
      return false;
    }
  }
}

export default TenantProvisioningService;
