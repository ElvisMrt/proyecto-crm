import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import { AuthRequest } from '../middleware/auth.middleware';
import { getTenantPrisma, TenantRequest } from '../middleware/tenant.middleware';
import { z } from 'zod';
import { sendPasswordResetEmail } from '../services/email.service';

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
      { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') } as SignOptions
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

// POST /auth/forgot-password
export const forgotPassword = async (req: TenantRequest, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Email requerido' } });
    }

    const prisma = req.tenantPrisma;
    if (!prisma || !req.tenant) {
      return res.status(400).json({ error: { code: 'TENANT_REQUIRED', message: 'Tenant no identificado' } });
    }

    // Buscar usuario (respuesta genérica para no revelar si existe)
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: { id: true, email: true, name: true, isActive: true },
    });

    // Siempre responder OK para no revelar si el email existe
    if (!user || !user.isActive) {
      return res.json({ success: true, message: 'Si el email existe, recibirás instrucciones en breve.' });
    }

    // Generar token seguro (expira en 1 hora)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    // Guardar token en DB del tenant
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: resetTokenHash,
        resetPasswordExpires: expiresAt,
      } as any,
    });

    // Enviar email
    await sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      resetToken,
      tenantSlug: req.tenant.subdomain,
    });

    res.json({ success: true, message: 'Si el email existe, recibirás instrucciones en breve.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Error al procesar solicitud' } });
  }
};

// POST /auth/reset-password
export const resetPassword = async (req: TenantRequest, res: Response) => {
  try {
    const { token, password } = req.body;
    if (!token || !password || password.length < 6) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Token y contraseña (mínimo 6 caracteres) requeridos' }
      });
    }

    const prisma = req.tenantPrisma;
    if (!prisma) {
      return res.status(400).json({ error: { code: 'TENANT_REQUIRED', message: 'Tenant no identificado' } });
    }

    // Hash del token recibido para comparar con el almacenado
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Buscar usuario con ese token válido y no expirado
    const user = await (prisma as any).user.findFirst({
      where: {
        resetPasswordToken: tokenHash,
        resetPasswordExpires: { gt: new Date() },
        isActive: true,
      },
      select: { id: true, email: true },
    });

    if (!user) {
      return res.status(400).json({
        error: { code: 'INVALID_TOKEN', message: 'Token inválido o expirado' }
      });
    }

    // Actualizar contraseña y limpiar token
    const hashedPassword = await bcrypt.hash(password, 10);
    await (prisma as any).user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    res.json({ success: true, message: 'Contraseña actualizada exitosamente. Ya puedes iniciar sesión.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Error al restablecer contraseña' } });
  }
};



