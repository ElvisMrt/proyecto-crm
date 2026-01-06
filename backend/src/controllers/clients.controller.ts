import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';
import { z } from 'zod';
import { validateIdentification, normalizeIdentification } from '../utils/identificationValidator';

const prisma = new PrismaClient();

const createClientSchema = z.object({
  name: z.string().min(1),
  identification: z.string().min(1),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  creditLimit: z.number().nonnegative().optional(),
  creditDays: z.number().int().positive().default(30),
  clientType: z.enum(['CASH', 'CREDIT']).default('CASH'),
  observations: z.string().optional().or(z.literal('')),
});

export const getClients = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (req.query.isActive !== undefined) {
      where.isActive = req.query.isActive === 'true';
    }

    if (req.query.clientType) {
      // Note: This assumes we add a clientType field or use creditLimit to determine type
      if (req.query.clientType === 'CREDIT') {
        where.creditLimit = { gt: 0 };
      } else {
        where.OR = [
          { creditLimit: null },
          { creditLimit: 0 },
        ];
      }
    }

    if (req.query.search) {
      where.OR = [
        { name: { contains: req.query.search as string, mode: 'insensitive' } },
        { identification: { contains: req.query.search as string, mode: 'insensitive' } },
        { email: { contains: req.query.search as string, mode: 'insensitive' } },
        { phone: { contains: req.query.search as string, mode: 'insensitive' } },
      ];
    }

    if (req.query.startDate || req.query.endDate) {
      where.createdAt = {};
      if (req.query.startDate) {
        where.createdAt.gte = new Date(req.query.startDate as string);
      }
      if (req.query.endDate) {
        where.createdAt.lte = new Date(req.query.endDate as string);
      }
    }

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: {
              invoices: true,
              payments: true,
            },
          },
        },
      }),
      prisma.client.count({ where }),
    ]);

    res.json({
      data: clients.map((client) => ({
        ...client,
        creditLimit: client.creditLimit ? Number(client.creditLimit) : null,
        invoiceCount: client._count.invoices,
        paymentCount: client._count.payments,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get clients error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error fetching clients',
      },
    });
  }
};

export const getClient = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        invoices: {
          select: {
            id: true,
            total: true,
            balance: true,
            status: true,
          },
        },
        payments: {
          select: {
            id: true,
            amount: true,
            paymentDate: true,
          },
          take: 5,
          orderBy: { paymentDate: 'desc' },
        },
        _count: {
          select: {
            invoices: true,
            payments: true,
            quotes: true,
            tasks: true,
          },
        },
      },
    });

    if (!client) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Client not found',
        },
      });
    }

    // Calculate summary
    const totalSales = client.invoices.reduce((sum, inv) => sum + Number(inv.total), 0);
    const totalReceivable = client.invoices
      .filter((inv) => inv.status !== 'PAID' && inv.status !== 'CANCELLED')
      .reduce((sum, inv) => sum + Number(inv.balance), 0);

    res.json({
      ...client,
      creditLimit: client.creditLimit ? Number(client.creditLimit) : null,
      summary: {
        totalSales,
        totalReceivable,
        invoiceCount: client._count.invoices,
        paymentCount: client._count.payments,
        quoteCount: client._count.quotes,
        taskCount: client._count.tasks,
      },
      recentPayments: client.payments.map((p) => ({
        id: p.id,
        amount: Number(p.amount),
        paymentDate: p.paymentDate,
      })),
    });
  } catch (error) {
    console.error('Get client error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error fetching client',
      },
    });
  }
};

export const createClient = async (req: AuthRequest, res: Response) => {
  try {
    const data = createClientSchema.parse(req.body);

    // Validar formato de identificación
    const identificationValidation = validateIdentification(data.identification);
    if (!identificationValidation.isValid) {
      return res.status(400).json({
        error: {
          code: 'INVALID_IDENTIFICATION',
          message: identificationValidation.error || 'Identificación inválida',
        },
      });
    }

    // Normalizar identificación (eliminar espacios y guiones)
    const normalizedIdentification = normalizeIdentification(data.identification);

    // Check for duplicate identification
    const existing = await prisma.client.findUnique({
      where: { identification: normalizedIdentification },
    });

    if (existing) {
      return res.status(400).json({
        error: {
          code: 'DUPLICATE_IDENTIFICATION',
          message: 'Ya existe un cliente con este documento (RNC/Cédula)',
        },
      });
    }

    const client = await prisma.client.create({
      data: {
        name: data.name,
        identification: normalizedIdentification,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null,
        creditLimit: data.clientType === 'CREDIT' ? (data.creditLimit || 0) : 0,
        creditDays: data.creditDays,
        isActive: true,
      },
    });

    res.status(201).json({
      id: client.id,
      name: client.name,
      identification: client.identification,
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

    if (error.code === 'P2002') {
      return res.status(400).json({
        error: {
          code: 'DUPLICATE_IDENTIFICATION',
          message: 'Ya existe un cliente con este documento',
        },
      });
    }

    console.error('Create client error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error creating client',
      },
    });
  }
};

export const updateClient = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data = createClientSchema.partial().parse(req.body);

    // Check for duplicate identification if identification is being updated
    if (data.identification) {
      const existing = await prisma.client.findUnique({
        where: { identification: data.identification },
      });

      if (existing && existing.id !== id) {
        return res.status(400).json({
          error: {
            code: 'DUPLICATE_IDENTIFICATION',
            message: 'Ya existe otro cliente con este documento (RNC/Cédula)',
          },
        });
      }
    }

    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    if (data.identification) updateData.identification = data.identification;
    if (data.email !== undefined) updateData.email = data.email || null;
    if (data.phone !== undefined) updateData.phone = data.phone || null;
    if (data.address !== undefined) updateData.address = data.address || null;
    if (data.creditLimit !== undefined) updateData.creditLimit = data.creditLimit;
    if (data.creditDays !== undefined) updateData.creditDays = data.creditDays;

    const client = await prisma.client.update({
      where: { id },
      data: updateData,
    });

    res.json({
      id: client.id,
      name: client.name,
      identification: client.identification,
    });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Client not found',
        },
      });
    }

    if (error.code === 'P2002') {
      return res.status(400).json({
        error: {
          code: 'DUPLICATE_IDENTIFICATION',
          message: 'Ya existe otro cliente con este documento',
        },
      });
    }

    console.error('Update client error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error updating client',
      },
    });
  }
};

export const toggleClientStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const client = await prisma.client.update({
      where: { id },
      data: { isActive: isActive !== undefined ? isActive : true },
    });

    res.json({
      id: client.id,
      isActive: client.isActive,
    });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Client not found',
        },
      });
    }

    console.error('Toggle client status error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error updating client status',
      },
    });
  }
};

