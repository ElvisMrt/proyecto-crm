import { Request, Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.middleware';
import { getTenantPrisma } from '../middleware/tenant.middleware';


// Schema para crear secuencia NCF
const createNcfSequenceSchema = z.object({
  prefix: z.string().min(1).max(10), // FACE, NCE, etc.
  description: z.string().optional(),
  startRange: z.number().int().positive(),
  endRange: z.number().int().positive(),
  branchId: z.string().uuid().optional(),
  validFrom: z.string().datetime().optional(),
  validUntil: z.string().datetime().optional(),
});

// Schema para actualizar secuencia NCF
const updateNcfSequenceSchema = z.object({
  description: z.string().optional(),
  startRange: z.number().int().positive().optional(),
  endRange: z.number().int().positive().optional(),
  currentNumber: z.number().int().nonnegative().optional(),
  isActive: z.boolean().optional(),
  validFrom: z.string().datetime().optional(),
  validUntil: z.string().datetime().optional(),
  branchId: z.string().uuid().optional().nullable(),
});

// Obtener todas las secuencias NCF
export const getNcfSequences = async (req: AuthRequest, res: Response) => {
  try {
    const prisma = req.tenantPrisma || getTenantPrisma(process.env.DATABASE_URL!);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (req.query.prefix) {
      where.prefix = req.query.prefix;
    }

    if (req.query.isActive !== undefined) {
      where.isActive = req.query.isActive === 'true';
    }

    if (req.query.branchId) {
      where.branchId = req.query.branchId;
    }

    const [sequences, total] = await Promise.all([
      prisma.ncfSequence.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          branch: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.ncfSequence.count({ where }),
    ]);

    res.json({
      data: sequences.map((seq) => ({
        id: seq.id,
        prefix: seq.prefix,
        description: seq.description,
        startRange: seq.startRange,
        endRange: seq.endRange,
        currentNumber: seq.currentNumber,
        isActive: seq.isActive,
        validFrom: seq.validFrom,
        validUntil: seq.validUntil,
        branch: seq.branch,
        remaining: seq.endRange - seq.currentNumber,
        percentageUsed: Math.round((seq.currentNumber / seq.endRange) * 100),
        createdAt: seq.createdAt,
        updatedAt: seq.updatedAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get NCF sequences error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error fetching NCF sequences',
      },
    });
  }
};

// Obtener una secuencia NCF por ID
export const getNcfSequence = async (req: AuthRequest, res: Response) => {
  try {
    const prisma = req.tenantPrisma || getTenantPrisma(process.env.DATABASE_URL!);
    const { id } = req.params;

    const sequence = await prisma.ncfSequence.findUnique({
      where: { id },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!sequence) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'NCF sequence not found',
        },
      });
    }

    res.json({
      ...sequence,
      remaining: sequence.endRange - sequence.currentNumber,
      percentageUsed: Math.round((sequence.currentNumber / sequence.endRange) * 100),
    });
  } catch (error) {
    console.error('Get NCF sequence error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error fetching NCF sequence',
      },
    });
  }
};

// Crear nueva secuencia NCF
export const createNcfSequence = async (req: AuthRequest, res: Response) => {
  try {
    const prisma = req.tenantPrisma || getTenantPrisma(process.env.DATABASE_URL!);
    if (!req.user) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Not authenticated',
        },
      });
    }

    const data = createNcfSequenceSchema.parse(req.body);

    // Validar que startRange < endRange
    if (data.startRange >= data.endRange) {
      return res.status(400).json({
        error: {
          code: 'INVALID_RANGE',
          message: 'startRange must be less than endRange',
        },
      });
    }

    // Verificar que no haya solapamiento con otras secuencias activas del mismo prefijo
    const existingSequence = await prisma.ncfSequence.findFirst({
      where: {
        prefix: data.prefix,
        isActive: true,
        branchId: data.branchId || null,
        OR: [
          {
            AND: [
              { startRange: { lte: data.startRange } },
              { endRange: { gte: data.startRange } },
            ],
          },
          {
            AND: [
              { startRange: { lte: data.endRange } },
              { endRange: { gte: data.endRange } },
            ],
          },
          {
            AND: [
              { startRange: { gte: data.startRange } },
              { endRange: { lte: data.endRange } },
            ],
          },
        ],
      },
    });

    if (existingSequence) {
      return res.status(400).json({
        error: {
          code: 'OVERLAPPING_RANGE',
          message: 'This range overlaps with an existing active sequence',
        },
      });
    }

    const sequence = await prisma.ncfSequence.create({
      data: {
        prefix: data.prefix,
        description: data.description,
        startRange: data.startRange,
        endRange: data.endRange,
        currentNumber: data.startRange - 1, // Iniciar en startRange - 1 para que el primer número sea startRange
        branchId: data.branchId || null,
        validFrom: data.validFrom ? new Date(data.validFrom) : new Date(),
        validUntil: data.validUntil ? new Date(data.validUntil) : null,
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

    res.status(201).json({
      ...sequence,
      remaining: sequence.endRange - sequence.currentNumber,
      percentageUsed: Math.round((sequence.currentNumber / sequence.endRange) * 100),
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input',
          details: error.errors,
        },
      });
    }

    console.error('Create NCF sequence error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error creating NCF sequence',
      },
    });
  }
};

