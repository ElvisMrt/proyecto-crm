import { Request, Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.middleware';
import { getTenantPrisma } from '../middleware/tenant.middleware';
import { sendNewAppointmentNotification, sendClientConfirmation } from '../services/email.service';

// Schemas de validación
const createAppointmentSchema = z.object({
  clientName: z.string().min(2, 'El nombre es requerido'),
  clientEmail: z.string().email('Email inválido').optional().or(z.literal('')),
  clientPhone: z.string().min(5, 'El teléfono es requerido'),
  appointmentDate: z.string().or(z.date()),
  duration: z.union([z.string(), z.number()]).transform(val => typeof val === 'string' ? parseInt(val, 10) : val).default(60),
  notes: z.string().optional().or(z.literal('')),
  branchId: z.string().optional().or(z.literal('')),
  userId: z.string().optional(),
  source: z.string().default('MANUAL'),
});

const updateAppointmentSchema = z.object({
  clientName: z.string().min(2).optional(),
  clientEmail: z.string().email().optional(),
  clientPhone: z.string().min(5).optional(),
  appointmentDate: z.string().or(z.date()).optional(),
  duration: z.number().optional(),
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED']).optional(),
  notes: z.string().optional(),
  branchId: z.string().optional(),
  userId: z.string().optional(),
});

// GET /appointments - Listar citas
export const getAppointments = async (req: AuthRequest, res: Response) => {
  try {
    const prisma = req.tenantPrisma || getTenantPrisma(process.env.DATABASE_URL!);
    const { startDate, endDate, status, branchId } = req.query;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (branchId) {
      where.branchId = branchId;
    }

    if (startDate || endDate) {
      where.appointmentDate = {};
      if (startDate) {
        const rawStartDate = startDate as string;
        where.appointmentDate.gte = /^\d{4}-\d{2}-\d{2}$/.test(rawStartDate)
          ? new Date(`${rawStartDate}T00:00:00`)
          : new Date(rawStartDate);
      }
      if (endDate) {
        const rawEndDate = endDate as string;
        const parsedEndDate = /^\d{4}-\d{2}-\d{2}$/.test(rawEndDate)
          ? new Date(`${rawEndDate}T23:59:59.999`)
          : new Date(rawEndDate);
        const normalizedEndDate = new Date(parsedEndDate);

        // Si el cliente envía solo la fecha o una fecha en medianoche, incluir el día completo.
        if (
          !/^\d{4}-\d{2}-\d{2}$/.test(rawEndDate) &&
          normalizedEndDate.getHours() === 0 &&
          normalizedEndDate.getMinutes() === 0 &&
          normalizedEndDate.getSeconds() === 0 &&
          normalizedEndDate.getMilliseconds() === 0
        ) {
          normalizedEndDate.setHours(23, 59, 59, 999);
        }

        where.appointmentDate.lte = normalizedEndDate;
      }
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { appointmentDate: 'asc' },
    });

    res.json({
      data: appointments,
    });
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error al obtener citas',
      },
    });
  }
};

// GET /appointments/:id - Obtener una cita
export const getAppointment = async (req: AuthRequest, res: Response) => {
  try {
    const prisma = req.tenantPrisma || getTenantPrisma(process.env.DATABASE_URL!);
    const { id } = req.params;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!appointment) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Cita no encontrada',
        },
      });
    }

    res.json(appointment);
  } catch (error) {
    console.error('Get appointment error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error al obtener la cita',
      },
    });
  }
};

// POST /appointments - Crear cita (desde el CRM)
export const createAppointment = async (req: AuthRequest, res: Response) => {
  try {
    const prisma = req.tenantPrisma || getTenantPrisma(process.env.DATABASE_URL!);
    const data = createAppointmentSchema.parse(req.body);

    const appointment = await prisma.appointment.create({
      data: {
        clientName: data.clientName,
        clientEmail: data.clientEmail,
        clientPhone: data.clientPhone,
        appointmentDate: new Date(data.appointmentDate),
        duration: data.duration,
        notes: data.notes,
        branchId: data.branchId || undefined,
        userId: data.userId || undefined,
        source: data.source || 'MANUAL',
        status: 'PENDING',
      },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.status(201).json({
      message: 'Cita creada exitosamente',
      data: appointment,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Datos inválidos',
          details: error.errors,
        },
      });
    }
    console.error('Create appointment error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error al crear la cita',
        debug: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
    });
  }
};

