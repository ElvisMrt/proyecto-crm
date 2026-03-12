import { Response } from 'express';
import path from 'path';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.middleware';
import { getTenantPrisma } from '../middleware/tenant.middleware';
import { sendLoanReceiptEmail } from '../services/email.service';
import { whatsappService } from '../services/whatsapp.service';
import {
  generateLoanDisbursementReceiptPdf,
  generateLoanPaymentReceiptPdf,
} from '../services/loan-document.service';

const loanSchema = z.object({
  clientId: z.string().uuid(),
  branchId: z.string().uuid().optional().nullable(),
  amount: z.number().positive(),
  interestRate: z.number().min(0),
  termMonths: z.number().int().positive(),
  paymentFrequency: z.enum(['MONTHLY', 'BIWEEKLY', 'WEEKLY']).default('MONTHLY'),
  startDate: z.string(),
  purpose: z.string().min(1),
  collateral: z.string().optional().nullable(),
  guarantee: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

const paymentSchema = z.object({
  installmentId: z.string().uuid(),
  amount: z.number().positive(),
  method: z.enum(['CASH', 'TRANSFER', 'CARD']),
  paymentDate: z.string().optional(),
  reference: z.string().optional().nullable(),
  observations: z.string().optional().nullable(),
});

const disbursementSchema = z.object({
  amount: z.number().positive().optional(),
  method: z.enum(['CASH', 'TRANSFER', 'CARD']).default('TRANSFER'),
  disbursementDate: z.string().optional(),
  reference: z.string().optional().nullable(),
  observations: z.string().optional().nullable(),
});

const reversePaymentSchema = z.object({
  reason: z.string().min(3),
});

const LOAN_NUMBER_PREFIX = 'PRESTAMO-';
const LOAN_RECEIPT_PREFIX = 'RP';

const toNumber = (value: any) => Number(value || 0);
const roundMoney = (value: number) => Math.round(value * 100) / 100;
const getReceiptNumber = () => `${LOAN_RECEIPT_PREFIX}-${Date.now()}`;
const BACKEND_UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads');

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

const buildSchedule = (
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
    principalAmount: number;
    interestAmount: number;
    totalAmount: number;
  }> = [];

  let balance = amount;

  for (let i = 1; i <= periods; i++) {
    const openingBalance = balance;
    const interestAmount = periodicRate === 0 ? 0 : openingBalance * periodicRate;
    const principalAmount = i === periods
      ? openingBalance
      : Math.min(openingBalance, installmentAmount - interestAmount);
    const totalAmount = principalAmount + interestAmount;

    schedule.push({
      installmentNo: i,
      dueDate: addPeriod(startDate, frequency, i - 1),
      openingBalance,
      principalAmount,
      interestAmount,
      totalAmount,
    });

    balance = Math.max(0, balance - principalAmount);
  }

  return schedule;
};

const getLoanNumber = async (prisma: any) => {
  const latestLoan = await prisma.loan.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { number: true },
  });

  const latestNumber = latestLoan?.number?.startsWith(LOAN_NUMBER_PREFIX)
    ? parseInt(latestLoan.number.replace(LOAN_NUMBER_PREFIX, ''), 10)
    : 0;

  return `${LOAN_NUMBER_PREFIX}${String((latestNumber || 0) + 1).padStart(6, '0')}`;
};

const createLoanLedgerEntry = async (
  prisma: any,
  loanId: string,
  eventType: 'CREATED' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'DISBURSED' | 'PAYMENT_POSTED' | 'PAYMENT_REVERSED' | 'RESTRUCTURED' | 'PAID_OFF' | 'WRITTEN_OFF' | 'CANCELLED',
  options: {
    amount?: number | null;
    notes?: string | null;
    metadata?: Record<string, any>;
    userId?: string | null;
  } = {}
) => {
  await prisma.loanLedger.create({
    data: {
      loanId,
      eventType,
      amount: options.amount ?? null,
      notes: options.notes ?? null,
      metadata: options.metadata ?? undefined,
      userId: options.userId ?? null,
    },
  });
};

const createLoanDocumentRecord = async (
  prisma: any,
  data: {
    loanId: string;
    loanPaymentId?: string | null;
    type: 'CONTRACT' | 'DISBURSEMENT_RECEIPT' | 'PAYMENT_RECEIPT' | 'STATEMENT' | 'SUPPORT';
    fileName: string;
    fileUrl: string;
    sentEmailAt?: Date | null;
    sentWhatsAppAt?: Date | null;
  }
) => prisma.loanDocument.create({
  data: {
    loanId: data.loanId,
    loanPaymentId: data.loanPaymentId || null,
    type: data.type,
    fileName: data.fileName,
    fileUrl: data.fileUrl,
    sentEmailAt: data.sentEmailAt || null,
    sentWhatsAppAt: data.sentWhatsAppAt || null,
  },
});

const trySendLoanEmail = async (options: {
  to?: string | null;
  clientName: string;
  subject: string;
  title: string;
  summaryLines: string[];
  attachmentPath: string;
  attachmentName: string;
}) => {
  if (!options.to) {
    return false;
  }

  try {
    await sendLoanReceiptEmail({
      to: options.to,
      clientName: options.clientName,
      subject: options.subject,
      title: options.title,
      summaryLines: options.summaryLines,
      attachmentPath: options.attachmentPath,
      attachmentName: options.attachmentName,
    });
    return true;
  } catch (error: any) {
    console.warn('[Loans] Email no enviado:', error.message);
    return false;
  }
};

const buildPublicFileUrl = (req: AuthRequest, fileUrl: string) => {
  const protocol = req.headers['x-forwarded-proto'] as string || req.protocol || 'http';
  const host = req.get('host') || 'localhost:3001';
  return `${protocol}://${host}${fileUrl}`;
};

const trySendLoanWhatsApp = async (options: {
  to?: string | null;
  message: string;
  subject?: string;
}) => {
  if (!options.to) {
    return false;
  }

  const result = await whatsappService.sendMessage(options.to, options.message, options.subject);
  if (!result.success) {
    console.warn('[Loans] WhatsApp no enviado:', result.error);
    return false;
  }

  return true;
};

const getCompanyProfile = async (prisma: any) => {
  const company = await prisma.tenant.findFirst({
    where: { status: 'ACTIVE' },
    select: {
      name: true,
      email: true,
      phone: true,
      address: true,
      rnc: true,
      logo: true,
    },
  });

  return {
    name: company?.name || 'Mi Empresa',
    email: company?.email || null,
    phone: company?.phone || null,
    address: company?.address || null,
    rnc: company?.rnc || null,
    logo: company?.logo || null,
  };
};

