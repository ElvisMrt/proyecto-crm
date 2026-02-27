import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { getTenantPrisma } from '../middleware/tenant.middleware';
import { z } from 'zod';

// Enums como tipos literales
const CashStatus = {
  OPEN: 'OPEN',
  CLOSED: 'CLOSED'
} as const;

const MovementType = {
  OPENING: 'OPENING',
  SALE: 'SALE',
  PAYMENT: 'PAYMENT',
  MANUAL_ENTRY: 'MANUAL_ENTRY',
  MANUAL_EXIT: 'MANUAL_EXIT',
  CLOSING: 'CLOSING'
} as const;

const PaymentMethod = {
  CASH: 'CASH',
  TRANSFER: 'TRANSFER',
  CARD: 'CARD',
  CREDIT: 'CREDIT',
  MIXED: 'MIXED'
} as const;


const openCashSchema = z.object({
  branchId: z.string().uuid(),
  initialAmount: z.number().nonnegative(),
  observations: z.string().optional(),
});

const closeCashSchema = z.object({
  finalAmount: z.number().nonnegative(),
  observations: z.string().optional(),
});

// Schema alternativo para cuando se envía desde frontend con countedAmount
const closeCashSchemaAlt = z.object({
  countedAmount: z.number().nonnegative(),
  observations: z.string().optional(),
});

const createMovementSchema = z.object({
  type: z.enum(['MANUAL_ENTRY', 'MANUAL_EXIT']),
  concept: z.string().min(1),
  amount: z.number().positive(),
  method: z.enum(['CASH', 'TRANSFER']),
  observations: z.string().optional(),
});

export const getCurrentCash = async (req: AuthRequest, res: Response) => {
  try {
    const prisma = req.tenantPrisma || getTenantPrisma(process.env.DATABASE_URL!);
    // Build where clause
    const where: any = { status: 'OPEN' };
    
    // Solo filtrar por sucursal si el usuario NO es admin y tiene sucursal asignada
    if (req.user?.branchId && req.user.role !== 'ADMINISTRATOR') {
      where.branchId = req.user.branchId;
    }

    const cashRegisters = await prisma.cashRegister.findMany({
      where,
      include: {
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
        openedByUser: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { openedAt: 'desc' },
    });

    if (!cashRegisters || cashRegisters.length === 0) {
      return res.json([]);
    }

    // Calculate current balance for each cash register
    const cashRegistersWithBalance = await Promise.all(
      cashRegisters.map(async (cashRegister: any) => {
        const movements = await prisma.cashMovement.findMany({
          where: { cashRegisterId: cashRegister.id },
        });

        const totalIncome = movements
          .filter((m: any) => m.type === 'SALE' || m.type === 'PAYMENT' || m.type === 'MANUAL_ENTRY')
          .reduce((sum: number, m: any) => sum + Number(m.amount), 0);

        const totalExpenses = movements
          .filter((m: any) => m.type === 'MANUAL_EXIT')
          .reduce((sum: number, m: any) => sum + Number(m.amount), 0);

        const currentBalance = Number(cashRegister.initialAmount) + totalIncome - totalExpenses;

        return {
          id: cashRegister.id,
          branch: cashRegister.branch,
          status: cashRegister.status,
          initialAmount: Number(cashRegister.initialAmount),
          currentBalance,
          openedAt: cashRegister.openedAt,
          openedBy: cashRegister.openedByUser,
          observations: cashRegister.observations,
        };
      })
    );

    res.json(cashRegistersWithBalance);
  } catch (error) {
    console.error('Get current cash error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error fetching current cash registers',
      },
    });
  }
};

