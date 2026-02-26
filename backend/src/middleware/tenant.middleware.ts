import { PrismaClient } from '@prisma/client';
import { Request, Response, NextFunction } from 'express';

// Cache de conexiones Prisma por tenant (limpiado para forzar recreación)
const tenantPrismaClients: { [key: string]: PrismaClient } = {};

// Prisma Client para DB Master (gestión de tenants)
export const masterPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.MASTER_DATABASE_URL || process.env.DATABASE_URL,
    },
  },
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : undefined,
});

// Obtener o crear Prisma Client para un tenant específico
export function getTenantPrisma(databaseUrl: string): PrismaClient {
  console.log('📦 getTenantPrisma called with:', databaseUrl);
  console.log('📦 Cache keys:', Object.keys(tenantPrismaClients));
  
  if (!tenantPrismaClients[databaseUrl]) {
    console.log('✨ Creating NEW client for:', databaseUrl);
    tenantPrismaClients[databaseUrl] = new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : undefined,
    });
  } else {
    console.log('♻️ Reusing cached client for:', databaseUrl);
  }
  return tenantPrismaClients[databaseUrl];
}

// Interfaces extendidas
export interface TenantRequest extends Request {
  tenant?: {
    id: string;
    slug: string;
    name: string;
    subdomain: string;
    customDomain?: string | null;
    databaseUrl: string;
    status: string;
    plan: string;
    settings: any;
    limits: any;
  };
  tenantPrisma?: PrismaClient;
  isSaaSAdmin?: boolean;
  saasUser?: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

// Middleware para identificar tenant por subdominio
export async function tenantMiddleware(req: TenantRequest, res: Response, next: NextFunction) {
  try {
    // Skip para rutas de SaaS Admin
    if (req.path.startsWith('/saas') || req.path.startsWith('/admin')) {
      return next();
    }

    // Obtener subdominio del header o del host
    const host = req.headers.host || '';
    const subdomain = req.headers['x-tenant-subdomain'] as string || 
                      host.split('.')[0] || 
                      'demo'; // default

    console.log('🔍 Tenant Detection:', {
      host,
      subdomain,
      header: req.headers['x-tenant-subdomain'],
      path: req.path,
    });

    // Buscar tenant en DB Master
    const tenant = await masterPrisma.tenant.findFirst({
      where: {
        OR: [
          { subdomain: subdomain },
          { customDomain: host },
        ],
        status: 'ACTIVE',
      },
    });

    if (!tenant) {
      console.log('❌ Tenant NOT FOUND:', { subdomain, host });
      return res.status(404).json({
        error: {
          code: 'TENANT_NOT_FOUND',
          message: 'Tenant no encontrado o inactivo',
        },
      });
    }

    console.log('✅ Tenant FOUND:', { id: tenant.id, name: tenant.name, subdomain: tenant.subdomain });

    // Verificar trial no expirado
    if (tenant.trialEndsAt && new Date() > tenant.trialEndsAt) {
      return res.status(403).json({
        error: {
          code: 'TRIAL_EXPIRED',
          message: 'Período de prueba expirado',
        },
      });
    }

    // Guardar tenant en request
    req.tenant = {
      id: tenant.id,
      slug: tenant.slug,
      name: tenant.name,
      subdomain: tenant.subdomain,
      customDomain: tenant.customDomain,
      databaseUrl: tenant.databaseUrl,
      status: tenant.status,
      plan: tenant.plan,
      settings: typeof tenant.settings === 'string' ? JSON.parse(tenant.settings) : (tenant.settings || {}),
      limits: typeof tenant.limits === 'string' ? JSON.parse(tenant.limits) : (tenant.limits || {}),
    };

    // Crear Prisma Client para este tenant
    console.log('🔗 Tenant databaseUrl:', tenant.databaseUrl);
    console.log('🔗 Creating Prisma client...');
    req.tenantPrisma = getTenantPrisma(tenant.databaseUrl);
    console.log('✅ Tenant Prisma created');

    // Actualizar lastActiveAt
    await masterPrisma.tenant.update({
      where: { id: tenant.id },
      data: { lastActiveAt: new Date() },
    });

    next();
  } catch (error) {
    console.error('Tenant middleware error:', error);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error al identificar tenant',
      },
    });
  }
}

// Middleware para verificar si es SaaS Admin
export async function saasAdminMiddleware(req: TenantRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Token de autenticación requerido',
        },
      });
    }

    const token = authHeader.split(' ')[1];
    
    // Verificar token JWT
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';
    
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        error: {
          code: 'INVALID_TOKEN',
          message: 'Token inválido o expirado',
        },
      });
    }
    
    // Buscar usuario en Master DB
    const user = await masterPrisma.masterUser.findUnique({
      where: {
        id: decoded.userId,
      },
    });

    if (!user || user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'Acceso denegado. Se requiere ser Super Admin',
        },
      });
    }

    req.isSaaSAdmin = true;
    req.saasUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    next();
  } catch (error) {
    console.error('SaaS Admin middleware error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error en autenticación SaaS',
      },
    });
  }
}

// Helper para crear nueva DB de tenant
export async function createTenantDatabase(databaseName: string): Promise<string> {
  // Generar URL para la nueva base de datos
  const baseUrl = process.env.DATABASE_URL || '';
  const tenantDbUrl = baseUrl.replace(/\/[^/]*$/, `/${databaseName}`);
  
  // Aquí implementarías la lógica para:
  // 1. Crear la base de datos física
  // 2. Aplicar el schema del CRM
  // 3. Crear tablas iniciales
  
  // Por ahora retornamos la URL
  return tenantDbUrl;
}