const recalculateLoanState = async (prisma: any, loanId: string) => {
  const loan = await prisma.loan.findUnique({
    where: { id: loanId },
    include: {
      approvedBy: {
        select: {
          name: true,
        },
      },
      client: true,
      branch: true,
      saleInvoice: {
        select: {
          id: true,
          number: true,
          balance: true,
          total: true,
          issueDate: true,
          dueDate: true,
        },
      },
      installments: {
        orderBy: { installmentNo: 'asc' },
      },
    },
  });

  if (!loan) {
    return null;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let paidAmount = 0;
  let remainingAmount = 0;
  let nextPaymentDate: Date | null = null;
  let overdueDays = 0;
  let status = loan.status;

  for (const installment of loan.installments) {
    const totalDue = toNumber(installment.totalAmount) + toNumber(installment.lateFeeAmount);
    const paid = toNumber(installment.paidAmount);

    paidAmount += Math.min(paid, totalDue);
    remainingAmount += Math.max(0, totalDue - paid);

    if (!nextPaymentDate && installment.status !== 'PAID') {
      nextPaymentDate = installment.dueDate;
    }

    if (installment.status === 'OVERDUE') {
      const installmentDate = new Date(installment.dueDate);
      installmentDate.setHours(0, 0, 0, 0);
      overdueDays = Math.max(
        overdueDays,
        Math.floor((today.getTime() - installmentDate.getTime()) / (1000 * 60 * 60 * 24))
      );
    }
  }

  if (loan.status === 'CANCELLED') {
    status = 'CANCELLED';
    nextPaymentDate = null;
    overdueDays = 0;
    remainingAmount = toNumber(loan.remainingAmount);
  } else if (loan.status === 'REJECTED') {
    status = 'REJECTED';
    nextPaymentDate = null;
    overdueDays = 0;
    remainingAmount = toNumber(loan.remainingAmount || loan.amount);
  } else if (loan.status === 'APPROVED' && !loan.disbursedAt) {
    status = 'APPROVED';
  } else if (loan.installments.length === 0) {
    status = 'PENDING';
    paidAmount = 0;
    remainingAmount = toNumber(loan.amount);
    nextPaymentDate = null;
    overdueDays = 0;
  } else if (loan.installments.length > 0 && loan.installments.every((installment: any) => installment.status === 'PAID')) {
    status = 'PAID_OFF';
    nextPaymentDate = null;
    overdueDays = 0;
  } else if (loan.installments.some((installment: any) => installment.status === 'OVERDUE')) {
    status = 'DELINQUENT';
  } else if (loan.installments.length > 0) {
    status = 'ACTIVE';
  }

  const updatedLoan = await prisma.loan.update({
    where: { id: loanId },
    data: {
      status,
      paidAmount,
      remainingAmount,
      nextPaymentDate,
      overdueDays,
    },
    include: {
      client: true,
      branch: true,
      saleInvoice: {
        select: {
          id: true,
          number: true,
          balance: true,
          total: true,
          issueDate: true,
          dueDate: true,
        },
      },
      approvedBy: {
        select: {
          name: true,
        },
      },
      installments: {
        orderBy: { installmentNo: 'asc' },
      },
    },
  });

  return updatedLoan;
};

const refreshInstallmentStatuses = async (prisma: any, loanId: string) => {
  const installments = await prisma.loanInstallment.findMany({
    where: { loanId },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const installment of installments) {
    const totalDue = toNumber(installment.totalAmount) + toNumber(installment.lateFeeAmount);
    const paid = toNumber(installment.paidAmount);
    let status: 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE' = 'PENDING';

    if (paid >= totalDue) {
      status = 'PAID';
    } else if (paid > 0) {
      status = 'PARTIAL';
    } else {
      const dueDate = new Date(installment.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      status = dueDate < today ? 'OVERDUE' : 'PENDING';
    }

    if (status !== installment.status) {
      await prisma.loanInstallment.update({
        where: { id: installment.id },
        data: {
          status,
          paidAt: status === 'PAID' ? installment.paidAt || new Date() : installment.paidAt,
        },
      });
    }
  }
};

const findOpenCashRegister = async (prisma: any, branchId?: string | null) => {
  if (!branchId) {
    return null;
  }

  return prisma.cashRegister.findFirst({
    where: {
      branchId,
      status: 'OPEN',
    },
    orderBy: { openedAt: 'desc' },
  });
};

const getInstallmentStatus = (
  installment: {
    dueDate: Date;
    totalAmount: any;
    lateFeeAmount: any;
  },
  paidAmount: number
): 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE' => {
  const totalDue = toNumber(installment.totalAmount) + toNumber(installment.lateFeeAmount);
  if (paidAmount >= totalDue) {
    return 'PAID';
  }

  if (paidAmount > 0) {
    return 'PARTIAL';
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(installment.dueDate);
  dueDate.setHours(0, 0, 0, 0);

  return dueDate < today ? 'OVERDUE' : 'PENDING';
};

const mapLoan = (loan: any) => ({
  id: loan.id,
  number: loan.number,
  client: loan.client
    ? {
        id: loan.client.id,
        name: loan.client.name,
        email: loan.client.email,
        phone: loan.client.phone,
      }
    : null,
  branch: loan.branch
    ? {
        id: loan.branch.id,
        name: loan.branch.name,
      }
    : null,
  amount: toNumber(loan.amount),
  interestRate: toNumber(loan.interestRate),
  termMonths: loan.termMonths,
  paymentFrequency: loan.paymentFrequency,
  productType: loan.productType,
  startDate: loan.startDate,
  firstPaymentDate: loan.firstPaymentDate,
  endDate: loan.endDate,
  status: loan.status,
  purpose: loan.purpose,
  collateral: loan.collateral,
  guarantee: loan.guarantee,
  notes: loan.notes,
  approvedAt: loan.approvedAt,
  createdAt: loan.createdAt,
  updatedAt: loan.updatedAt,
  paidAmount: toNumber(loan.paidAmount),
  remainingAmount: toNumber(loan.remainingAmount),
  nextPaymentDate: loan.nextPaymentDate,
  overdueDays: loan.overdueDays,
  approvedBy: loan.approvedBy?.name || null,
  saleInvoice: loan.saleInvoice
    ? {
        id: loan.saleInvoice.id,
        number: loan.saleInvoice.number,
        balance: toNumber(loan.saleInvoice.balance),
        total: toNumber(loan.saleInvoice.total),
        issueDate: loan.saleInvoice.issueDate,
        dueDate: loan.saleInvoice.dueDate,
      }
    : null,
});

const mapInstallmentForUi = (installment: any, receiptUrl?: string | null) => {
  const latestPayment = installment.payments?.[0];

  return {
    id: installment.id,
    paymentId: latestPayment?.id || null,
    paymentNumber: installment.installmentNo,
    dueDate: installment.dueDate,
    principalAmount: toNumber(installment.principalAmount),
    interestAmount: toNumber(installment.interestAmount),
    totalAmount: toNumber(installment.totalAmount) + toNumber(installment.lateFeeAmount),
    paidAmount: toNumber(installment.paidAmount),
    paidAt: installment.paidAt || latestPayment?.paymentDate || null,
    paymentMethod: latestPayment?.method || null,
    receiptUrl: receiptUrl || null,
    status: installment.status,
    lateFee: toNumber(installment.lateFeeAmount),
    notes: latestPayment?.observations || null,
  };
};

export const getLoans = async (req: AuthRequest, res: Response) => {
  try {
    const prisma = req.tenantPrisma || getTenantPrisma(process.env.DATABASE_URL!);
    const { status, clientId } = req.query;

    const where: any = {};
    if (status) where.status = status;
    if (clientId) where.clientId = clientId;

    const loans = await prisma.loan.findMany({
      where,
      include: {
        client: true,
        branch: true,
        saleInvoice: {
          select: {
            id: true,
            number: true,
            balance: true,
            total: true,
            issueDate: true,
            dueDate: true,
          },
        },
        approvedBy: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    for (const loan of loans) {
      await refreshInstallmentStatuses(prisma, loan.id);
      await recalculateLoanState(prisma, loan.id);
    }

    const refreshedLoans = await prisma.loan.findMany({
      where,
      include: {
        client: true,
        branch: true,
        saleInvoice: {
          select: {
            id: true,
            number: true,
            balance: true,
            total: true,
            issueDate: true,
            dueDate: true,
          },
        },
        approvedBy: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: refreshedLoans.map(mapLoan),
      total: refreshedLoans.length,
    });
  } catch (error) {
    console.error('Error fetching loans:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Error al obtener préstamos',
        code: 'LOANS_FETCH_ERROR',
      },
    });
  }
};

export const getLoan = async (req: AuthRequest, res: Response) => {
  try {
    const prisma = req.tenantPrisma || getTenantPrisma(process.env.DATABASE_URL!);
    const { id } = req.params;

    await refreshInstallmentStatuses(prisma, id);
    const loan = await recalculateLoanState(prisma, id);

    if (!loan) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Préstamo no encontrado',
          code: 'LOAN_NOT_FOUND',
        },
      });
    }

    res.json({
      success: true,
      data: mapLoan(loan),
    });
  } catch (error) {
    console.error('Error fetching loan:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Error al obtener préstamo',
        code: 'LOAN_FETCH_ERROR',
      },
    });
  }
};

