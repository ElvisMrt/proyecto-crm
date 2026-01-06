import { Response } from 'express';
import { PrismaClient, InvoiceStatus } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';
import { z } from 'zod';

const prisma = new PrismaClient();

const createPaymentSchema = z.object({
  clientId: z.string().uuid(),
  invoiceIds: z.array(z.string().uuid()).optional(), // Opcional: si no se envía, se distribuye automáticamente
  invoicePayments: z.array(z.object({
    invoiceId: z.string().uuid(),
    amount: z.number().positive(),
  })).optional(), // Distribución manual por factura
  amount: z.number().positive(),
  method: z.enum(['CASH', 'TRANSFER', 'CARD']),
  reference: z.string().optional(),
  paymentDate: z.string().datetime().optional(),
  observations: z.string().optional(),
});

export const getStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { clientId } = req.params;

    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: {
        id: true,
        name: true,
        identification: true,
        email: true,
        phone: true,
        address: true,
        creditLimit: true,
        creditDays: true,
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

    const invoices = await prisma.invoice.findMany({
      where: {
        clientId,
        status: { in: [InvoiceStatus.ISSUED, InvoiceStatus.OVERDUE, InvoiceStatus.PAID] },
      },
      include: {
        payments: {
          select: {
            id: true,
            amount: true,
            paymentDate: true,
            method: true,
          },
        },
      },
      orderBy: { issueDate: 'desc' },
    });

    const now = new Date();
    const invoicesWithDetails = invoices.map((invoice) => {
      const daysOverdue = invoice.dueDate && invoice.dueDate < now
        ? Math.floor((now.getTime() - invoice.dueDate.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      const paid = Number(invoice.total) - Number(invoice.balance);
      const isOverdue = daysOverdue > 0 && Number(invoice.balance) > 0;

      return {
        id: invoice.id,
        number: invoice.number,
        ncf: invoice.ncf,
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate,
        total: Number(invoice.total),
        paid,
        balance: Number(invoice.balance),
        daysOverdue,
        status: invoice.status === InvoiceStatus.PAID 
          ? InvoiceStatus.PAID 
          : isOverdue 
            ? InvoiceStatus.OVERDUE 
            : invoice.status,
        payments: invoice.payments.map((p) => ({
          id: p.id,
          amount: Number(p.amount),
          paymentDate: p.paymentDate,
          method: p.method,
        })),
      };
    });

    const pendingInvoices = invoicesWithDetails.filter((inv) => Number(inv.balance) > 0);
    const totalReceivable = pendingInvoices.reduce((sum, inv) => sum + inv.balance, 0);
    const totalOverdue = pendingInvoices
      .filter((inv) => inv.daysOverdue > 0)
      .reduce((sum, inv) => sum + inv.balance, 0);

    res.json({
      client,
      summary: {
        totalReceivable,
        totalOverdue,
        totalInvoices: invoices.length,
        pendingInvoices: pendingInvoices.length,
        averageDaysOverdue: pendingInvoices.length > 0
          ? Math.round(pendingInvoices.reduce((sum, inv) => sum + inv.daysOverdue, 0) / pendingInvoices.length)
          : 0,
      },
      invoices: invoicesWithDetails,
    });
  } catch (error) {
    console.error('Get status error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error fetching account status',
      },
    });
  }
};