// Actualizar secuencia NCF
export const updateNcfSequence = async (req: AuthRequest, res: Response) => {
  try {
    const prisma = req.tenantPrisma || getTenantPrisma(process.env.DATABASE_URL!);
    if (!req.user) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Not authenticated',
        },
      });
    }

    const { id } = req.params;
    const data = updateNcfSequenceSchema.parse(req.body);

    // Verificar que la secuencia existe
    const existingSequence = await prisma.ncfSequence.findUnique({
      where: { id },
    });

    if (!existingSequence) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'NCF sequence not found',
        },
      });
    }

    // Validar rangos si se están actualizando
    if (data.startRange !== undefined || data.endRange !== undefined) {
      const startRange = data.startRange ?? existingSequence.startRange;
      const endRange = data.endRange ?? existingSequence.endRange;

      if (startRange >= endRange) {
        return res.status(400).json({
          error: {
            code: 'INVALID_RANGE',
            message: 'startRange must be less than endRange',
          },
        });
      }

      if (data.currentNumber !== undefined && data.currentNumber > endRange) {
        return res.status(400).json({
          error: {
            code: 'INVALID_CURRENT_NUMBER',
            message: 'currentNumber cannot exceed endRange',
          },
        });
      }
    }

    const sequence = await prisma.ncfSequence.update({
      where: { id },
      data: {
        description: data.description,
        startRange: data.startRange,
        endRange: data.endRange,
        currentNumber: data.currentNumber,
        isActive: data.isActive,
        validFrom: data.validFrom ? new Date(data.validFrom) : undefined,
        validUntil: data.validUntil ? new Date(data.validUntil) : undefined,
        branchId: data.branchId,
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
      ...sequence,
      remaining: sequence.endRange - sequence.currentNumber,
      percentageUsed: Math.round((sequence.currentNumber / sequence.endRange) * 100),
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input',
          details: error.errors,
        },
      });
    }

    console.error('Update NCF sequence error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error updating NCF sequence',
      },
    });
  }
};

// Eliminar secuencia NCF (soft delete - desactivar)
export const deleteNcfSequence = async (req: AuthRequest, res: Response) => {
  try {
    const prisma = req.tenantPrisma || getTenantPrisma(process.env.DATABASE_URL!);
    if (!req.user) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Not authenticated',
        },
      });
    }

    const { id } = req.params;

    const sequence = await prisma.ncfSequence.update({
      where: { id },
      data: {
        isActive: false,
      },
    });

    res.json({
      message: 'NCF sequence deactivated successfully',
      id: sequence.id,
    });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'NCF sequence not found',
        },
      });
    }

    console.error('Delete NCF sequence error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error deleting NCF sequence',
      },
    });
  }
};

// Función auxiliar: Obtener el siguiente NCF disponible
export const getNextNcf = async (
  prisma: any,
  prefix: string,
  branchId?: string | null | undefined
): Promise<string | null> => {
  try {
    const now = new Date();

    // Buscar secuencia activa para el prefijo y branch
    const sequence = await prisma.ncfSequence.findFirst({
      where: {
        prefix,
        isActive: true,
        branchId: branchId || null,
        validFrom: { lte: now },
        OR: [
          { validUntil: null },
          { validUntil: { gte: now } },
        ],
        currentNumber: { lt: prisma.ncfSequence.fields.endRange },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!sequence) {
      return null; // No hay secuencia disponible
    }

    // Verificar si hay números disponibles
    if (sequence.currentNumber >= sequence.endRange) {
      return null; // Secuencia agotada
    }

    // Incrementar y obtener el siguiente número
    const nextNumber = sequence.currentNumber + 1;
    const ncf = `${sequence.prefix}-${String(nextNumber).padStart(8, '0')}`;

    // Actualizar currentNumber en la secuencia
    await prisma.ncfSequence.update({
      where: { id: sequence.id },
      data: {
        currentNumber: nextNumber,
      },
    });

    return ncf;
  } catch (error) {
    console.error('Get next NCF error:', error);
    return null;
  }
};

// Obtener estadísticas de NCF
export const getNcfStats = async (req: AuthRequest, res: Response) => {
  try {
    const prisma = req.tenantPrisma || getTenantPrisma(process.env.DATABASE_URL!);
    const now = new Date();

    // Secuencias activas
    const activeSequences = await prisma.ncfSequence.findMany({
      where: {
        isActive: true,
        validFrom: { lte: now },
        OR: [
          { validUntil: null },
          { validUntil: { gte: now } },
        ],
      },
    });

    // Calcular estadísticas
    const stats = {
      totalSequences: activeSequences.length,
      sequencesByPrefix: {} as Record<string, number>,
      lowStockSequences: [] as any[],
      expiredSequences: [] as any[],
    };

    activeSequences.forEach((seq: any) => {
      // Contar por prefijo
      stats.sequencesByPrefix[seq.prefix] = (stats.sequencesByPrefix[seq.prefix] || 0) + 1;

      // Secuencias con menos del 10% disponibles
      const remaining = seq.endRange - seq.currentNumber;
      const percentageRemaining = (remaining / (seq.endRange - seq.startRange + 1)) * 100;

      if (percentageRemaining <= 10 && remaining > 0) {
        stats.lowStockSequences.push({
          id: seq.id,
          prefix: seq.prefix,
          description: seq.description,
          remaining,
          percentageRemaining: Math.round(percentageRemaining),
          endRange: seq.endRange,
          currentNumber: seq.currentNumber,
        });
      }

      // Secuencias vencidas o próximas a vencer (30 días)
      if (seq.validUntil) {
        const daysUntilExpiry = Math.floor(
          (seq.validUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysUntilExpiry <= 30) {
          stats.expiredSequences.push({
            id: seq.id,
            prefix: seq.prefix,
            description: seq.description,
            validUntil: seq.validUntil,
            daysUntilExpiry,
          });
        }
      }
    });

    res.json(stats);
  } catch (error) {
    console.error('Get NCF stats error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error fetching NCF statistics',
      },
    });
  }
};