export const createLoan = async (req: AuthRequest, res: Response) => {
  try {
    const prisma = req.tenantPrisma || getTenantPrisma(process.env.DATABASE_URL!);
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'No autenticado',
          code: 'UNAUTHORIZED',
        },
      });
    }

    const data = loanSchema.parse(req.body);

    const client = await prisma.client.findUnique({
      where: { id: data.clientId },
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Cliente no encontrado',
          code: 'CLIENT_NOT_FOUND',
        },
      });
    }

    if (data.branchId) {
      const branch = await prisma.branch.findUnique({
        where: { id: data.branchId },
      });

      if (!branch) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Sucursal no encontrada',
            code: 'BRANCH_NOT_FOUND',
          },
        });
      }
    }

    const startDate = new Date(data.startDate);
    const schedule = buildSchedule(
      data.amount,
      data.interestRate,
      data.termMonths,
      data.paymentFrequency,
      startDate
    );

    const number = await getLoanNumber(prisma);

    const loan = await prisma.loan.create({
      data: {
        number,
        clientId: data.clientId,
        branchId: data.branchId || req.user.branchId || null,
        requestedById: req.user.id,
        amount: data.amount,
        interestRate: data.interestRate,
        termMonths: data.termMonths,
        paymentFrequency: data.paymentFrequency,
        startDate,
        firstPaymentDate: schedule[0].dueDate,
        endDate: schedule[schedule.length - 1].dueDate,
        purpose: data.purpose,
        collateral: data.collateral || null,
        guarantee: data.guarantee || null,
        notes: data.notes || null,
        status: 'PENDING',
        paidAmount: 0,
        remainingAmount: data.amount,
      },
      include: {
        client: true,
        branch: true,
        approvedBy: {
          select: { name: true },
        },
      },
    });

    await createLoanLedgerEntry(prisma, loan.id, 'CREATED', {
      amount: data.amount,
      notes: data.notes || 'Solicitud de prestamo creada',
      metadata: {
        branchId: loan.branch?.id || null,
        clientId: loan.client.id,
        paymentFrequency: data.paymentFrequency,
        termMonths: data.termMonths,
      },
      userId: req.user.id,
    });

    res.status(201).json({
      success: true,
      data: mapLoan(loan),
      message: 'Préstamo creado exitosamente',
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Datos inválidos',
          code: 'VALIDATION_ERROR',
          details: error.errors,
        },
      });
    }

    console.error('Error creating loan:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Error al crear préstamo',
        code: 'LOAN_CREATE_ERROR',
      },
    });
  }
};

export const updateLoan = async (req: AuthRequest, res: Response) => {
  try {
    const prisma = req.tenantPrisma || getTenantPrisma(process.env.DATABASE_URL!);
    const { id } = req.params;
    const data = loanSchema.partial().parse(req.body);

    const existingLoan = await prisma.loan.findUnique({
      where: { id },
      include: {
        installments: true,
      },
    });

    if (!existingLoan) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Préstamo no encontrado',
          code: 'LOAN_NOT_FOUND',
        },
      });
    }

    if (existingLoan.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Solo se pueden editar préstamos pendientes',
          code: 'LOAN_INVALID_STATUS',
        },
      });
    }

    const updatedLoan = await prisma.loan.update({
      where: { id },
      data: {
        clientId: data.clientId,
        branchId: data.branchId === undefined ? undefined : data.branchId || null,
        amount: data.amount,
        interestRate: data.interestRate,
        termMonths: data.termMonths,
        paymentFrequency: data.paymentFrequency,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        purpose: data.purpose,
        collateral: data.collateral === undefined ? undefined : data.collateral || null,
        guarantee: data.guarantee === undefined ? undefined : data.guarantee || null,
        notes: data.notes === undefined ? undefined : data.notes || null,
        remainingAmount: data.amount ?? undefined,
      },
      include: {
        client: true,
        branch: true,
        approvedBy: {
          select: { name: true },
        },
      },
    });

    res.json({
      success: true,
      data: mapLoan(updatedLoan),
      message: 'Préstamo actualizado exitosamente',
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Datos inválidos',
          code: 'VALIDATION_ERROR',
          details: error.errors,
        },
      });
    }

    console.error('Error updating loan:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Error al actualizar préstamo',
        code: 'LOAN_UPDATE_ERROR',
      },
    });
  }
};

export const deleteLoan = async (req: AuthRequest, res: Response) => {
  try {
    const prisma = req.tenantPrisma || getTenantPrisma(process.env.DATABASE_URL!);
    const { id } = req.params;

    const loan = await prisma.loan.findUnique({
      where: { id },
      include: {
        payments: true,
      },
    });

    if (!loan) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Préstamo no encontrado',
          code: 'LOAN_NOT_FOUND',
        },
      });
    }

    if (loan.payments.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'No se puede eliminar un préstamo con pagos registrados',
          code: 'LOAN_HAS_PAYMENTS',
        },
      });
    }

    await prisma.loan.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Préstamo eliminado exitosamente',
    });
  } catch (error) {
    console.error('Error deleting loan:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Error al eliminar préstamo',
        code: 'LOAN_DELETE_ERROR',
      },
    });
  }
};

