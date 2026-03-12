import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { getTenantPrisma } from '../middleware/tenant.middleware';
import { z } from 'zod';

// Enums como constantes
const InvoiceStatus = {
  DRAFT: 'DRAFT',
  ISSUED: 'ISSUED',
  PAID: 'PAID',
  OVERDUE: 'OVERDUE',
  CANCELLED: 'CANCELLED'
} as const;


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

const createFinancingPlanSchema = z.object({
  interestRate: z.number().min(0),
  termMonths: z.number().int().positive(),
  paymentFrequency: z.enum(['MONTHLY', 'BIWEEKLY', 'WEEKLY']).default('MONTHLY'),
  startDate: z.string().optional(),
  notes: z.string().optional(),
});

const roundMoney = (value: number) => Math.round(value * 100) / 100;

const getPeriods = (termMonths: number, frequency: 'MONTHLY' | 'BIWEEKLY' | 'WEEKLY') => {
  switch (frequency) {
    case 'BIWEEKLY':
      return termMonths * 2;
    case 'WEEKLY':
      return termMonths * 4;
    default:
      return termMonths;
  }
};

const getPeriodicRate = (annualRate: number, frequency: 'MONTHLY' | 'BIWEEKLY' | 'WEEKLY') => {
  switch (frequency) {
    case 'BIWEEKLY':
      return annualRate / 26 / 100;
    case 'WEEKLY':
      return annualRate / 52 / 100;
    default:
      return annualRate / 12 / 100;
  }
};

const addPeriod = (date: Date, frequency: 'MONTHLY' | 'BIWEEKLY' | 'WEEKLY', periods = 1) => {
  const nextDate = new Date(date);

  if (frequency === 'MONTHLY') {
    nextDate.setMonth(nextDate.getMonth() + periods);
  } else if (frequency === 'BIWEEKLY') {
    nextDate.setDate(nextDate.getDate() + (14 * periods));
  } else {
    nextDate.setDate(nextDate.getDate() + (7 * periods));
  }

  return nextDate;
};

const calculateInstallmentAmount = (
  principal: number,
  periodicRate: number,
  totalPeriods: number
) => {
  if (periodicRate === 0) {
    return principal / totalPeriods;
  }

  const factor = Math.pow(1 + periodicRate, totalPeriods);
  return principal * ((periodicRate * factor) / (factor - 1));
};

const buildFinancingSchedule = (
  amount: number,
  interestRate: number,
  termMonths: number,
  frequency: 'MONTHLY' | 'BIWEEKLY' | 'WEEKLY',
  startDate: Date
) => {
  const periods = getPeriods(termMonths, frequency);
  const periodicRate = getPeriodicRate(interestRate, frequency);
  const installmentAmount = calculateInstallmentAmount(amount, periodicRate, periods);
  const schedule: Array<{
    installmentNo: number;
    dueDate: Date;
    openingBalance: number;
    scheduledPrincipal: number;
    scheduledInterest: number;
    scheduledTotal: number;
  }> = [];

  let balance = amount;

  for (let i = 1; i <= periods; i++) {
    const openingBalance = balance;
    const scheduledInterest = periodicRate === 0 ? 0 : openingBalance * periodicRate;
    const scheduledPrincipal = i === periods
      ? openingBalance
      : Math.min(openingBalance, installmentAmount - scheduledInterest);
    const scheduledTotal = scheduledPrincipal + scheduledInterest;

    schedule.push({
      installmentNo: i,
      dueDate: addPeriod(startDate, frequency, i - 1),
      openingBalance: roundMoney(openingBalance),
      scheduledPrincipal: roundMoney(scheduledPrincipal),
      scheduledInterest: roundMoney(scheduledInterest),
      scheduledTotal: roundMoney(scheduledTotal),
    });

    balance = Math.max(0, balance - scheduledPrincipal);
  }

  return schedule;
};

const getInstallmentStatus = (dueDate: Date, scheduledTotal: number, paidAmount: number) => {
  if (paidAmount >= scheduledTotal) return 'PAID';
  if (paidAmount > 0) return 'PARTIAL';

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const normalizedDueDate = new Date(dueDate);
  normalizedDueDate.setHours(0, 0, 0, 0);
  return normalizedDueDate < today ? 'OVERDUE' : 'PENDING';
};

const getFinancingDisplayBalance = (invoice: any) =>
  invoice.receivableFinancingPlan?.status === 'ACTIVE'
    ? Number(invoice.receivableFinancingPlan.remainingAmount)
    : Number(invoice.balance);

const getFinancingPaidAmount = (invoice: any) =>
  invoice.receivableFinancingPlan
    ? Number(invoice.receivableFinancingPlan.paidAmount)
    : Math.max(0, Number(invoice.total) - Number(invoice.balance));

