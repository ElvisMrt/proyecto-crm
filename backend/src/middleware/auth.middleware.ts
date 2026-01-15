import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    branchId?: string | null;
    tenantId?: string;
  };
  tenantId?: string;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'No token provided'
        }
      });
    }

    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not configured');
    }

    // Verificar token primero (más rápido que consultar BD)
    // Si el token es inválido, no necesitamos consultar la base de datos
    let decoded: any;
    try {
      decoded = jwt.verify(token, jwtSecret) as any;
    } catch (jwtError: any) {
      // Manejar errores de JWT antes de consultar la BD
      if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Invalid token'
          }
        });
      }

      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Token expired'
          }
        });
      }

      throw jwtError;
    }

    // Solo consultar BD si el token es válido
    // Optimización: solo seleccionar campos necesarios
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        branchId: true,
        isActive: true
      }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not found or inactive'
        }
      });
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      branchId: user.branchId,
    };

    // Extract tenant ID from header or token
    req.tenantId = req.headers['x-tenant-id'] as string || decoded.tenantId;

    next();
  } catch (error: any) {
    // Errores de JWT ya fueron manejados arriba
    // Este catch maneja otros errores inesperados
    console.error('Authentication middleware error:', error);
    next(error);
  }
};

export const requireRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions'
        }
      });
    }

    next();
  };
};