export const approveLoan = async (req: AuthRequest, res: Response) => {
  try {
    const prisma = req.tenantPrisma || getTenantPrisma(process.env.DATABASE_URL!);
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'No autenticado',
          code: 'UNAUTHORIZED',
        },
      });
    }

    const { id } = req.params;
    const loan = await prisma.loan.findUnique({
      where: { id },
    });

    if (!loan) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Préstamo no encontrado',
          code: 'LOAN_NOT_FOUND',
        },
      });
    }

    if (!['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'PENDING'].includes(loan.status)) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Solo se pueden aprobar préstamos pendientes',
          code: 'LOAN_INVALID_STATUS',
        },
      });
    }

    const existingInstallments = await prisma.loanInstallment.count({
      where: { loanId: id },
    });

    if (existingInstallments > 0) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'El préstamo ya tiene cronograma generado',
          code: 'LOAN_ALREADY_APPROVED',
        },
      });
    }

    const schedule = buildSchedule(
      toNumber(loan.amount),
      toNumber(loan.interestRate),
      loan.termMonths,
      loan.paymentFrequency,
      new Date(loan.startDate)
    );

    await prisma.$transaction(async (tx: any) => {
      await tx.loan.update({
        where: { id },
        data: {
          status: 'APPROVED',
          approvedById: req.user!.id,
          approvedAt: new Date(),
          firstPaymentDate: schedule[0].dueDate,
          endDate: schedule[schedule.length - 1].dueDate,
          nextPaymentDate: null,
          installmentAmount: schedule[0].totalAmount,
          projectedInterest: roundMoney(schedule.reduce((sum, installment) => sum + installment.interestAmount, 0)),
          remainingAmount: toNumber(loan.amount),
        },
      });

      await tx.loanInstallment.createMany({
        data: schedule.map((installment) => ({
          loanId: id,
          installmentNo: installment.installmentNo,
          dueDate: installment.dueDate,
          openingBalance: installment.openingBalance,
          principalAmount: installment.principalAmount,
          interestAmount: installment.interestAmount,
          totalAmount: installment.totalAmount,
          paidAmount: 0,
          lateFeeAmount: 0,
          status: 'PENDING',
          pendingAmount: installment.totalAmount,
        })),
      });

      await createLoanLedgerEntry(tx, id, 'APPROVED', {
        amount: toNumber(loan.amount),
        notes: 'Prestamo aprobado y cronograma generado',
        metadata: {
          installments: schedule.length,
        },
        userId: req.user!.id,
      });
    });

    await refreshInstallmentStatuses(prisma, id);
    const updatedLoan = await recalculateLoanState(prisma, id);

    res.json({
      success: true,
      data: mapLoan(updatedLoan),
      message: 'Préstamo aprobado exitosamente',
    });
  } catch (error) {
    console.error('Error approving loan:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Error al aprobar préstamo',
        code: 'LOAN_APPROVE_ERROR',
      },
    });
  }
};

export const rejectLoan = async (req: AuthRequest, res: Response) => {
  try {
    const prisma = req.tenantPrisma || getTenantPrisma(process.env.DATABASE_URL!);
    const { id } = req.params;

    const loan = await prisma.loan.findUnique({
      where: { id },
    });

    if (!loan) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Préstamo no encontrado',
          code: 'LOAN_NOT_FOUND',
        },
      });
    }

    if (!['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'PENDING'].includes(loan.status)) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Solo se pueden rechazar préstamos pendientes',
          code: 'LOAN_INVALID_STATUS',
        },
      });
    }

    const updatedLoan = await prisma.loan.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectedAt: new Date(),
        rejectedById: req.user?.id || null,
        nextPaymentDate: null,
      },
      include: {
        client: true,
        branch: true,
        approvedBy: {
          select: { name: true },
        },
      },
    });

    await createLoanLedgerEntry(prisma, id, 'REJECTED', {
      amount: toNumber(loan.amount),
      notes: 'Prestamo rechazado',
      userId: req.user?.id || null,
    });

    res.json({
      success: true,
      data: mapLoan(updatedLoan),
      message: 'Préstamo rechazado exitosamente',
    });
  } catch (error) {
    console.error('Error rejecting loan:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Error al rechazar préstamo',
        code: 'LOAN_REJECT_ERROR',
      },
    });
  }
};

export const cancelLoan = async (req: AuthRequest, res: Response) => {
  try {
    const prisma = req.tenantPrisma || getTenantPrisma(process.env.DATABASE_URL!);
    const { id } = req.params;

    const loan = await prisma.loan.findUnique({
      where: { id },
      include: {
        payments: true,
      },
    });

    if (!loan) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Préstamo no encontrado',
          code: 'LOAN_NOT_FOUND',
        },
      });
    }

    if (!['PENDING', 'APPROVED', 'ACTIVE', 'DELINQUENT'].includes(loan.status)) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'El préstamo no puede cancelarse en su estado actual',
          code: 'LOAN_INVALID_STATUS',
        },
      });
    }

    if (loan.payments.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'No se puede cancelar un préstamo con pagos registrados',
          code: 'LOAN_HAS_PAYMENTS',
        },
      });
    }

    const updatedLoan = await prisma.loan.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelledById: req.user?.id || null,
        nextPaymentDate: null,
        overdueDays: 0,
      },
      include: {
        client: true,
        branch: true,
        approvedBy: {
          select: { name: true },
        },
      },
    });

    await prisma.loanInstallment.updateMany({
      where: { loanId: id },
      data: {
        status: 'PENDING',
      },
    });

    await createLoanLedgerEntry(prisma, id, 'CANCELLED', {
      amount: toNumber(loan.remainingAmount),
      notes: 'Prestamo cancelado',
      userId: req.user?.id || null,
    });

    res.json({
      success: true,
      data: mapLoan(updatedLoan),
      message: 'Préstamo cancelado exitosamente',
    });
  } catch (error) {
    console.error('Error cancelling loan:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Error al cancelar préstamo',
        code: 'LOAN_CANCEL_ERROR',
      },
    });
  }
};