const getInvoiceOverdueMetrics = (invoice: any, now: Date) => {
  const financingPlan = invoice.receivableFinancingPlan;

  if (financingPlan?.status === 'ACTIVE') {
    const overdueInstallments = (financingPlan.installments || []).filter((installment: any) => {
      const dueDate = new Date(installment.dueDate);
      dueDate.setHours(0, 0, 0, 0);

      const remainingAmount = Math.max(0, Number(installment.scheduledTotal) - Number(installment.paidAmount));
      if (remainingAmount <= 0) {
        return false;
      }

      const today = new Date(now);
      today.setHours(0, 0, 0, 0);
      return dueDate < today;
    });

    if (overdueInstallments.length === 0) {
      return {
        daysOverdue: 0,
        overdueAmount: 0,
      };
    }

    const oldestDueDate = overdueInstallments.reduce((oldest: Date, installment: any) => {
      const dueDate = new Date(installment.dueDate);
      return dueDate < oldest ? dueDate : oldest;
    }, new Date(overdueInstallments[0].dueDate));

    const normalizedToday = new Date(now);
    normalizedToday.setHours(0, 0, 0, 0);
    oldestDueDate.setHours(0, 0, 0, 0);

    return {
      daysOverdue: Math.max(0, Math.floor((normalizedToday.getTime() - oldestDueDate.getTime()) / (1000 * 60 * 60 * 24))),
      overdueAmount: roundMoney(overdueInstallments.reduce((sum: number, installment: any) => (
        sum + Math.max(0, Number(installment.scheduledTotal) - Number(installment.paidAmount))
      ), 0)),
    };
  }

  if (!invoice.dueDate || Number(invoice.balance) <= 0) {
    return {
      daysOverdue: 0,
      overdueAmount: 0,
    };
  }

  const normalizedToday = new Date(now);
  normalizedToday.setHours(0, 0, 0, 0);
  const dueDate = new Date(invoice.dueDate);
  dueDate.setHours(0, 0, 0, 0);

  if (dueDate >= normalizedToday) {
    return {
      daysOverdue: 0,
      overdueAmount: 0,
    };
  }

  return {
    daysOverdue: Math.max(0, Math.floor((normalizedToday.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))),
    overdueAmount: Number(invoice.balance),
  };
};

const applyFinancingPayment = async (
  tx: any,
  financingPlanId: string,
  paymentAmount: number,
  paymentDate: Date
) => {
  const plan = await tx.receivableFinancingPlan.findUnique({
    where: { id: financingPlanId },
    include: {
      installments: {
        orderBy: { installmentNo: 'asc' },
      },
      invoice: {
        select: {
          id: true,
          balance: true,
          status: true,
          dueDate: true,
        },
      },
    },
  });

  if (!plan) {
    throw new Error('FINANCING_PLAN_NOT_FOUND');
  }

  let remaining = paymentAmount;
  let principalAppliedTotal = 0;

  for (const installment of plan.installments) {
    if (remaining <= 0) break;

    const scheduledTotal = Number(installment.scheduledTotal);
    const scheduledInterest = Number(installment.scheduledInterest);
    const scheduledPrincipal = Number(installment.scheduledPrincipal);
    const paidAmount = Number(installment.paidAmount);
    const paidInterest = Number(installment.paidInterest);
    const paidPrincipal = Number(installment.paidPrincipal);

    const totalRemaining = Math.max(0, scheduledTotal - paidAmount);
    if (totalRemaining <= 0) continue;

    const paymentApplied = Math.min(remaining, totalRemaining);
    const remainingInterest = Math.max(0, scheduledInterest - paidInterest);
    const remainingPrincipal = Math.max(0, scheduledPrincipal - paidPrincipal);
    const interestApplied = Math.min(paymentApplied, remainingInterest);
    const principalApplied = Math.min(paymentApplied - interestApplied, remainingPrincipal);

    const nextPaidAmount = roundMoney(paidAmount + paymentApplied);
    const nextPaidInterest = roundMoney(paidInterest + interestApplied);
    const nextPaidPrincipal = roundMoney(paidPrincipal + principalApplied);
    const nextStatus = getInstallmentStatus(installment.dueDate, scheduledTotal, nextPaidAmount);

    await tx.receivableInstallment.update({
      where: { id: installment.id },
      data: {
        paidAmount: nextPaidAmount,
        paidInterest: nextPaidInterest,
        paidPrincipal: nextPaidPrincipal,
        status: nextStatus,
        paidAt: nextStatus === 'PAID' ? paymentDate : installment.paidAt,
      },
    });

    remaining = roundMoney(remaining - paymentApplied);
    principalAppliedTotal = roundMoney(principalAppliedTotal + principalApplied);
  }

  const updatedInstallments = await tx.receivableInstallment.findMany({
    where: { financingPlanId },
    orderBy: { installmentNo: 'asc' },
  });

  const totalPaid = updatedInstallments.reduce((sum: number, installment: any) => sum + Number(installment.paidAmount), 0);
  const remainingAmount = roundMoney(Math.max(0, Number(plan.totalFinanced) - totalPaid));
  const planStatus = remainingAmount === 0 ? 'PAID_OFF' : 'ACTIVE';

  await tx.receivableFinancingPlan.update({
    where: { id: financingPlanId },
    data: {
      paidAmount: totalPaid,
      remainingAmount,
      status: planStatus,
    },
  });

  const nextPrincipalBalance = roundMoney(Math.max(0, Number(plan.invoice.balance) - principalAppliedTotal));
  const hasOverdueInstallment = updatedInstallments.some((installment: any) => installment.status === 'OVERDUE');
  const nextInvoiceStatus = remainingAmount === 0
    ? InvoiceStatus.PAID
    : hasOverdueInstallment
      ? InvoiceStatus.OVERDUE
      : InvoiceStatus.ISSUED;

  await tx.invoice.update({
    where: { id: plan.invoice.id },
    data: {
      balance: nextPrincipalBalance,
      status: nextInvoiceStatus,
    },
  });

  return {
    principalApplied: principalAppliedTotal,
    interestApplied: roundMoney(paymentAmount - principalAppliedTotal),
    financingRemaining: remainingAmount,
    invoicePrincipalBalance: nextPrincipalBalance,
  };
};

