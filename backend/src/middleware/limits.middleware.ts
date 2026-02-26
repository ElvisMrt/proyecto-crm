import { Request, Response, NextFunction } from 'express';
import { TenantRequest } from './tenant.middleware';

/**
 * Middleware para verificar límites del tenant antes de crear recursos
 * @param resourceType - Tipo de recurso a verificar ('users', 'products', 'branches')
 */
export function checkTenantLimit(resourceType: 'users' | 'products' | 'branches') {
  return async (req: TenantRequest, res: Response, next: NextFunction) => {
    try {
      // Si no hay tenant (rutas de SaaS admin), permitir
      if (!req.tenant || !req.tenantPrisma) {
        return next();
      }

      const limits = req.tenant.limits || {};
      const prisma = req.tenantPrisma;

      switch (resourceType) {
        case 'users': {
          const maxUsers = limits.maxUsers || 5; // default BASIC
          const currentUsers = await prisma.user.count();
          
          if (currentUsers >= maxUsers) {
            return res.status(403).json({
              error: {
                code: 'LIMIT_EXCEEDED',
                message: `Límite de usuarios alcanzado (${maxUsers}). Actualiza tu plan para agregar más usuarios.`,
                current: currentUsers,
                limit: maxUsers,
              },
            });
          }
          break;
        }

        case 'products': {
          // Los productos no tienen límite estricto pero podemos monitorear storage
          const maxStorage = limits.maxStorage || '1GB';
          // Por ahora solo loggear uso
          const currentProducts = await prisma.product.count();
          console.log(`[Limits] Tenant ${req.tenant.slug}: ${currentProducts} productos, storage limit: ${maxStorage}`);
          break;
        }

        case 'branches': {
          const maxBranches = limits.maxBranches || 1;
          const currentBranches = await prisma.branch.count();
          
          if (currentBranches >= maxBranches) {
            return res.status(403).json({
              error: {
                code: 'LIMIT_EXCEEDED',
                message: `Límite de sucursales alcanzado (${maxBranches}). Actualiza tu plan para agregar más sucursales.`,
                current: currentBranches,
                limit: maxBranches,
              },
            });
          }
          break;
        }
      }

      next();
    } catch (error) {
      console.error('[Limits Middleware] Error:', error);
      return res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Error al verificar límites del tenant',
        },
      });
    }
  };
}

/**
 * Middleware para verificar si el tenant está activo y no suspendido
 */
export async function checkTenantStatus(req: TenantRequest, res: Response, next: NextFunction) {
  try {
    // Si no hay tenant (rutas de SaaS admin), permitir
    if (!req.tenant) {
      return next();
    }

    if (req.tenant.status === 'SUSPENDED') {
      return res.status(403).json({
        error: {
          code: 'TENANT_SUSPENDED',
          message: 'Tu cuenta está suspendida. Contacta soporte para reactivarla.',
        },
      });
    }

    next();
  } catch (error) {
    console.error('[Tenant Status] Error:', error);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error al verificar estado del tenant',
      },
    });
  }
}