export const disburseLoan = async (req: AuthRequest, res: Response) => {
  try {
    const prisma = req.tenantPrisma || getTenantPrisma(process.env.DATABASE_URL!);
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'No autenticado',
          code: 'UNAUTHORIZED',
        },
      });
    }

    const { id } = req.params;
    const data = disbursementSchema.parse(req.body);

    const loan = await prisma.loan.findUnique({
      where: { id },
      include: {
        installments: true,
        client: true,
        branch: true,
      },
    });

    if (!loan) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Préstamo no encontrado',
          code: 'LOAN_NOT_FOUND',
        },
      });
    }

    if (loan.status !== 'APPROVED') {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Solo se pueden desembolsar préstamos aprobados',
          code: 'LOAN_INVALID_STATUS',
        },
      });
    }

    const disbursementAmount = roundMoney(data.amount ?? toNumber(loan.amount));
    const disbursementDate = data.disbursementDate ? new Date(data.disbursementDate) : new Date();

    const updatedLoan = await prisma.$transaction(async (tx: any) => {
      let cashRegisterId: string | null = null;

      if (data.method === 'CASH') {
        const cashRegister = await findOpenCashRegister(tx, loan.branchId || req.user!.branchId);

        if (!cashRegister) {
          throw new Error('OPEN_CASH_REGISTER_REQUIRED');
        }

        cashRegisterId = cashRegister.id;

        await tx.cashMovement.create({
          data: {
            cashRegisterId,
            type: 'MANUAL_EXIT',
            concept: `Desembolso préstamo ${loan.number}`,
            amount: disbursementAmount,
            method: data.method,
            userId: req.user!.id,
            movementDate: disbursementDate,
            observations: data.observations || data.reference || null,
          },
        });
      }

      const nextLoan = await tx.loan.update({
        where: { id },
        data: {
          status: 'ACTIVE',
          disbursedAt: disbursementDate,
          disbursementDate,
          disbursedById: req.user!.id,
          nextPaymentDate: loan.firstPaymentDate,
        },
        include: {
          client: true,
          branch: true,
          approvedBy: {
            select: { name: true },
          },
        },
      });

      await createLoanLedgerEntry(tx, id, 'DISBURSED', {
        amount: disbursementAmount,
        notes: 'Prestamo desembolsado',
        metadata: {
          method: data.method,
          reference: data.reference || null,
          cashRegisterId,
        },
        userId: req.user!.id,
      });

      return nextLoan;
    });

    const company = await getCompanyProfile(prisma);

    const receipt = generateLoanDisbursementReceiptPdf({
      company,
      loanNumber: loan.number,
      clientName: loan.client.name,
      branchName: loan.branch?.name || null,
      disbursementDate,
      method: data.method,
      reference: data.reference || null,
      amount: disbursementAmount,
      userName: req.user.email,
    });

    const emailSent = await trySendLoanEmail({
      to: loan.client.email,
      clientName: loan.client.name,
      subject: `Comprobante de desembolso ${loan.number}`,
      title: 'Comprobante de desembolso de prestamo',
      summaryLines: [
        `Prestamo: ${loan.number}`,
        `Monto desembolsado: ${disbursementAmount.toFixed(2)} DOP`,
        `Metodo: ${data.method}`,
      ],
      attachmentPath: receipt.filePath,
      attachmentName: receipt.fileName,
    });

    const whatsappSent = await trySendLoanWhatsApp({
      to: loan.client.phone,
      subject: 'Comprobante de desembolso',
      message: [
        `Hola ${loan.client.name},`,
        `Tu prestamo ${loan.number} fue desembolsado por ${disbursementAmount.toFixed(2)} DOP.`,
        `Comprobante: ${buildPublicFileUrl(req, receipt.fileUrl)}`,
      ].join('\n'),
    });

    await createLoanDocumentRecord(prisma, {
      loanId: loan.id,
      type: 'DISBURSEMENT_RECEIPT',
      fileName: receipt.fileName,
      fileUrl: receipt.fileUrl,
      sentEmailAt: emailSent ? new Date() : null,
      sentWhatsAppAt: whatsappSent ? new Date() : null,
    });

    res.json({
      success: true,
      data: {
        ...mapLoan(updatedLoan),
        disbursementReceiptUrl: buildPublicFileUrl(req, receipt.fileUrl),
        disbursementReceiptSentByEmail: emailSent,
        disbursementReceiptSentByWhatsApp: whatsappSent,
      },
      message: 'Préstamo desembolsado exitosamente',
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Datos inválidos',
          code: 'VALIDATION_ERROR',
          details: error.errors,
        },
      });
    }

    if (error.message === 'OPEN_CASH_REGISTER_REQUIRED') {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Debe haber una caja abierta para desembolsar en efectivo',
          code: 'OPEN_CASH_REGISTER_REQUIRED',
        },
      });
    }

    console.error('Error disbursing loan:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Error al desembolsar préstamo',
        code: 'LOAN_DISBURSE_ERROR',
      },
    });
  }
};

export const getLoanPayments = async (req: AuthRequest, res: Response) => {
  try {
    const prisma = req.tenantPrisma || getTenantPrisma(process.env.DATABASE_URL!);
    const { loanId } = req.params;

    await refreshInstallmentStatuses(prisma, loanId);
    await recalculateLoanState(prisma, loanId);

    const installments = await prisma.loanInstallment.findMany({
      where: { loanId },
      include: {
        payments: {
          where: {
            status: 'POSTED',
          },
          include: {
            documents: {
              where: {
                type: 'PAYMENT_RECEIPT',
              },
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
          orderBy: { paymentDate: 'desc' },
        },
      },
      orderBy: { installmentNo: 'asc' },
    });

    res.json({
      success: true,
      data: installments.map((installment) => {
        const latestReceipt = installment.payments?.[0]?.documents?.[0];
        return mapInstallmentForUi(
          installment,
          latestReceipt?.fileUrl ? buildPublicFileUrl(req, latestReceipt.fileUrl) : null
        );
      }),
    });
  } catch (error) {
    console.error('Error fetching loan payments:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Error al obtener pagos del préstamo',
        code: 'LOAN_PAYMENTS_FETCH_ERROR',
      },
    });
  }
};

