import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';

const execAsync = promisify(exec);

/**
 * Servicio de backups para tenants
 * Permite crear y restaurar backups de bases de datos individuales
 */
export class BackupService {
  private backupDir: string;
  private postgresBinDir: string | null;

  constructor() {
    this.backupDir = process.env.BACKUP_DIR || '/app/backups';
    this.postgresBinDir = process.env.POSTGRES_BIN_DIR || this.detectPostgresBinDir();
    this.ensureBackupDir();
  }

  private ensureBackupDir() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  /**
   * Crea un backup de la base de datos de un tenant
   */
  async createBackup(
    databaseName: string,
    tenantId: string
  ): Promise<{
    success: boolean;
    filename?: string;
    size?: number;
    error?: string;
  }> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${databaseName}_${timestamp}.sql.gz`;
    const filepath = path.join(this.backupDir, filename);

    try {
      console.log(`[Backup] Iniciando backup de ${databaseName}...`);

      const baseDatabaseUrl = process.env.DATABASE_URL || '';
      if (!baseDatabaseUrl) {
        return { success: false, error: 'DATABASE_URL no configurada' };
      }

      const pgDumpCommand = this.resolveCommand('pg_dump');
      const pgDumpAvailable = await this.commandExists(pgDumpCommand);
      if (!pgDumpAvailable) {
        return { success: false, error: 'pg_dump no está instalado en este entorno' };
      }

      // Crear backup usando pg_dump
      const dumpCommand = `set -o pipefail; "${pgDumpCommand}" "${baseDatabaseUrl.replace(/\/[^/]*$/, `/${databaseName}`)}" | gzip > "${filepath}"`;
      
      await execAsync(`bash -lc '${dumpCommand.replace(/'/g, `'\\''`)}'`, { timeout: 300000 });

      // Obtener tamaño del archivo
      const stats = fs.statSync(filepath);
      if (stats.size < 64) {
        fs.unlinkSync(filepath);
        return { success: false, error: 'El backup generado es inválido o está vacío' };
      }
      const sizeMB = Math.round(stats.size / 1024 / 1024 * 100) / 100;

      console.log(`[Backup] ✅ Backup creado: ${filename} (${sizeMB} MB)`);

      return {
        success: true,
        filename,
        size: stats.size,
      };
    } catch (error: any) {
      console.error(`[Backup] ❌ Error creando backup:`, error);
      return {
        success: false,
        error: error.message || 'Error desconocido',
      };
    }
  }

  /**
   * Lista todos los backups disponibles para un tenant
   */
  async listBackups(databaseName: string): Promise<
    Array<{
      filename: string;
      size: number;
      createdAt: Date;
    }>
  > {
    try {
      const files = fs.readdirSync(this.backupDir);
      const backups = files
        .filter((f) => f.startsWith(databaseName))
        .map((filename) => {
          const filepath = path.join(this.backupDir, filename);
          const stats = fs.statSync(filepath);
          return {
            filename,
            size: stats.size,
            createdAt: stats.mtime,
          };
        })
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      return backups;
    } catch (error) {
      console.error('[Backup] Error listando backups:', error);
      return [];
    }
  }

  /**
   * Restaura un backup a una base de datos
     * ⚠️ ADVERTENCIA: Esto sobrescribirá los datos actuales
   */
  async restoreBackup(
    filename: string,
    targetDatabaseName: string
  ): Promise<{ success: boolean; error?: string }> {
    const filepath = path.join(this.backupDir, filename);

    try {
      if (!fs.existsSync(filepath)) {
        return {
          success: false,
          error: 'Archivo de backup no encontrado',
        };
      }

      console.log(`[Backup] Iniciando restauración de ${filename} a ${targetDatabaseName}...`);

      const baseDatabaseUrl = process.env.DATABASE_URL || '';
      if (!baseDatabaseUrl) {
        return { success: false, error: 'DATABASE_URL no configurada' };
      }

      const psqlCommand = this.resolveCommand('psql');
      const psqlAvailable = await this.commandExists(psqlCommand);
      if (!psqlAvailable) {
        return { success: false, error: 'psql no está instalado en este entorno' };
      }

      // Restaurar usando gunzip y psql
      const restoreCommand = `set -o pipefail; gunzip -c "${filepath}" | "${psqlCommand}" "${baseDatabaseUrl.replace(/\/[^/]*$/, `/${targetDatabaseName}`)}"`;

      await execAsync(`bash -lc '${restoreCommand.replace(/'/g, `'\\''`)}'`, { timeout: 300000 });

      console.log(`[Backup] ✅ Restauración completada`);

      return { success: true };
    } catch (error: any) {
      console.error(`[Backup] ❌ Error restaurando backup:`, error);
      return {
        success: false,
        error: error.message || 'Error desconocido',
      };
    }
  }

  /**
   * Elimina un backup
   */
  async deleteBackup(filename: string): Promise<{ success: boolean; error?: string }> {
    const filepath = path.join(this.backupDir, filename);

    try {
      if (!fs.existsSync(filepath)) {
        return {
          success: false,
          error: 'Archivo no encontrado',
        };
      }

      fs.unlinkSync(filepath);
      console.log(`[Backup] 🗑️ Backup eliminado: ${filename}`);

      return { success: true };
    } catch (error: any) {
      console.error(`[Backup] ❌ Error eliminando backup:`, error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Crea backups de todos los tenants activos
   * Útil para backups automáticos diarios
   */
  async backupAllTenants(
    masterPrisma: PrismaClient
  ): Promise<{
    total: number;
    success: number;
    failed: number;
    details: Array<{ tenantId: string; databaseName: string; success: boolean; error?: string }>;
  }> {
    const tenants = await masterPrisma.tenant.findMany({
      where: { status: 'ACTIVE' },
    });

    const result = {
      total: tenants.length,
      success: 0,
      failed: 0,
      details: [] as Array<{ tenantId: string; databaseName: string; success: boolean; error?: string }>,
    };

    for (const tenant of tenants) {
      const backup = await this.createBackup(tenant.databaseName, tenant.id);

      if (backup.success) {
        result.success++;
      } else {
        result.failed++;
      }

      result.details.push({
        tenantId: tenant.id,
        databaseName: tenant.databaseName,
        success: backup.success,
        error: backup.error,
      });
    }

    console.log(`[Backup] Resumen: ${result.success}/${result.total} backups exitosos`);
    return result;
  }

  /**
   * Limpia backups antiguos (mantiene solo los últimos N días)
   */
  async cleanupOldBackups(daysToKeep: number = 7): Promise<{
    deleted: number;
    errors: number;
  }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    let deleted = 0;
    let errors = 0;

    try {
      const files = fs.readdirSync(this.backupDir);

      for (const filename of files) {
        const filepath = path.join(this.backupDir, filename);
        const stats = fs.statSync(filepath);

        if (stats.mtime < cutoffDate) {
          try {
            fs.unlinkSync(filepath);
            deleted++;
            console.log(`[Backup] 🗑️ Backup antiguo eliminado: ${filename}`);
          } catch (error) {
            errors++;
            console.error(`[Backup] ❌ Error eliminando ${filename}:`, error);
          }
        }
      }

      return { deleted, errors };
    } catch (error) {
      console.error('[Backup] Error limpiando backups antiguos:', error);
      return { deleted, errors };
    }
  }

  private async commandExists(command: string): Promise<boolean> {
    try {
      await execAsync(`test -x "${command}" || command -v "${command}"`);
      return true;
    } catch {
      return false;
    }
  }

  private resolveCommand(binaryName: string): string {
    if (this.postgresBinDir) {
      return path.join(this.postgresBinDir, binaryName);
    }
    return binaryName;
  }

  private detectPostgresBinDir(): string | null {
    const candidates = [
      '/Library/PostgreSQL/18/bin',
      '/Library/PostgreSQL/17/bin',
      '/Library/PostgreSQL/16/bin',
      '/Applications/Postgres.app/Contents/Versions/latest/bin',
    ];

    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    }

    return null;
  }
}

export default BackupService;
