import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../middleware/auth.middleware';
import { getTenantPrisma, TenantRequest } from '../middleware/tenant.middleware';
import { z } from 'zod';

// Prisma default para rutas sin tenant (compatibilidad)
const defaultPrisma = new PrismaClient();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const login = async (req: TenantRequest, res: Response) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    // Usar el Prisma del tenant si está disponible, sino el default
    const prisma = req.tenantPrisma || defaultPrisma;

    // Find user - solo seleccionar campos necesarios (incluyendo password para verificación)
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }, // Normalizar email
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        branchId: true,
        password: true,
        isActive: true,
      }
    });

    // Validar que el usuario exista y esté activo primero
    if (!user || !user.isActive) {
      // Pequeño delay para prevenir timing attacks
      await new Promise(resolve => setTimeout(resolve, 100));
      return res.status(401).json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        }
      });
    }

    // Verificar password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      // Pequeño delay para prevenir timing attacks adicionales
      await new Promise(resolve => setTimeout(resolve, 100));
      return res.status(401).json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        }
      });
    }

    // Generate JWT
    const jwtSecret = process.env.JWT_SECRET || 'secret';
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        branchId: user.branchId,
      },
      jwtSecret as string,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Actualizar lastLogin en background (no bloquear respuesta)
    prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    }).catch((err: Error) => {
      console.error('Error updating lastLogin:', err);
      // No fallar el login si falla la actualización de lastLogin
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        branchId: user.branchId,
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input',
          details: error.errors
        }
      });
    }

    console.error('Login error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error during login'
      }
    });
  }
};

export const logout = async (req: AuthRequest, res: Response) => {
  // En un sistema con refresh tokens, aquí invalidaríamos el token
  // Por ahora, el cliente simplemente elimina el token
  res.json({
    message: 'Logged out successfully'
  });
};

export const me = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Not authenticated'
        }
      });
    }

    const prisma = req.tenantPrisma || defaultPrisma;

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        isActive: true,
        lastLogin: true,
      }
    });

    if (!user) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    res.json(user);
  } catch (error) {
    console.error('Me error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error fetching user data'
      }
    });
  }
};