// POST /appointments/public - Crear cita desde formulario público (sin auth)
export const createPublicAppointment = async (req: Request, res: Response) => {
  try {
    const prisma = (req as any).tenantPrisma || getTenantPrisma(process.env.DATABASE_URL!);
    const data = createAppointmentSchema.parse(req.body);

    // Verificar que la sucursal existe y está activa
    if (data.branchId) {
      const branch = await prisma.branch.findUnique({
        where: { id: data.branchId, isActive: true },
      });

      if (!branch) {
        return res.status(400).json({
          error: {
            code: 'INVALID_BRANCH',
            message: 'La sucursal seleccionada no existe o no está activa',
          },
        });
      }
    }

    const appointment = await prisma.appointment.create({
      data: {
        clientName: data.clientName,
        clientEmail: data.clientEmail,
        clientPhone: data.clientPhone,
        appointmentDate: new Date(data.appointmentDate),
        duration: data.duration,
        notes: data.notes,
        branchId: data.branchId || undefined,
        status: 'PENDING',
        source: 'WEB_FORM',
        isViewed: false,
        isNotified: false,
      },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const hasEmailConfig = Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);

    if (hasEmailConfig) {
      // Enviar notificación interna
      try {
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@empresa.com';
        
        await sendNewAppointmentNotification({
          to: adminEmail,
          appointment: {
            clientName: appointment.clientName,
            clientEmail: appointment.clientEmail,
            clientPhone: appointment.clientPhone,
            appointmentDate: appointment.appointmentDate,
            notes: appointment.notes,
            branchName: appointment.branch?.name || null
          }
        });
      } catch (emailError) {
        console.error('Error sending notification:', emailError);
      }

      // Enviar confirmación al cliente si tiene email
      if (appointment.clientEmail) {
        try {
          await sendClientConfirmation({
            to: appointment.clientEmail,
            appointment: {
              clientName: appointment.clientName,
              appointmentDate: appointment.appointmentDate,
              branchName: appointment.branch?.name || null,
            },
          });
        } catch (emailError) {
          console.error('Error sending client confirmation:', emailError);
        }
      }
    } else {
      console.warn('SMTP no configurado; se omiten emails de cita pública');
    }

    res.status(201).json({
      message: 'Cita solicitada exitosamente',
      data: {
        id: appointment.id,
        clientName: appointment.clientName,
        appointmentDate: appointment.appointmentDate,
        status: appointment.status,
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Datos inválidos',
          details: error.errors,
        },
      });
    }
    console.error('Create public appointment error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error al crear la cita',
        debug: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
    });
  }
};

// PUT /appointments/:id - Actualizar cita
export const updateAppointment = async (req: AuthRequest, res: Response) => {
  try {
    const prisma = req.tenantPrisma || getTenantPrisma(process.env.DATABASE_URL!);
    const { id } = req.params;
    const data = updateAppointmentSchema.parse(req.body);

    const updateData: any = {};
    if (data.clientName) updateData.clientName = data.clientName;
    if (data.clientEmail !== undefined) updateData.clientEmail = data.clientEmail;
    if (data.clientPhone) updateData.clientPhone = data.clientPhone;
    if (data.appointmentDate) updateData.appointmentDate = new Date(data.appointmentDate);
    if (data.duration) updateData.duration = data.duration;
    if (data.status) updateData.status = data.status;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.branchId !== undefined) updateData.branchId = data.branchId || null;
    if (data.userId !== undefined) updateData.userId = data.userId || null;

    const appointment = await prisma.appointment.update({
      where: { id },
      data: updateData,
      include: {
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.json({
      message: 'Cita actualizada exitosamente',
      data: appointment,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Datos inválidos',
          details: error.errors,
        },
      });
    }
    if (error.code === 'P2025') {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Cita no encontrada',
        },
      });
    }
    console.error('Update appointment error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error al actualizar la cita',
      },
    });
  }
};

// DELETE /appointments/:id - Eliminar cita
export const deleteAppointment = async (req: AuthRequest, res: Response) => {
  try {
    const prisma = req.tenantPrisma || getTenantPrisma(process.env.DATABASE_URL!);
    const { id } = req.params;

    await prisma.appointment.delete({
      where: { id },
    });

    res.json({
      message: 'Cita eliminada exitosamente',
    });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Cita no encontrada',
        },
      });
    }
    console.error('Delete appointment error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error al eliminar la cita',
      },
    });
  }
};

// GET /appointments/notifications/unread - Obtener citas no vistas (badge de notificaciones)
export const getUnreadAppointments = async (req: AuthRequest, res: Response) => {
  try {
    const prisma = req.tenantPrisma || getTenantPrisma(process.env.DATABASE_URL!);
    const appointments = await prisma.appointment.findMany({
      where: {
        isViewed: false,
        source: 'WEB_FORM', // Solo citas del formulario público
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.json({
      count: appointments.length,
      data: appointments,
    });
  } catch (error) {
    console.error('Get unread appointments error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error al obtener notificaciones',
      },
    });
  }
};

// PUT /appointments/:id/view - Marcar cita como vista (por admin)
export const markAppointmentAsViewed = async (req: AuthRequest, res: Response) => {
  try {
    const prisma = req.tenantPrisma || getTenantPrisma(process.env.DATABASE_URL!);
    const { id } = req.params;

    const appointment = await prisma.appointment.update({
      where: { id },
      data: {
        isViewed: true,
        viewedAt: new Date(),
      },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.json({
      message: 'Cita marcada como vista',
      data: appointment,
    });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Cita no encontrada',
        },
      });
    }
    console.error('Mark appointment as viewed error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error al marcar la cita',
      },
    });
  }
};

// PUT /appointments/:id/notify - Marcar cita como notificada (email enviado)
export const markAppointmentAsNotified = async (req: AuthRequest, res: Response) => {
  try {
    const prisma = req.tenantPrisma || getTenantPrisma(process.env.DATABASE_URL!);
    const { id } = req.params;

    const appointment = await prisma.appointment.update({
      where: { id },
      data: {
        isNotified: true,
        notifiedAt: new Date(),
      },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.json({
      message: 'Cita marcada como notificada',
      data: appointment,
    });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Cita no encontrada',
        },
      });
    }
    console.error('Mark appointment as notified error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error al marcar la cita',
      },
    });
  }
};

// GET /appointments/embed/config - Configuración para formulario embeddable
export const getEmbedConfig = async (req: Request, res: Response) => {
  try {
    const prisma = (req as any).tenantPrisma || getTenantPrisma(process.env.DATABASE_URL!);
    // Obtener sucursales activas para el formulario
    const branches = await prisma.branch.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        address: true,
      },
    });

    res.json({
      branches,
      apiUrl: process.env.API_URL || 'http://localhost:3001/api/v1',
    });
  } catch (error) {
    console.error('Get embed config error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error al obtener configuración',
      },
    });
  }
};