export const getStatus = async (req: AuthRequest, res: Response) => {
  try {
    const prisma = req.tenantPrisma || getTenantPrisma(process.env.DATABASE_URL!);
    const { clientId } = req.params;
    const branchId = req.query.branchId as string | undefined;

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

    const branchFilter = branchId ? { branchId } : {};
    const invoices = await prisma.invoice.findMany({
      where: {
        clientId,
        status: { in: [InvoiceStatus.ISSUED, InvoiceStatus.OVERDUE, InvoiceStatus.PAID] },
        ...branchFilter,
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
        receivableFinancingPlan: {
          include: {
            installments: {
              orderBy: { installmentNo: 'asc' },
            },
          },
        },
      },
      orderBy: { issueDate: 'desc' },
    });

    const now = new Date();
    const invoicesWithDetails = invoices.map((invoice) => {
      const balance = getFinancingDisplayBalance(invoice);
      const paid = getFinancingPaidAmount(invoice);
      const { daysOverdue, overdueAmount } = getInvoiceOverdueMetrics(invoice, now);
      const isOverdue = overdueAmount > 0 && balance > 0;

      return {
        id: invoice.id,
        number: invoice.number,
        ncf: invoice.ncf,
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate,
        total: Number(invoice.total),
        paid,
        balance,
        principalBalance: Number(invoice.balance),
        daysOverdue,
        status: invoice.status === InvoiceStatus.PAID 
          ? InvoiceStatus.PAID 
          : isOverdue 
            ? InvoiceStatus.OVERDUE 
            : invoice.status,
        financingPlan: invoice.receivableFinancingPlan ? {
          id: invoice.receivableFinancingPlan.id,
          installmentAmount: Number(invoice.receivableFinancingPlan.installmentAmount),
          totalFinanced: Number(invoice.receivableFinancingPlan.totalFinanced),
          totalInterest: Number(invoice.receivableFinancingPlan.totalInterest),
          remainingAmount: Number(invoice.receivableFinancingPlan.remainingAmount),
          paidAmount: Number(invoice.receivableFinancingPlan.paidAmount),
          status: invoice.receivableFinancingPlan.status,
          installments: invoice.receivableFinancingPlan.installments.map((installment: any) => ({
            id: installment.id,
            installmentNo: installment.installmentNo,
            dueDate: installment.dueDate,
            scheduledTotal: Number(installment.scheduledTotal),
            paidAmount: Number(installment.paidAmount),
            status: installment.status,
          })),
        } : null,
        payments: invoice.payments.map((p) => ({
          id: p.id,
          amount: Number(p.amount),
          paymentDate: p.paymentDate,
          method: p.method,
        })),
      };
    });

    const pendingInvoices = invoicesWithDetails.filter((inv: any) => Number(inv.balance) > 0);
    const totalReceivable = pendingInvoices.reduce((sum: number, inv: any) => sum + inv.balance, 0);
    const totalOverdue = pendingInvoices
      .filter((inv: any) => inv.daysOverdue > 0)
      .reduce((sum: number, inv: any) => sum + inv.balance, 0);

    res.json({
      client,
      summary: {
        totalReceivable,
        totalOverdue,
        totalInvoices: invoices.length,
        pendingInvoices: pendingInvoices.length,
        averageDaysOverdue: pendingInvoices.length > 0
          ? Math.round(pendingInvoices.reduce((sum: number, inv: any) => sum + inv.daysOverdue, 0) / pendingInvoices.length)
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
    const prisma = req.tenantPrisma || getTenantPrisma(process.env.DATABASE_URL!);
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

    const branchId = req.query.branchId as string | undefined;
    const where: any = {
      status: { in: [InvoiceStatus.ISSUED, InvoiceStatus.OVERDUE] },
      paymentMethod: 'CREDIT',
    };

    if (branchId) {
      where.branchId = branchId;
    }

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

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
        receivableFinancingPlan: {
          include: {
            installments: {
              orderBy: { installmentNo: 'asc' },
            },
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    const filteredInvoices = invoices.filter((invoice) => {
      const { daysOverdue, overdueAmount } = getInvoiceOverdueMetrics(invoice, now);

      if (overdueAmount <= 0) {
        return false;
      }

      if (invoice.status === InvoiceStatus.PAID || getFinancingDisplayBalance(invoice) <= 0) {
        return false;
      }

      if (daysFilter) {
        if (daysFilter.includes('+')) {
          const minDays = parseInt(daysFilter.replace('+', ''));
          if (daysOverdue < minDays) return false;
        } else if (daysFilter.includes('-')) {
          const [min, max] = daysFilter.split('-').map((value) => parseInt(value));
          if (daysOverdue < min || daysOverdue > max) return false;
        } else {
          const exactDays = parseInt(daysFilter);
          if (daysOverdue !== exactDays) return false;
        }
      }

      if (req.query.clientId && invoice.clientId !== req.query.clientId) {
        return false;
      }

      if (req.query.search) {
        const search = String(req.query.search).toLowerCase();
        const matches = [
          invoice.number,
          invoice.ncf || '',
          invoice.client?.name || '',
        ].some((value) => value.toLowerCase().includes(search));

        if (!matches) {
          return false;
        }
      }

      return true;
    });

    const total = filteredInvoices.length;
    const paginatedInvoices = filteredInvoices.slice(skip, skip + limit);
    const data = paginatedInvoices.map((invoice) => {
      const { daysOverdue, overdueAmount } = getInvoiceOverdueMetrics(invoice, now);

      return {
        id: invoice.id,
        client: invoice.client,
        invoice: {
          id: invoice.id,
          number: invoice.number,
          ncf: invoice.ncf,
          balance: getFinancingDisplayBalance(invoice),
          overdueBalance: overdueAmount,
          total: Number(invoice.total),
          dueDate: invoice.receivableFinancingPlan?.status === 'ACTIVE'
            ? invoice.receivableFinancingPlan.installments.find((installment: any) => {
                const remaining = Math.max(0, Number(installment.scheduledTotal) - Number(installment.paidAmount));
                return remaining > 0 && new Date(installment.dueDate) < now;
              })?.dueDate || invoice.dueDate
            : invoice.dueDate,
          issueDate: invoice.issueDate,
          daysOverdue,
          financingPlanId: invoice.receivableFinancingPlan?.id || null,
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

export const createFinancingPlan = async (req: AuthRequest, res: Response) => {
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

    const { invoiceId } = req.params;
    const data = createFinancingPlanSchema.parse(req.body);

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        client: true,
        receivableFinancingPlan: true,
      },
    });

    if (!invoice) {
      return res.status(404).json({
        error: {
          code: 'INVOICE_NOT_FOUND',
          message: 'Invoice not found',
        },
      });
    }

    if (!invoice.clientId || !invoice.client) {
      return res.status(400).json({
        error: {
          code: 'CLIENT_REQUIRED',
          message: 'Invoice must have a client to be financed',
        },
      });
    }

    if (invoice.status !== InvoiceStatus.ISSUED && invoice.status !== InvoiceStatus.OVERDUE) {
      return res.status(400).json({
        error: {
          code: 'INVALID_INVOICE_STATUS',
          message: 'Only issued or overdue invoices can be financed',
        },
      });
    }

    if (invoice.paymentMethod !== 'CREDIT') {
      return res.status(400).json({
        error: {
          code: 'INVALID_PAYMENT_METHOD',
          message: 'Only credit invoices can be financed',
        },
      });
    }

    if (Number(invoice.balance) <= 0) {
      return res.status(400).json({
        error: {
          code: 'INVOICE_WITHOUT_BALANCE',
          message: 'Invoice does not have pending balance',
        },
      });
    }

    if (invoice.receivableFinancingPlan && invoice.receivableFinancingPlan.status === 'ACTIVE') {
      return res.status(400).json({
        error: {
          code: 'FINANCING_ALREADY_EXISTS',
          message: 'This invoice already has an active financing plan',
        },
      });
    }

    const startDate = data.startDate ? new Date(data.startDate) : new Date();
    const schedule = buildFinancingSchedule(
      Number(invoice.balance),
      data.interestRate,
      data.termMonths,
      data.paymentFrequency,
      startDate
    );
    const totalInterest = roundMoney(schedule.reduce((sum, installment) => sum + installment.scheduledInterest, 0));
    const totalFinanced = roundMoney(schedule.reduce((sum, installment) => sum + installment.scheduledTotal, 0));
    const installmentAmount = schedule[0]?.scheduledTotal || totalFinanced;

    const plan = await prisma.$transaction(async (tx) => {
      const createdPlan = await tx.receivableFinancingPlan.create({
        data: {
          invoiceId: invoice.id,
          clientId: invoice.clientId!,
          branchId: invoice.branchId,
          createdById: req.user!.id,
          principalAmount: Number(invoice.balance),
          annualInterestRate: data.interestRate,
          termMonths: data.termMonths,
          paymentFrequency: data.paymentFrequency,
          startDate,
          firstDueDate: schedule[0].dueDate,
          endDate: schedule[schedule.length - 1].dueDate,
          installmentAmount,
          totalInterest,
          totalFinanced,
          remainingAmount: totalFinanced,
          notes: data.notes,
        },
      });

      await tx.receivableInstallment.createMany({
        data: schedule.map((installment) => ({
          financingPlanId: createdPlan.id,
          installmentNo: installment.installmentNo,
          dueDate: installment.dueDate,
          openingBalance: installment.openingBalance,
          scheduledPrincipal: installment.scheduledPrincipal,
          scheduledInterest: installment.scheduledInterest,
          scheduledTotal: installment.scheduledTotal,
          status: getInstallmentStatus(installment.dueDate, installment.scheduledTotal, 0),
        })),
      });

      return tx.receivableFinancingPlan.findUnique({
        where: { id: createdPlan.id },
        include: {
          installments: {
            orderBy: { installmentNo: 'asc' },
          },
        },
      });
    });

    res.status(201).json({
      message: 'Financing plan created successfully',
      data: plan,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid financing plan data',
          details: error.errors,
        },
      });
    }

    console.error('Create financing plan error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error creating financing plan',
      },
    });
  }
};

export const getFinancingPlan = async (req: AuthRequest, res: Response) => {
  try {
    const prisma = req.tenantPrisma || getTenantPrisma(process.env.DATABASE_URL!);
    const { invoiceId } = req.params;

    const plan = await prisma.receivableFinancingPlan.findUnique({
      where: { invoiceId },
      include: {
        installments: {
          orderBy: { installmentNo: 'asc' },
        },
        invoice: {
          select: {
            id: true,
            number: true,
            total: true,
            balance: true,
          },
        },
        client: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
      },
    });

    if (!plan) {
      return res.status(404).json({
        error: {
          code: 'FINANCING_PLAN_NOT_FOUND',
          message: 'Financing plan not found',
        },
      });
    }

    res.json({ data: plan });
  } catch (error) {
    console.error('Get financing plan error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error fetching financing plan',
      },
    });
  }
};

export const createPayment = async (req: AuthRequest, res: Response) => {
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

    const data = createPaymentSchema.parse(req.body);
    const branchId = req.query.branchId as string | undefined;

    // Get client invoices with balance
    let invoices: any[] = [];
    let invoicePayments: Array<{ invoiceId: string; amount: number }> = [];
    let invoiceBranchId: string | null = null;

    const validateSingleBranch = (invoiceList: Array<{ branchId?: string | null; number?: string }>) => {
      const branchIds = Array.from(new Set(invoiceList.map((inv) => inv.branchId || null)));
      if (branchIds.length > 1) {
        return res.status(400).json({
          error: {
            code: 'MULTI_BRANCH_PAYMENT_NOT_ALLOWED',
            message: 'No se pueden registrar pagos para facturas de distintas sucursales en una sola transacción',
          },
        });
      }

      invoiceBranchId = branchIds[0] || null;
      return null;
    };

    if (data.invoicePayments && data.invoicePayments.length > 0) {
      // Distribución manual por factura
      invoicePayments = data.invoicePayments.map((ip) => ({
        invoiceId: ip.invoiceId,
        amount: ip.amount,
      }));
      const invoiceIds = invoicePayments.map((ip) => ip.invoiceId);
      
      const invoiceWhere: any = {
        id: { in: invoiceIds },
        clientId: data.clientId,
        status: { in: [InvoiceStatus.ISSUED, InvoiceStatus.OVERDUE] },
      };
      if (branchId) {
        invoiceWhere.branchId = branchId;
      }
      
      invoices = await prisma.invoice.findMany({
        where: invoiceWhere,
        include: {
          receivableFinancingPlan: {
            select: {
              id: true,
              remainingAmount: true,
              status: true,
            },
          },
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

      const branchValidation = validateSingleBranch(invoices);
      if (branchValidation) {
        return branchValidation;
      }

      // Validate amounts
      const totalPaymentAmount = invoicePayments.reduce((sum: number, ip: any) => sum + ip.amount, 0);
      if (Math.abs(totalPaymentAmount - data.amount) > 0.01) {
        return res.status(400).json({
          error: {
            code: 'AMOUNT_MISMATCH',
            message: 'Total payment amount does not match sum of invoice payments',
          },
        });
      }

      for (const ip of invoicePayments) {
        const invoice = invoices.find((inv: any) => inv.id === ip.invoiceId);
        if (!invoice) {
          return res.status(400).json({
            error: {
              code: 'INVALID_INVOICE',
              message: `Invoice ${ip.invoiceId} not found`,
            },
          });
        }
        const availableBalance = invoice.receivableFinancingPlan?.status === 'ACTIVE'
          ? Number(invoice.receivableFinancingPlan.remainingAmount)
          : Number(invoice.balance);
        if (ip.amount > availableBalance) {
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
      const invoiceWhere: any = {
        id: { in: data.invoiceIds },
        clientId: data.clientId,
        status: { in: [InvoiceStatus.ISSUED, InvoiceStatus.OVERDUE] },
      };
      if (branchId) {
        invoiceWhere.branchId = branchId;
      }
      
      invoices = await prisma.invoice.findMany({
        where: invoiceWhere,
        select: {
          id: true,
          number: true,
          balance: true,
          status: true,
          dueDate: true,
          branchId: true,
          receivableFinancingPlan: {
            select: {
              id: true,
              remainingAmount: true,
              status: true,
            },
          },
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

      const branchValidation = validateSingleBranch(invoices);
      if (branchValidation) {
        return branchValidation;
      }

      if (branchId) {
        const invalidBranchInvoices = invoices.filter((inv: any) => inv.branchId !== branchId);
        if (invalidBranchInvoices.length > 0) {
          return res.status(400).json({
            error: {
              code: 'BRANCH_MISMATCH',
              message: 'Algunas facturas no pertenecen a la sucursal seleccionada',
            },
          });
        }
      }

      const totalBalance = invoices.reduce((sum: number, inv: any) => sum + (
        inv.receivableFinancingPlan?.status === 'ACTIVE'
          ? Number(inv.receivableFinancingPlan.remainingAmount)
          : Number(inv.balance)
      ), 0);
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
      const invoiceWhere: any = {
        clientId: data.clientId,
        status: { in: [InvoiceStatus.ISSUED, InvoiceStatus.OVERDUE] },
        balance: { gt: 0 },
      };
      if (branchId) {
        invoiceWhere.branchId = branchId;
      }
      
      invoices = await prisma.invoice.findMany({
        where: invoiceWhere,
        select: {
          id: true,
          number: true,
          balance: true,
          status: true,
          dueDate: true,
          branchId: true,
          receivableFinancingPlan: {
            select: {
              id: true,
              remainingAmount: true,
              status: true,
            },
          },
        },
        orderBy: { dueDate: 'asc' },
      });

      const totalBalance = invoices.reduce((sum: number, inv: any) => sum + (
        inv.receivableFinancingPlan?.status === 'ACTIVE'
          ? Number(inv.receivableFinancingPlan.remainingAmount)
          : Number(inv.balance)
      ), 0);
      if (data.amount > totalBalance) {
        return res.status(400).json({
          error: {
            code: 'AMOUNT_EXCEEDS_BALANCE',
            message: 'Payment amount exceeds total balance',
          },
        });
      }

      const branchValidation = validateSingleBranch(invoices);
      if (branchValidation) {
        return branchValidation;
      }

      if (branchId) {
        const invalidBranchInvoices = invoices.filter((inv: any) => inv.branchId !== branchId);
        if (invalidBranchInvoices.length > 0) {
          return res.status(400).json({
            error: {
              code: 'BRANCH_MISMATCH',
              message: 'Algunas facturas no pertenecen a la sucursal seleccionada',
            },
          });
        }
      }
    }

    // Validate cash register branch matches invoice branch for cash payments
    if (data.method === 'CASH') {
      const targetBranchId = branchId || invoiceBranchId;
      if (!targetBranchId) {
        return res.status(400).json({
          error: {
            code: 'MISSING_BRANCH_CONTEXT',
            message: 'No se pudo determinar la sucursal de las facturas para registrar el pago en efectivo',
          },
        });
      }

      const cashWhere: any = { status: 'OPEN' };
      cashWhere.branchId = targetBranchId;
      
      const openCash = await prisma.cashRegister.findFirst({
        where: cashWhere,
      });

      if (!openCash) {
        return res.status(400).json({
          error: {
            code: 'CASH_BRANCH_MISMATCH',
            message: 'No hay caja abierta para la sucursal de las facturas seleccionadas',
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
          const invoice = invoices.find((inv: any) => inv.id === ip.invoiceId);
          if (!invoice) continue;

          const invoiceBalance = invoice.receivableFinancingPlan?.status === 'ACTIVE'
            ? Number(invoice.receivableFinancingPlan.remainingAmount)
            : Number(invoice.balance);
          const paymentAmount = ip.amount;
          const newBalance = invoiceBalance - paymentAmount;
          
          // Determine new status based on balance
          let newStatus = invoice.status;
          if (newBalance === 0) {
            newStatus = InvoiceStatus.PAID;
          } else if (invoice.status === InvoiceStatus.PAID) {
            // If was PAID but now has balance, check if overdue
            const now = new Date();
            if (invoice.dueDate && invoice.dueDate < now) {
              newStatus = InvoiceStatus.OVERDUE;
            } else {
              newStatus = InvoiceStatus.ISSUED;
            }
          } else if (invoice.status === InvoiceStatus.ISSUED && invoice.dueDate) {
            // Check if should be marked as OVERDUE
            const now = new Date();
            if (invoice.dueDate < now && newBalance > 0) {
              newStatus = InvoiceStatus.OVERDUE;
            }
          }

          // Update invoice
          if (invoice.receivableFinancingPlan?.status === 'ACTIVE') {
            await applyFinancingPayment(tx, invoice.receivableFinancingPlan.id, paymentAmount, paymentDate);
          } else {
            await tx.invoice.update({
              where: { id: invoice.id },
              data: {
                balance: newBalance,
                status: newStatus,
              },
            });
          }

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

          const invoiceBalance = invoice.receivableFinancingPlan?.status === 'ACTIVE'
            ? Number(invoice.receivableFinancingPlan.remainingAmount)
            : Number(invoice.balance);
          const paymentAmount = Math.min(remainingAmount, invoiceBalance);

          const newBalance = invoiceBalance - paymentAmount;
          
          // Determine new status based on balance
          let newStatus = invoice.status;
          if (newBalance === 0) {
            newStatus = InvoiceStatus.PAID;
          } else if (invoice.status === InvoiceStatus.PAID) {
            // If was PAID but now has balance, check if overdue
            const now = new Date();
            if (invoice.dueDate && invoice.dueDate < now) {
              newStatus = InvoiceStatus.OVERDUE;
            } else {
              newStatus = InvoiceStatus.ISSUED;
            }
          } else if (invoice.status === InvoiceStatus.ISSUED && invoice.dueDate) {
            // Check if should be marked as OVERDUE
            const now = new Date();
            if (invoice.dueDate < now && newBalance > 0) {
              newStatus = InvoiceStatus.OVERDUE;
            }
          }

          // Update invoice
          if (invoice.receivableFinancingPlan?.status === 'ACTIVE') {
            await applyFinancingPayment(tx, invoice.receivableFinancingPlan.id, paymentAmount, paymentDate);
          } else {
            await tx.invoice.update({
              where: { id: invoice.id },
              data: {
                balance: newBalance,
                status: newStatus,
              },
            });
          }

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

      // Create cash movement for cash payments (solo uno para el total)
      if (data.method === 'CASH' && createdPayments.length > 0) {
        const targetBranchId = branchId || invoiceBranchId;
        if (!targetBranchId) {
          throw new Error('No se pudo determinar la sucursal para registrar el movimiento de caja');
        }

        const cashWhere: any = { status: 'OPEN' };
        cashWhere.branchId = targetBranchId;

        const openCash = await tx.cashRegister.findFirst({
          where: cashWhere,
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
              movementDate: new Date(),
            },
          });
        }
      }

      // Create cash movement for transfer payments (optional - según reglas de negocio)
      // Si se requiere registrar transferencias también en caja, descomentar:
      /*
      if (data.method === 'TRANSFER' && createdPayments.length > 0) {
        const cashWhere: any = { status: 'OPEN' };
        if (branchId) {
          cashWhere.branchId = branchId;
        } else if (invoiceBranchId) {
          cashWhere.branchId = invoiceBranchId;
        }

        const openCash = await tx.cashRegister.findFirst({
          where: cashWhere,
        });

        if (openCash) {
          await tx.cashMovement.create({
            data: {
              cashRegisterId: openCash.id,
              type: 'PAYMENT',
              concept: `Pago por transferencia - Cuenta por cobrar (${createdPayments.length} factura${createdPayments.length > 1 ? 's' : ''})`,
              amount: data.amount,
              method: 'TRANSFER',
              paymentId: createdPayments[0].id,
              userId: req.user!.id,
              movementDate: new Date(),
            },
          });
        }
      }
      */

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
    const prisma = req.tenantPrisma || getTenantPrisma(process.env.DATABASE_URL!);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const branchId = req.query.branchId as string | undefined;

    const where: any = {};

    if (req.query.clientId) {
      where.clientId = req.query.clientId;
    }

    if (req.query.invoiceId) {
      where.invoiceId = req.query.invoiceId;
    }

    if (branchId) {
      where.invoice = {
        branchId,
      };
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
    const prisma = req.tenantPrisma || getTenantPrisma(process.env.DATABASE_URL!);
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
        paymentMethod: 'CREDIT',
        ...branchFilter,
      },
      include: {
        receivableFinancingPlan: {
          include: {
            installments: {
              orderBy: { installmentNo: 'asc' },
            },
          },
        },
      },
    });

    const receivableInvoices = allInvoices.filter((invoice: any) => getFinancingDisplayBalance(invoice) > 0);
    const totalReceivable = roundMoney(receivableInvoices.reduce((sum: number, inv: any) => sum + getFinancingDisplayBalance(inv), 0));

    const overdue = receivableInvoices
      .map((invoice: any) => ({
        invoice,
        metrics: getInvoiceOverdueMetrics(invoice, now),
      }))
      .filter(({ metrics }) => metrics.overdueAmount > 0);
    const totalOverdue = roundMoney(overdue.reduce((sum: number, entry: any) => sum + entry.metrics.overdueAmount, 0));

    // Group by age (days overdue)
    const byAge = {
      '0-30': overdue
        .filter((entry: any) => {
          const days = entry.metrics.daysOverdue;
          return days >= 0 && days <= 30;
        })
        .reduce((sum: number, entry: any) => sum + entry.metrics.overdueAmount, 0),
      '31-60': overdue
        .filter((entry: any) => {
          const days = entry.metrics.daysOverdue;
          return days > 30 && days <= 60;
        })
        .reduce((sum: number, entry: any) => sum + entry.metrics.overdueAmount, 0),
      '61-90': overdue
        .filter((entry: any) => {
          const days = entry.metrics.daysOverdue;
          return days > 60 && days <= 90;
        })
        .reduce((sum: number, entry: any) => sum + entry.metrics.overdueAmount, 0),
      '90+': overdue
        .filter((entry: any) => {
          const days = entry.metrics.daysOverdue;
          return days > 90;
        })
        .reduce((sum: number, entry: any) => sum + entry.metrics.overdueAmount, 0),
    };

    // Count delinquent clients (clients with overdue invoices)
    const clientIds = new Set(overdue.map((entry: any) => entry.invoice.clientId));
    const delinquentClients = clientIds.size;

    // Count total clients with receivables
    const allClientIds = new Set(receivableInvoices.map((inv: any) => inv.clientId));
    const totalClientsWithReceivables = allClientIds.size;

    // Get top 10 clients by receivable amount
    const clientReceivables = new Map<string, { clientId: string; total: number; overdue: number; invoiceCount: number }>();
    
    receivableInvoices.forEach((inv: any) => {
      if (!inv.clientId) return;
      const { overdueAmount } = getInvoiceOverdueMetrics(inv, now);
      const existing = clientReceivables.get(inv.clientId) || { clientId: inv.clientId, total: 0, overdue: 0, invoiceCount: 0 };
      existing.total += getFinancingDisplayBalance(inv);
      existing.invoiceCount += 1;
      
      existing.overdue += overdueAmount;
      
      clientReceivables.set(inv.clientId, existing);
    });

    const topClientsData = Array.from(clientReceivables.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    // Fetch client details for top clients
    const topClients = await Promise.all(
      topClientsData.map(async (data: any) => {
        const client = await prisma.client.findUnique({
          where: { id: data.clientId },
          select: {
            id: true,
            name: true,
            identification: true,
          },
        });
        return {
          client: client || { id: data.clientId, name: 'Cliente eliminado', identification: '' },
          totalReceivable: data.total,
          invoiceCount: data.invoiceCount,
        };
      })
    );

    // Get top debtors (clients with highest balances)
    const topDebtorsData = Array.from(clientReceivables.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    const topDebtors = await Promise.all(
      topDebtorsData.map(async (data: any) => {
        const client = await prisma.client.findUnique({
          where: { id: data.clientId },
          select: {
            id: true,
            name: true,
            identification: true,
          },
        });
        return {
          clientId: data.clientId,
          clientName: client?.name || 'Cliente eliminado',
          clientIdentification: client?.identification || '',
          totalBalance: data.total,
          overdueBalance: data.overdue,
          invoiceCount: data.invoiceCount,
        };
      })
    );

    res.json({
      totalReceivable,
      totalOverdue,
      delinquentClients,
      totalClientsWithReceivables,
      byAge,
      overdueCount: overdue.length,
      totalInvoices: receivableInvoices.length,
      topClients,
      topDebtors,
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