export const createLoanPayment = async (req: AuthRequest, res: Response) => {
  try {
    const prisma = req.tenantPrisma || getTenantPrisma(process.env.DATABASE_URL!);
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'No autenticado',
          code: 'UNAUTHORIZED',
        },
      });
    }

    const { loanId } = req.params;
    const data = paymentSchema.parse(req.body);

    const loan = await prisma.loan.findUnique({
      where: { id: loanId },
      include: {
        installments: true,
        client: true,
        branch: true,
      },
    });

    if (!loan) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Préstamo no encontrado',
          code: 'LOAN_NOT_FOUND',
        },
      });
    }

    if (!['ACTIVE', 'DELINQUENT'].includes(loan.status)) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Solo se pueden cobrar préstamos activos o en mora',
          code: 'LOAN_INVALID_STATUS',
        },
      });
    }

    const installment = await prisma.loanInstallment.findUnique({
      where: { id: data.installmentId },
    });

    if (!installment || installment.loanId !== loanId) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Cuota no encontrada',
          code: 'INSTALLMENT_NOT_FOUND',
        },
      });
    }

    const totalDue = toNumber(installment.totalAmount) + toNumber(installment.lateFeeAmount);
    const outstanding = Math.max(0, totalDue - toNumber(installment.paidAmount));

    if (outstanding <= 0) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'La cuota ya está saldada',
          code: 'INSTALLMENT_ALREADY_PAID',
        },
      });
    }

    if (data.amount > outstanding) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'El monto excede el saldo pendiente de la cuota',
          code: 'PAYMENT_EXCEEDS_BALANCE',
        },
      });
    }

    const interestOutstanding = Math.max(0, toNumber(installment.interestAmount) - Math.min(toNumber(installment.paidAmount), toNumber(installment.interestAmount)));
    const amountForInterest = Math.min(data.amount, interestOutstanding);
    const amountForPrincipal = data.amount - amountForInterest;
    const paymentDate = data.paymentDate ? new Date(data.paymentDate) : new Date();
    const previousBalance = toNumber(loan.remainingAmount);

    const payment = await prisma.$transaction(async (tx: any) => {
      let cashRegisterId: string | null = null;

      if (data.method === 'CASH') {
        const cashRegister = await findOpenCashRegister(tx, loan.branchId || req.user!.branchId);

        if (!cashRegister) {
          throw new Error('OPEN_CASH_REGISTER_REQUIRED');
        }

        cashRegisterId = cashRegister.id;
      }

      const createdPayment = await tx.loanPayment.create({
        data: {
          loanId,
          clientId: loan.clientId,
          branchId: loan.branchId || req.user!.branchId || null,
          cashRegisterId,
          installmentId: installment.id,
          amount: data.amount,
          principalAmount: amountForPrincipal,
          interestAmount: amountForInterest,
          lateFeeAmount: 0,
          feeAmount: 0,
          previousBalance,
          newBalance: roundMoney(Math.max(0, previousBalance - data.amount)),
          receiptNumber: getReceiptNumber(),
          paymentDate,
          method: data.method,
          reference: data.reference || null,
          observations: data.observations || null,
          status: 'POSTED',
          userId: req.user!.id,
        },
      });

      const newPaidAmount = toNumber(installment.paidAmount) + data.amount;
      const newStatus = newPaidAmount >= totalDue
        ? 'PAID'
        : newPaidAmount > 0
          ? 'PARTIAL'
          : 'PENDING';

      await tx.loanInstallment.update({
        where: { id: installment.id },
        data: {
          paidAmount: newPaidAmount,
          pendingAmount: Math.max(0, totalDue - newPaidAmount),
          paidPrincipal: toNumber(installment.paidPrincipal) + amountForPrincipal,
          paidInterest: toNumber(installment.paidInterest) + amountForInterest,
          status: newStatus,
          paidAt: newStatus === 'PAID' ? paymentDate : installment.paidAt,
        },
      });

      await tx.loanPaymentAllocation.createMany({
        data: [
          ...(amountForInterest > 0 ? [{
            loanPaymentId: createdPayment.id,
            loanInstallmentId: installment.id,
            concept: 'INTEREST',
            amount: amountForInterest,
          }] : []),
          ...(amountForPrincipal > 0 ? [{
            loanPaymentId: createdPayment.id,
            loanInstallmentId: installment.id,
            concept: 'PRINCIPAL',
            amount: amountForPrincipal,
          }] : []),
        ],
      });

      if (cashRegisterId) {
        await tx.cashMovement.create({
          data: {
            cashRegisterId,
            type: 'PAYMENT',
            concept: `Cobro cuota préstamo ${loan.number} #${installment.installmentNo}`,
            amount: data.amount,
            method: data.method,
            paymentId: createdPayment.id,
            userId: req.user!.id,
            movementDate: paymentDate,
            observations: data.observations || null,
          },
        });
      }

      await createLoanLedgerEntry(tx, loanId, 'PAYMENT_POSTED', {
        amount: data.amount,
        notes: `Pago registrado para cuota ${installment.installmentNo}`,
        metadata: {
          installmentId: installment.id,
          method: data.method,
          receiptNumber: createdPayment.receiptNumber,
        },
        userId: req.user!.id,
      });

      return createdPayment;
    });

    const company = await getCompanyProfile(prisma);

    const receipt = generateLoanPaymentReceiptPdf({
      company,
      loanNumber: loan.number,
      clientName: loan.client?.name || 'Cliente',
      branchName: loan.branch?.name || null,
      receiptNumber: payment.receiptNumber || getReceiptNumber(),
      paymentDate,
      method: data.method,
      reference: data.reference || null,
      previousBalance,
      paymentAmount: data.amount,
      newBalance: roundMoney(Math.max(0, previousBalance - data.amount)),
      principalAmount: amountForPrincipal,
      interestAmount: amountForInterest,
      lateFeeAmount: 0,
      feeAmount: 0,
      installmentNo: installment.installmentNo,
      userName: req.user.email,
    });

    const emailSent = await trySendLoanEmail({
      to: loan.client?.email,
      clientName: loan.client?.name || 'Cliente',
      subject: `Comprobante de pago ${loan.number}`,
      title: 'Comprobante de pago de prestamo',
      summaryLines: [
        `Prestamo: ${loan.number}`,
        `Recibo: ${payment.receiptNumber}`,
        `Monto pagado: ${data.amount.toFixed(2)} DOP`,
        `Saldo nuevo: ${roundMoney(Math.max(0, previousBalance - data.amount)).toFixed(2)} DOP`,
      ],
      attachmentPath: receipt.filePath,
      attachmentName: receipt.fileName,
    });

    const whatsappSent = await trySendLoanWhatsApp({
      to: loan.client?.phone,
      subject: 'Comprobante de pago',
      message: [
        `Hola ${loan.client?.name || 'cliente'},`,
        `Recibimos tu pago de ${data.amount.toFixed(2)} DOP para el prestamo ${loan.number}.`,
        `Comprobante: ${buildPublicFileUrl(req, receipt.fileUrl)}`,
      ].join('\n'),
    });

    await createLoanDocumentRecord(prisma, {
      loanId,
      loanPaymentId: payment.id,
      type: 'PAYMENT_RECEIPT',
      fileName: receipt.fileName,
      fileUrl: receipt.fileUrl,
      sentEmailAt: emailSent ? new Date() : null,
      sentWhatsAppAt: whatsappSent ? new Date() : null,
    });

    await refreshInstallmentStatuses(prisma, loanId);
    await recalculateLoanState(prisma, loanId);

    res.status(201).json({
      success: true,
      data: {
        ...payment,
        receiptUrl: buildPublicFileUrl(req, receipt.fileUrl),
        sentByEmail: emailSent,
        sentByWhatsApp: whatsappSent,
      },
      message: 'Pago registrado exitosamente',
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Datos inválidos',
          code: 'VALIDATION_ERROR',
          details: error.errors,
        },
      });
    }

    if (error.message === 'OPEN_CASH_REGISTER_REQUIRED') {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Debe haber una caja abierta para registrar pagos en efectivo',
          code: 'OPEN_CASH_REGISTER_REQUIRED',
        },
      });
    }

    console.error('Error creating loan payment:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Error al registrar pago del préstamo',
        code: 'LOAN_PAYMENT_CREATE_ERROR',
      },
    });
  }
};

export const updateLoanPayment = async (_req: AuthRequest, res: Response) => {
  res.status(501).json({
    success: false,
    error: {
      message: 'La edición de pagos de préstamos no está habilitada todavía',
      code: 'NOT_IMPLEMENTED',
    },
  });
};