export const openCash = async (req: AuthRequest, res: Response) => {
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

    const data = openCashSchema.parse(req.body);

    // Validar que el usuario tenga acceso a la sucursal seleccionada
    if (req.user?.branchId && req.user.branchId !== data.branchId) {
      // Si el usuario tiene una sucursal asignada, solo puede abrir caja en esa sucursal
      // A menos que sea ADMINISTRATOR
      if (req.user.role !== 'ADMINISTRATOR') {
        return res.status(403).json({
          error: {
            code: 'BRANCH_ACCESS_DENIED',
            message: 'No tiene permisos para abrir caja en esta sucursal. Su sucursal asignada es diferente.',
          },
        });
      }
    }

    // Check if there's already an open cash register for this branch
    // Only 1 open cash register per branch is allowed
    const existingCash = await prisma.cashRegister.findFirst({
      where: {
        branchId: data.branchId,
        status: 'OPEN',
      },
    });

    if (existingCash) {
      return res.status(400).json({
        error: {
          code: 'CASH_ALREADY_OPEN',
          message: 'Ya existe una caja abierta en esta sucursal. Debe cerrarla antes de abrir otra.',
        },
      });
    }

    const cashRegister = await prisma.cashRegister.create({
      data: {
        branchId: data.branchId,
        status: CashStatus.OPEN,
        initialAmount: data.initialAmount,
        openedBy: req.user.id,
        openedAt: new Date(),
        observations: data.observations,
      },
      include: {
        branch: true,
        openedByUser: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Create opening movement
    await prisma.cashMovement.create({
      data: {
        cashRegisterId: cashRegister.id,
        type: 'OPENING',
        concept: 'Apertura de caja',
        amount: data.initialAmount,
        method: 'CASH',
        userId: req.user.id,
        observations: data.observations,
      },
    });

    res.status(201).json({
      id: cashRegister.id,
      branch: cashRegister.branch,
      status: cashRegister.status,
      initialAmount: Number(cashRegister.initialAmount),
      openedAt: cashRegister.openedAt,
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

    console.error('Open cash error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error opening cash register',
      },
    });
  }
};

export const closeCash = async (req: AuthRequest, res: Response) => {
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
    
    // Intentar parsear con el schema que incluye countedAmount (del frontend)
    let parsedData;
    try {
      parsedData = closeCashSchemaAlt.parse(req.body);
      // Convertir countedAmount a finalAmount
      parsedData = { finalAmount: parsedData.countedAmount, observations: parsedData.observations };
    } catch {
      // Si falla, intentar con el schema original
      parsedData = closeCashSchema.parse(req.body);
    }
    
    const data = parsedData;

    const cashRegister = await prisma.cashRegister.findUnique({
      where: { id },
      include: {
        movements: true,
      },
    });

    if (!cashRegister) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Cash register not found',
        },
      });
    }

    if (cashRegister.status === 'CLOSED') {
      return res.status(400).json({
        error: {
          code: 'ALREADY_CLOSED',
          message: 'Cash register is already closed',
        },
      });
    }

    // Calculate totals
    const totalIncome = cashRegister.movements
      .filter((m: any) => m.type === 'SALE' || m.type === 'PAYMENT' || m.type === 'MANUAL_ENTRY')
      .reduce((sum: number, m: any) => sum + Number(m.amount), 0);

    const totalExpenses = cashRegister.movements
      .filter((m: any) => m.type === 'MANUAL_EXIT')
      .reduce((sum: number, m: any) => sum + Number(m.amount), 0);

    const expectedAmount = Number(cashRegister.initialAmount) + totalIncome - totalExpenses;
    const difference = Number(data.finalAmount) - expectedAmount;

    const updatedCash = await prisma.cashRegister.update({
      where: { id },
      data: {
        status: CashStatus.CLOSED,
        finalAmount: data.finalAmount,
        difference,
        closedBy: req.user.id,
        closedAt: new Date(),
        observations: data.observations,
      },
      include: {
        branch: true,
        closedByUser: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Create closing movement
    await prisma.cashMovement.create({
      data: {
        cashRegisterId: cashRegister.id,
        type: 'CLOSING',
        concept: 'Cierre de caja',
        amount: data.finalAmount,
        method: 'CASH',
        userId: req.user.id,
        observations: data.observations,
      },
    });

    res.json({
      id: updatedCash.id,
      branch: updatedCash.branch,
      status: updatedCash.status,
      initialAmount: Number(updatedCash.initialAmount),
      finalAmount: Number(updatedCash.finalAmount),
      expectedAmount,
      difference,
      closedAt: updatedCash.closedAt,
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

    console.error('Close cash error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error closing cash register',
      },
    });
  }
};

export const getMovements = async (req: AuthRequest, res: Response) => {
  try {
    const prisma = req.tenantPrisma || getTenantPrisma(process.env.DATABASE_URL!);
    const cashRegisterId = req.query.cashRegisterId as string | undefined;
    const type = req.query.type as string | undefined;

    const where: any = {};
    if (cashRegisterId) {
      where.cashRegisterId = cashRegisterId;
    }
    if (type) {
      where.type = type;
    }

    const movements = await prisma.cashMovement.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        cashRegister: {
          select: {
            id: true,
            branch: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { movementDate: 'desc' },
    });

    res.json({
      data: movements.map((movement) => ({
        id: movement.id,
        type: movement.type,
        concept: movement.concept,
        amount: Number(movement.amount),
        method: movement.method,
        movementDate: movement.movementDate,
        user: movement.user,
        cashRegister: movement.cashRegister,
        observations: movement.observations,
      })),
    });
  } catch (error) {
    console.error('Get movements error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error fetching movements',
      },
    });
  }
};