export const getOverdue = async (req: AuthRequest, res: Response) => {
  try {
    const now = new Date();
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const daysFilter = req.query.days as string; // '0-30', '31-60', '61-90', '90+'

    let dateFilter: any = { lt: now };
    if (daysFilter) {
      const days = parseInt(daysFilter.split('-')[0] || daysFilter.replace('+', ''));
      if (daysFilter.includes('+')) {
        const dateLimit = new Date(now);
        dateLimit.setDate(dateLimit.getDate() - days);
        dateFilter = { lt: dateLimit };
      } else if (daysFilter.includes('-')) {
        const parts = daysFilter.split('-');
        const minDays = parseInt(parts[0]);
        const maxDays = parseInt(parts[1]);
        const dateMin = new Date(now);
        dateMin.setDate(dateMin.getDate() - maxDays);
        const dateMax = new Date(now);
        dateMax.setDate(dateMax.getDate() - minDays);
        dateFilter = { gte: dateMin, lte: dateMax };
      } else {
        const dateLimit = new Date(now);
        dateLimit.setDate(dateLimit.getDate() - days);
        dateFilter = { gte: dateLimit, lt: now };
      }
    }

    const where: any = {
      status: { in: [InvoiceStatus.ISSUED, InvoiceStatus.OVERDUE] },
      dueDate: dateFilter,
      balance: { gt: 0 },
    };

    if (req.query.clientId) {
      where.clientId = req.query.clientId;
    }

    if (req.query.search) {
      where.OR = [
        { number: { contains: req.query.search as string } },
        { ncf: { contains: req.query.search as string } },
        { client: { name: { contains: req.query.search as string } } },
      ];
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        include: {
          client: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true,
            },
          },
        },
        orderBy: { dueDate: 'asc' },
      }),
      prisma.invoice.count({ where }),
    ]);

    const data = invoices.map((invoice) => {
      const daysOverdue = invoice.dueDate
        ? Math.floor((now.getTime() - invoice.dueDate.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      return {
        id: invoice.id,
        client: invoice.client,
        invoice: {
          id: invoice.id,
          number: invoice.number,
          ncf: invoice.ncf,
          balance: Number(invoice.balance),
          total: Number(invoice.total),
          dueDate: invoice.dueDate,
          issueDate: invoice.issueDate,
          daysOverdue,
        },
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
    console.error('Get overdue error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error fetching overdue invoices',
      },
    });
  }
};

export const createPayment = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Not authenticated',
        },
      });
    }

    const data = createPaymentSchema.parse(req.body);

    // Get client invoices with balance
    let invoices: any[] = [];
    let invoicePayments: Array<{ invoiceId: string; amount: number }> = [];

    if (data.invoicePayments && data.invoicePayments.length > 0) {
      // Distribución manual por factura
      invoicePayments = data.invoicePayments;
      const invoiceIds = invoicePayments.map((ip) => ip.invoiceId);
      
      invoices = await prisma.invoice.findMany({
        where: {
          id: { in: invoiceIds },
          clientId: data.clientId,
          status: { in: [InvoiceStatus.ISSUED, InvoiceStatus.OVERDUE] },
        },
      });

      if (invoices.length !== invoiceIds.length) {
        return res.status(400).json({
          error: {
            code: 'INVALID_INVOICES',
            message: 'Some invoices are invalid or do not belong to the client',
          },
        });
      }

      // Validate amounts
      const totalPaymentAmount = invoicePayments.reduce((sum, ip) => sum + ip.amount, 0);
      if (Math.abs(totalPaymentAmount - data.amount) > 0.01) {
        return res.status(400).json({
          error: {
            code: 'AMOUNT_MISMATCH',
            message: 'Total payment amount does not match sum of invoice payments',
          },
        });
      }

      for (const ip of invoicePayments) {
        const invoice = invoices.find((inv) => inv.id === ip.invoiceId);
        if (!invoice) {
          return res.status(400).json({
            error: {
              code: 'INVALID_INVOICE',
              message: `Invoice ${ip.invoiceId} not found`,
            },
          });
        }
        if (ip.amount > Number(invoice.balance)) {
          return res.status(400).json({
            error: {
              code: 'AMOUNT_EXCEEDS_BALANCE',
              message: `Payment amount for invoice ${invoice.number} exceeds balance`,
            },
          });
        }
      }
    } else if (data.invoiceIds && data.invoiceIds.length > 0) {
      // Distribución automática entre facturas seleccionadas
      invoices = await prisma.invoice.findMany({
        where: {
          id: { in: data.invoiceIds },
          clientId: data.clientId,
          status: { in: [InvoiceStatus.ISSUED, InvoiceStatus.OVERDUE] },
        },
        orderBy: { dueDate: 'asc' }, // Pagar primero las más vencidas
      });

      if (invoices.length !== data.invoiceIds.length) {
        return res.status(400).json({
          error: {
            code: 'INVALID_INVOICES',
            message: 'Some invoices are invalid or do not belong to the client',
          },
        });
      }

      const totalBalance = invoices.reduce((sum, inv) => sum + Number(inv.balance), 0);
      if (data.amount > totalBalance) {
        return res.status(400).json({
          error: {
            code: 'AMOUNT_EXCEEDS_BALANCE',
            message: 'Payment amount exceeds total balance',
          },
        });
      }
    } else {
      // Si no se especifican facturas, obtener todas las pendientes del cliente
      invoices = await prisma.invoice.findMany({
        where: {
          clientId: data.clientId,
          status: { in: [InvoiceStatus.ISSUED, InvoiceStatus.OVERDUE] },
          balance: { gt: 0 },
        },
        orderBy: { dueDate: 'asc' },
      });

      const totalBalance = invoices.reduce((sum, inv) => sum + Number(inv.balance), 0);
      if (data.amount > totalBalance) {
        return res.status(400).json({
          error: {
            code: 'AMOUNT_EXCEEDS_BALANCE',
            message: 'Payment amount exceeds total balance',
          },
        });
      }
    }

    // Create payment and update invoices in transaction
    const payments = await prisma.$transaction(async (tx) => {
      const createdPayments: any[] = [];
      const paymentDate = data.paymentDate ? new Date(data.paymentDate) : new Date();

      // Distribute payment across invoices
      if (invoicePayments.length > 0) {
        // Distribución manual - crear un payment por cada factura
        for (const ip of invoicePayments) {
          const invoice = invoices.find((inv) => inv.id === ip.invoiceId);
          if (!invoice) continue;

          const invoiceBalance = Number(invoice.balance);
          const paymentAmount = ip.amount;
          const newBalance = invoiceBalance - paymentAmount;
          const newStatus = newBalance === 0 ? InvoiceStatus.PAID : invoice.status;

          // Update invoice
          await tx.invoice.update({
            where: { id: invoice.id },
            data: {
              balance: newBalance,
              status: newStatus,
            },
          });

          // Create payment for this invoice
          const payment = await tx.payment.create({
            data: {
              clientId: data.clientId,
              invoiceId: invoice.id,
              amount: paymentAmount,
              method: data.method as any,
              reference: data.reference,
              paymentDate,
              observations: data.observations,
              userId: req.user!.id,
            },
          });

          createdPayments.push(payment);
        }
      } else {
        // Distribución automática (proporcional o por orden de vencimiento)
        let remainingAmount = data.amount;
        for (const invoice of invoices) {
          if (remainingAmount <= 0) break;

          const invoiceBalance = Number(invoice.balance);
          const paymentAmount = Math.min(remainingAmount, invoiceBalance);

          const newBalance = invoiceBalance - paymentAmount;
          const newStatus = newBalance === 0 ? InvoiceStatus.PAID : invoice.status;

          // Update invoice
          await tx.invoice.update({
            where: { id: invoice.id },
            data: {
              balance: newBalance,
              status: newStatus,
            },
          });

          // Create payment for this invoice
          const payment = await tx.payment.create({
            data: {
              clientId: data.clientId,
              invoiceId: invoice.id,
              amount: paymentAmount,
              method: data.method as any,
              reference: data.reference,
              paymentDate,
              observations: data.observations,
              userId: req.user!.id,
            },
          });

          createdPayments.push(payment);
          remainingAmount -= paymentAmount;
        }
      }

      // Create cash movement if cash payment (solo uno para el total)
      if (data.method === 'CASH' && createdPayments.length > 0) {
        const openCash = await tx.cashRegister.findFirst({
          where: { status: 'OPEN' },
        });

        if (openCash) {
          await tx.cashMovement.create({
            data: {
              cashRegisterId: openCash.id,
              type: 'PAYMENT',
              concept: `Pago de cuenta por cobrar (${createdPayments.length} factura${createdPayments.length > 1 ? 's' : ''})`,
              amount: data.amount,
              method: 'CASH',
              paymentId: createdPayments[0].id, // Link to first payment
              userId: req.user!.id,
            },
          });
        }
      }

      return createdPayments;
    });

    res.status(201).json({
      payments: payments.map((p) => ({
        id: p.id,
        invoiceId: p.invoiceId,
        amount: Number(p.amount),
        method: p.method,
        paymentDate: p.paymentDate,
      })),
      totalAmount: data.amount,
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

    console.error('Create payment error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error creating payment',
      },
    });
  }
};