export const reverseLoanPayment = async (req: AuthRequest, res: Response) => {
  try {
    const prisma = req.tenantPrisma || getTenantPrisma(process.env.DATABASE_URL!);
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'No autenticado',
          code: 'UNAUTHORIZED',
        },
      });
    }

    const { loanId, paymentId } = req.params;
    const data = reversePaymentSchema.parse(req.body);

    const payment = await prisma.loanPayment.findUnique({
      where: { id: paymentId },
      include: {
        loan: true,
        installment: true,
        allocations: true,
      },
    });

    if (!payment || payment.loanId !== loanId) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Pago no encontrado',
          code: 'LOAN_PAYMENT_NOT_FOUND',
        },
      });
    }

    if (payment.status === 'REVERSED') {
      return res.status(400).json({
        success: false,
        error: {
          message: 'El pago ya fue revertido',
          code: 'LOAN_PAYMENT_ALREADY_REVERSED',
        },
      });
    }

    const reversedPayment = await prisma.$transaction(async (tx: any) => {
      const installmentPaidAmount = roundMoney(toNumber(payment.installment.paidAmount) - toNumber(payment.amount));
      const installmentPaidPrincipal = roundMoney(toNumber(payment.installment.paidPrincipal) - toNumber(payment.principalAmount));
      const installmentPaidInterest = roundMoney(toNumber(payment.installment.paidInterest) - toNumber(payment.interestAmount));
      const installmentPaidLateFees = roundMoney(toNumber(payment.installment.paidLateFees) - toNumber(payment.lateFeeAmount));
      const installmentPaidFees = roundMoney(toNumber(payment.installment.paidFees) - toNumber(payment.feeAmount));
      const installmentStatus = getInstallmentStatus(payment.installment, Math.max(0, installmentPaidAmount));
      const totalDue = toNumber(payment.installment.totalAmount) + toNumber(payment.installment.lateFeeAmount);

      await tx.loanInstallment.update({
        where: { id: payment.installmentId },
        data: {
          paidAmount: Math.max(0, installmentPaidAmount),
          paidPrincipal: Math.max(0, installmentPaidPrincipal),
          paidInterest: Math.max(0, installmentPaidInterest),
          paidLateFees: Math.max(0, installmentPaidLateFees),
          paidFees: Math.max(0, installmentPaidFees),
          pendingAmount: Math.max(0, totalDue - Math.max(0, installmentPaidAmount)),
          status: installmentStatus,
          paidAt: installmentStatus === 'PAID'
            ? payment.installment.paidAt
            : installmentStatus === 'PARTIAL'
              ? null
              : null,
        },
      });

      const updatedPayment = await tx.loanPayment.update({
        where: { id: paymentId },
        data: {
          status: 'REVERSED',
          reversedAt: new Date(),
          reversedById: req.user!.id,
          reversalReason: data.reason,
        },
      });

      if (payment.method === 'CASH' && payment.cashRegisterId) {
        await tx.cashMovement.create({
          data: {
            cashRegisterId: payment.cashRegisterId,
            type: 'MANUAL_EXIT',
            concept: `Reverso pago préstamo ${payment.loan.number}`,
            amount: toNumber(payment.amount),
            method: payment.method,
            paymentId: payment.id,
            userId: req.user!.id,
            movementDate: new Date(),
            observations: data.reason,
          },
        });
      }

      await createLoanLedgerEntry(tx, loanId, 'PAYMENT_REVERSED', {
        amount: toNumber(payment.amount),
        notes: `Pago revertido: ${data.reason}`,
        metadata: {
          paymentId: payment.id,
          receiptNumber: payment.receiptNumber,
        },
        userId: req.user!.id,
      });

      return updatedPayment;
    });

    await refreshInstallmentStatuses(prisma, loanId);
    await recalculateLoanState(prisma, loanId);

    res.json({
      success: true,
      data: reversedPayment,
      message: 'Pago revertido exitosamente',
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Datos inválidos',
          code: 'VALIDATION_ERROR',
          details: error.errors,
        },
      });
    }

    console.error('Error reversing loan payment:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Error al revertir pago del préstamo',
        code: 'LOAN_PAYMENT_REVERSE_ERROR',
      },
    });
  }
};

export const sendLoanPaymentReceiptByEmail = async (req: AuthRequest, res: Response) => {
  try {
    const prisma = req.tenantPrisma || getTenantPrisma(process.env.DATABASE_URL!);
    const { loanId, paymentId } = req.params;

    const payment = await prisma.loanPayment.findUnique({
      where: { id: paymentId },
      include: {
        loan: {
          include: {
            client: true,
            branch: true,
          },
        },
        installment: true,
      },
    });

    if (!payment || payment.loanId !== loanId) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Pago no encontrado',
          code: 'LOAN_PAYMENT_NOT_FOUND',
        },
      });
    }

    if (payment.status !== 'POSTED') {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Solo se pueden reenviar pagos vigentes',
          code: 'LOAN_PAYMENT_INVALID_STATUS',
        },
      });
    }

    if (!payment.loan.client.email) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'El cliente no tiene correo electrónico configurado',
          code: 'CLIENT_EMAIL_REQUIRED',
        },
      });
    }

    let document = await prisma.loanDocument.findFirst({
      where: {
        loanId,
        loanPaymentId: paymentId,
        type: 'PAYMENT_RECEIPT',
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!document) {
      const company = await getCompanyProfile(prisma);

      const receipt = generateLoanPaymentReceiptPdf({
        company,
        loanNumber: payment.loan.number,
        clientName: payment.loan.client.name,
        branchName: payment.loan.branch?.name || null,
        receiptNumber: payment.receiptNumber || getReceiptNumber(),
        paymentDate: payment.paymentDate,
        method: payment.method,
        reference: payment.reference || null,
        previousBalance: toNumber(payment.previousBalance),
        paymentAmount: toNumber(payment.amount),
        newBalance: toNumber(payment.newBalance),
        principalAmount: toNumber(payment.principalAmount),
        interestAmount: toNumber(payment.interestAmount),
        lateFeeAmount: toNumber(payment.lateFeeAmount),
        feeAmount: toNumber(payment.feeAmount),
        installmentNo: payment.installment.installmentNo,
        userName: req.user?.email || payment.loan.client.email,
      });

      document = await createLoanDocumentRecord(prisma, {
        loanId,
        loanPaymentId: paymentId,
        type: 'PAYMENT_RECEIPT',
        fileName: receipt.fileName,
        fileUrl: receipt.fileUrl,
      });
    }

    const attachmentPath = path.join(BACKEND_UPLOADS_DIR, document.fileUrl.replace('/uploads/', ''));
    await sendLoanReceiptEmail({
      to: payment.loan.client.email,
      clientName: payment.loan.client.name,
      subject: `Comprobante de pago ${payment.loan.number}`,
      title: 'Comprobante de pago de prestamo',
      summaryLines: [
        `Prestamo: ${payment.loan.number}`,
        `Recibo: ${payment.receiptNumber || document.fileName}`,
        `Monto pagado: ${toNumber(payment.amount).toFixed(2)} DOP`,
        `Saldo nuevo: ${toNumber(payment.newBalance).toFixed(2)} DOP`,
      ],
      attachmentPath,
      attachmentName: document.fileName,
    });

    await prisma.loanDocument.update({
      where: { id: document.id },
      data: {
        sentEmailAt: new Date(),
      },
    });

    res.json({
      success: true,
      message: 'Comprobante enviado por correo exitosamente',
    });
  } catch (error: any) {
    console.error('Error sending loan receipt email:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Error al enviar comprobante por correo',
        code: 'LOAN_RECEIPT_EMAIL_ERROR',
      },
    });
  }
};