export const createMovement = async (req: AuthRequest, res: Response) => {
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

    const data = createMovementSchema.parse(req.body);

    // Build where clause - filter by user's branch if they have one (except admins)
    const where: any = {
      status: CashStatus.OPEN,
    };
    if (req.user.branchId && req.user.role !== 'ADMINISTRATOR') {
      where.branchId = req.user.branchId;
    }

    // Get open cash register for the user's branch (or any if admin)
    const cashRegister = await prisma.cashRegister.findFirst({
      where,
    });

    if (!cashRegister) {
      return res.status(400).json({
        error: {
          code: 'CASH_NOT_OPEN',
          message: 'No hay una caja abierta para registrar el movimiento',
        },
      });
    }

    const amount = data.type === 'MANUAL_EXIT' ? -data.amount : data.amount;

    const movement = await prisma.cashMovement.create({
      data: {
        cashRegisterId: cashRegister.id,
        type: data.type === 'MANUAL_ENTRY' ? MovementType.MANUAL_ENTRY : MovementType.MANUAL_EXIT,
        concept: data.concept,
        amount,
        method: data.method === 'CASH' ? PaymentMethod.CASH : PaymentMethod.TRANSFER,
        userId: req.user.id,
        observations: data.observations,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.status(201).json({
      movement: {
        id: movement.id,
        type: movement.type,
        concept: movement.concept,
        amount: Number(movement.amount),
        method: movement.method,
        movementDate: movement.movementDate,
        user: movement.user,
      },
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
    console.error('Create movement error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error creating cash movement',
      },
    });
  }
};

export const getDailySummary = async (req: AuthRequest, res: Response) => {
  try {
    const prisma = req.tenantPrisma || getTenantPrisma(process.env.DATABASE_URL!);
    const date = req.query.date ? new Date(req.query.date as string) : new Date();
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const branchId = req.query.branchId as string | undefined;

    const where: any = {
      movementDate: {
        gte: startOfDay,
        lte: endOfDay,
      },
    };

    if (branchId) {
      where.cashRegister = {
        branchId,
      };
    }

    const movements = await prisma.cashMovement.findMany({
      where,
      include: {
        cashRegister: {
          select: {
            branch: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    const salesTotal = movements
      .filter((m: any) => m.type === MovementType.SALE)
      .reduce((sum: number, m: any) => sum + Number(m.amount), 0);

    const paymentsTotal = movements
      .filter((m: any) => m.type === MovementType.PAYMENT)
      .reduce((sum: number, m: any) => sum + Number(m.amount), 0);

    const manualEntriesTotal = movements
      .filter((m: any) => m.type === MovementType.MANUAL_ENTRY)
      .reduce((sum: number, m: any) => sum + Number(m.amount), 0);

    const manualExitsTotal = Math.abs(
      movements
        .filter((m: any) => m.type === MovementType.MANUAL_EXIT)
        .reduce((sum: number, m: any) => sum + Number(m.amount), 0)
    );

    const openingTotal = movements
      .filter((m: any) => m.type === MovementType.OPENING)
      .reduce((sum: number, m: any) => sum + Number(m.amount), 0);

    const closingTotal = movements
      .filter((m: any) => m.type === MovementType.CLOSING)
      .reduce((sum: number, m: any) => sum + Number(m.amount), 0);

    res.json({
      date: date.toISOString().split('T')[0],
      branch: branchId && movements.length > 0 ? movements[0].cashRegister.branch.name : 'Todas',
      salesTotal: Number(salesTotal),
      paymentsTotal: Number(paymentsTotal),
      manualEntriesTotal: Number(manualEntriesTotal),
      manualExitsTotal: Number(manualExitsTotal),
      openingTotal: Number(openingTotal),
      closingTotal: Number(closingTotal),
      netTotal: Number(salesTotal) + Number(paymentsTotal) + Number(manualEntriesTotal) - Number(manualExitsTotal),
    });
  } catch (error) {
    console.error('Get daily summary error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error fetching daily summary',
      },
    });
  }
};

export const getHistory = async (req: AuthRequest, res: Response) => {
  try {
    const prisma = req.tenantPrisma || getTenantPrisma(process.env.DATABASE_URL!);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (req.query.branchId) {
      where.branchId = req.query.branchId;
    }

    if (req.query.status) {
      where.status = req.query.status;
    }

    if (req.query.startDate || req.query.endDate) {
      where.openedAt = {};
      if (req.query.startDate) {
        where.openedAt.gte = new Date(req.query.startDate as string);
      }
      if (req.query.endDate) {
        where.openedAt.lte = new Date(req.query.endDate as string);
      }
    }

    const [cashRegisters, total] = await Promise.all([
      prisma.cashRegister.findMany({
        where,
        skip,
        take: limit,
        include: {
          movements: {
            select: {
              amount: true,
              type: true,
            },
          },
          branch: {
            select: {
              id: true,
              name: true,
            },
          },
          openedByUser: {
            select: {
              id: true,
              name: true,
            },
          },
          closedByUser: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { openedAt: 'desc' },
      }),
      prisma.cashRegister.count({ where }),
    ]);

    const data = cashRegisters.map((cr) => {
      const totalIncome = cr.movements
        .filter((m: any) => m.type === 'SALE' || m.type === 'PAYMENT' || m.type === 'MANUAL_ENTRY')
        .reduce((sum: number, m: any) => sum + Number(m.amount), 0);

      const totalExpenses = cr.movements
        .filter((m: any) => m.type === 'MANUAL_EXIT')
        .reduce((sum: number, m: any) => sum + Number(m.amount), 0);

      return {
        id: cr.id,
        branch: cr.branch,
        status: cr.status,
        initialAmount: Number(cr.initialAmount),
        finalAmount: cr.finalAmount ? Number(cr.finalAmount) : null,
        difference: cr.difference ? Number(cr.difference) : null,
        openedAt: cr.openedAt,
        closedAt: cr.closedAt,
        openedBy: cr.openedByUser,
        closedBy: cr.closedByUser,
        totalIncome,
        totalExpenses,
      };
    });

    res.json({
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get cash history error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error fetching cash history',
      },
    });
  }
};

// Schema para actualizar caja
const updateCashSchema = z.object({
  observations: z.string().optional(),
});

export const updateCash = async (req: AuthRequest, res: Response) => {
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
    const data = updateCashSchema.parse(req.body);

    // Buscar la caja
    const cashRegister = await prisma.cashRegister.findUnique({
      where: { id },
      include: {
        branch: true,
      },
    });

    if (!cashRegister) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Caja no encontrada',
        },
      });
    }

    // Validar que el usuario tenga acceso a esta sucursal
    if (req.user.branchId && req.user.branchId !== cashRegister.branchId) {
      if (req.user.role !== 'ADMINISTRATOR') {
        return res.status(403).json({
          error: {
            code: 'BRANCH_ACCESS_DENIED',
            message: 'No tiene permisos para editar esta caja',
          },
        });
      }
    }

    // Solo permitir editar observaciones de cajas abiertas
    if (cashRegister.status !== 'OPEN') {
      return res.status(400).json({
        error: {
          code: 'CASH_CLOSED',
          message: 'No se puede editar una caja cerrada',
        },
      });
    }

    const updatedCash = await prisma.cashRegister.update({
      where: { id },
      data: {
        observations: data.observations,
      },
      include: {
        branch: true,
        openedByUser: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.json({
      id: updatedCash.id,
      branch: updatedCash.branch,
      status: updatedCash.status,
      initialAmount: Number(updatedCash.initialAmount),
      observations: updatedCash.observations,
      openedAt: updatedCash.openedAt,
      openedBy: updatedCash.openedByUser,
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
    if (error.code === 'P2025') {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Caja no encontrada',
        },
      });
    }
    console.error('Update cash error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error updating cash register',
      },
    });
  }
};