export const getPayments = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (req.query.clientId) {
      where.clientId = req.query.clientId;
    }

    if (req.query.invoiceId) {
      where.invoiceId = req.query.invoiceId;
    }

    if (req.query.startDate || req.query.endDate) {
      where.paymentDate = {};
      if (req.query.startDate) {
        where.paymentDate.gte = new Date(req.query.startDate as string);
      }
      if (req.query.endDate) {
        where.paymentDate.lte = new Date(req.query.endDate as string);
      }
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip,
        take: limit,
        include: {
          client: {
            select: {
              id: true,
              name: true,
            },
          },
          invoice: {
            select: {
              id: true,
              number: true,
              ncf: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { paymentDate: 'desc' },
      }),
      prisma.payment.count({ where }),
    ]);

    res.json({
      data: payments.map((payment) => ({
        id: payment.id,
        client: payment.client,
        invoice: payment.invoice,
        amount: Number(payment.amount),
        method: payment.method,
        reference: payment.reference,
        paymentDate: payment.paymentDate,
        createdAt: payment.createdAt,
        user: payment.user,
        observations: payment.observations,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error fetching payments',
      },
    });
  }
};

export const getSummary = async (req: AuthRequest, res: Response) => {
  try {
    const now = new Date();
    const date30 = new Date(now);
    date30.setDate(date30.getDate() - 30);
    const date60 = new Date(now);
    date60.setDate(date60.getDate() - 60);
    const date90 = new Date(now);
    date90.setDate(date90.getDate() - 90);

    const branchId = req.query.branchId as string | undefined;
    const branchFilter = branchId ? { branchId } : {};

    const allInvoices = await prisma.invoice.findMany({
      where: {
        status: { in: [InvoiceStatus.ISSUED, InvoiceStatus.OVERDUE] },
        balance: { gt: 0 },
        paymentMethod: 'CREDIT',
        ...branchFilter,
      },
      select: {
        balance: true,
        dueDate: true,
        clientId: true,
        issueDate: true,
      },
    });

    const totalReceivable = allInvoices.reduce((sum, inv) => sum + Number(inv.balance), 0);

    const overdue = allInvoices.filter((inv) => inv.dueDate && inv.dueDate < now);
    const totalOverdue = overdue.reduce((sum, inv) => sum + Number(inv.balance), 0);

    // Group by age (days overdue)
    const byAge = {
      '0-30': overdue
        .filter((inv) => {
          if (!inv.dueDate) return false;
          const days = Math.floor((now.getTime() - inv.dueDate.getTime()) / (1000 * 60 * 60 * 24));
          return days >= 0 && days <= 30;
        })
        .reduce((sum, inv) => sum + Number(inv.balance), 0),
      '31-60': overdue
        .filter((inv) => {
          if (!inv.dueDate) return false;
          const days = Math.floor((now.getTime() - inv.dueDate.getTime()) / (1000 * 60 * 60 * 24));
          return days > 30 && days <= 60;
        })
        .reduce((sum, inv) => sum + Number(inv.balance), 0),
      '61-90': overdue
        .filter((inv) => {
          if (!inv.dueDate) return false;
          const days = Math.floor((now.getTime() - inv.dueDate.getTime()) / (1000 * 60 * 60 * 24));
          return days > 60 && days <= 90;
        })
        .reduce((sum, inv) => sum + Number(inv.balance), 0),
      '90+': overdue
        .filter((inv) => {
          if (!inv.dueDate) return false;
          const days = Math.floor((now.getTime() - inv.dueDate.getTime()) / (1000 * 60 * 60 * 24));
          return days > 90;
        })
        .reduce((sum, inv) => sum + Number(inv.balance), 0),
    };

    // Count delinquent clients (clients with overdue invoices)
    const clientIds = new Set(overdue.map((inv) => inv.clientId));
    const delinquentClients = clientIds.size;

    // Count total clients with receivables
    const allClientIds = new Set(allInvoices.map((inv) => inv.clientId));
    const totalClientsWithReceivables = allClientIds.size;

    res.json({
      totalReceivable,
      totalOverdue,
      delinquentClients,
      totalClientsWithReceivables,
      byAge,
      overdueCount: overdue.length,
      totalInvoices: allInvoices.length,
    });
  } catch (error) {
    console.error('Get summary error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error fetching summary',
      },
    });
  }
};