export const sendLoanPaymentReceiptByWhatsApp = async (req: AuthRequest, res: Response) => {
  try {
    const prisma = req.tenantPrisma || getTenantPrisma(process.env.DATABASE_URL!);
    const { loanId, paymentId } = req.params;

    const payment = await prisma.loanPayment.findUnique({
      where: { id: paymentId },
      include: {
        loan: {
          include: {
            client: true,
          },
        },
      },
    });

    if (!payment || payment.loanId !== loanId) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Pago no encontrado',
          code: 'LOAN_PAYMENT_NOT_FOUND',
        },
      });
    }

    if (!payment.loan.client.phone) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'El cliente no tiene teléfono configurado',
          code: 'CLIENT_PHONE_REQUIRED',
        },
      });
    }

    const document = await prisma.loanDocument.findFirst({
      where: {
        loanId,
        loanPaymentId: paymentId,
        type: 'PAYMENT_RECEIPT',
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'No existe comprobante generado para este pago',
          code: 'LOAN_RECEIPT_NOT_FOUND',
        },
      });
    }

    const whatsappSent = await trySendLoanWhatsApp({
      to: payment.loan.client.phone,
      subject: 'Comprobante de pago',
      message: [
        `Hola ${payment.loan.client.name},`,
        `Aqui tienes tu comprobante del pago del prestamo ${payment.loan.number}.`,
        `Monto: ${toNumber(payment.amount).toFixed(2)} DOP`,
        `Comprobante: ${buildPublicFileUrl(req, document.fileUrl)}`,
      ].join('\n'),
    });

    if (!whatsappSent) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'No fue posible enviar el comprobante por WhatsApp',
          code: 'WHATSAPP_SEND_FAILED',
        },
      });
    }

    await prisma.loanDocument.update({
      where: { id: document.id },
      data: {
        sentWhatsAppAt: new Date(),
      },
    });

    res.json({
      success: true,
      message: 'Comprobante enviado por WhatsApp exitosamente',
    });
  } catch (error: any) {
    console.error('Error sending loan receipt by WhatsApp:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Error al enviar comprobante por WhatsApp',
        code: 'LOAN_RECEIPT_WHATSAPP_ERROR',
      },
    });
  }
};

export const processLoanPayment = async (req: AuthRequest, res: Response) => {
  return createLoanPayment(req, res);
};

export const getPaymentSchedule = async (req: AuthRequest, res: Response) => {
  return getLoanPayments(req, res);
};

export const getPortfolioReport = async (req: AuthRequest, res: Response) => {
  try {
    const prisma = req.tenantPrisma || getTenantPrisma(process.env.DATABASE_URL!);
    const loans = await prisma.loan.findMany();
    const totalPortfolio = loans.reduce((sum: number, loan: any) => sum + toNumber(loan.remainingAmount), 0);
    const activePortfolio = loans
      .filter((loan: any) => ['ACTIVE', 'DELINQUENT'].includes(loan.status))
      .reduce((sum: number, loan: any) => sum + toNumber(loan.remainingAmount), 0);

    res.json({
      success: true,
      data: {
        totalLoans: loans.length,
        totalPortfolio: roundMoney(totalPortfolio),
        activePortfolio: roundMoney(activePortfolio),
      },
    });
  } catch (error) {
    console.error('Error fetching loan portfolio report:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Error al obtener reporte de cartera',
        code: 'LOAN_REPORT_ERROR',
      },
    });
  }
};

export const getAgingReport = async (req: AuthRequest, res: Response) => {
  try {
    const prisma = req.tenantPrisma || getTenantPrisma(process.env.DATABASE_URL!);
    const installments = await prisma.loanInstallment.findMany({
      where: {
        status: { in: ['OVERDUE', 'PARTIAL'] },
      },
    });

    const today = new Date();
    const aging = { '0-30': 0, '31-60': 0, '61-90': 0, '90+': 0 } as Record<string, number>;

    installments.forEach((installment: any) => {
      const dueDate = new Date(installment.dueDate);
      const days = Math.max(0, Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));
      const balance = Math.max(0, (toNumber(installment.totalAmount) + toNumber(installment.lateFeeAmount)) - toNumber(installment.paidAmount));

      if (days <= 30) aging['0-30'] += balance;
      else if (days <= 60) aging['31-60'] += balance;
      else if (days <= 90) aging['61-90'] += balance;
      else aging['90+'] += balance;
    });

    res.json({
      success: true,
      data: Object.fromEntries(
        Object.entries(aging).map(([bucket, amount]) => [bucket, roundMoney(amount)])
      ),
    });
  } catch (error) {
    console.error('Error fetching loan aging report:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Error al obtener antigüedad de cartera',
        code: 'LOAN_REPORT_ERROR',
      },
    });
  }
};

export const getDelinquencyReport = async (req: AuthRequest, res: Response) => {
  try {
    const prisma = req.tenantPrisma || getTenantPrisma(process.env.DATABASE_URL!);
    const loans = await prisma.loan.findMany({
      where: {
        status: 'DELINQUENT',
      },
      include: {
        client: true,
      },
    });

    res.json({
      success: true,
      data: loans.map(mapLoan),
    });
  } catch (error) {
    console.error('Error fetching loan delinquency report:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Error al obtener morosidad',
        code: 'LOAN_REPORT_ERROR',
      },
    });
  }
};

export const getPerformanceReport = async (req: AuthRequest, res: Response) => {
  try {
    const prisma = req.tenantPrisma || getTenantPrisma(process.env.DATABASE_URL!);
    const loans = await prisma.loan.findMany();
    const total = loans.length;
    const paidOff = loans.filter((loan: any) => loan.status === 'PAID_OFF').length;
    const delinquent = loans.filter((loan: any) => loan.status === 'DELINQUENT').length;

    res.json({
      success: true,
      data: {
        total,
        paidOff,
        delinquent,
        recoveryRate: total > 0 ? Math.round((paidOff / total) * 100) : 0,
      },
    });
  } catch (error) {
    console.error('Error fetching loan performance report:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Error al obtener desempeño de préstamos',
        code: 'LOAN_REPORT_ERROR',
      },
    });
  }
};
