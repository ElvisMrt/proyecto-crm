import { Response } from 'express';
import { InvoiceStatus, CashStatus } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';
import { getTenantPrisma } from '../middleware/tenant.middleware';


export const getSummary = async (req: AuthRequest, res: Response) => {
  try {
    const prisma = req.tenantPrisma || getTenantPrisma(process.env.DATABASE_URL!);
    const branchId = req.query.branchId as string | undefined;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    // Filtro base por sucursal
    const branchFilter = branchId ? { branchId } : {};

    // Ventas del día (solo emitidas, excluyendo anuladas)
    const salesToday = await prisma.invoice.aggregate({
      where: {
        status: InvoiceStatus.ISSUED,
        issueDate: {
          gte: today,
          lt: tomorrow,
        },
        ...branchFilter,
      },
      _sum: {
        total: true,
      },
    });

    // Ventas de ayer para comparación
    const salesYesterday = await prisma.invoice.aggregate({
      where: {
        status: InvoiceStatus.ISSUED,
        issueDate: {
          gte: yesterday,
          lt: today,
        },
        ...branchFilter,
      },
      _sum: {
        total: true,
      },
    });

    const yesterdayAmount = Number(salesYesterday._sum.total || 0);
    const todayAmount = Number(salesToday._sum.total || 0);
    const trend = yesterdayAmount > 0 
      ? ((todayAmount - yesterdayAmount) / yesterdayAmount) * 100 
      : 0;

    // Ventas del mes
    const salesMonth = await prisma.invoice.aggregate({
      where: {
        status: InvoiceStatus.ISSUED,
        issueDate: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
        ...branchFilter,
      },
      _sum: {
        total: true,
      },
    });

    const daysInMonth = endOfMonth.getDate();
    const currentDay = today.getDate();
    const monthProgress = (currentDay / daysInMonth) * 100;

    // Cuentas por cobrar (facturas a crédito con saldo > 0)
    const receivables = await prisma.invoice.aggregate({
      where: {
        status: { in: [InvoiceStatus.ISSUED, InvoiceStatus.OVERDUE] },
        balance: {
          gt: 0,
        },
        paymentMethod: 'CREDIT',
        ...branchFilter,
      },
      _sum: {
        balance: true,
      },
      _count: {
        id: true,
      },
    });

    // Cuentas por pagar (facturas de proveedores con saldo > 0)
    const payables = await prisma.supplierInvoice.aggregate({
      where: {
        balance: { gt: 0 },
        status: { in: ['PENDING', 'PARTIAL'] }
      },
      _sum: {
        balance: true
      }
    });

    // Facturas de proveedores vencidas
    const overduePayables = await prisma.supplierInvoice.count({
      where: {
        balance: { gt: 0 },
        dueDate: { lt: today },
        status: { in: ['PENDING', 'PARTIAL'] }
      }
    });

    // Facturas vencidas (dueDate < hoy y saldo > 0)
    const overdueInvoices = await prisma.invoice.findMany({
      where: {
        status: { in: [InvoiceStatus.ISSUED, InvoiceStatus.OVERDUE] },
        balance: {
          gt: 0,
        },
        dueDate: {
          lt: today,
        },
        ...branchFilter,
      },
      select: {
        id: true,
      },
    });

    const overdueCount = overdueInvoices.length;

    // Caja actual (por sucursal si se especifica)
    const currentCash = await prisma.cashRegister.findFirst({
      where: {
        status: CashStatus.OPEN,
        ...(branchId ? { branchId } : {}),
      },
      include: {
        branch: {
          select: {
            name: true,
          },
        },
        movements: {
          select: {
            amount: true,
            type: true,
          },
        },
      },
      orderBy: {
        openedAt: 'desc',
      },
    });

    let currentBalance = 0;
    if (currentCash) {
      currentBalance = Number(currentCash.initialAmount);
      currentCash.movements.forEach((movement: any) => {
        if (['SALE', 'PAYMENT', 'MANUAL_ENTRY'].includes(movement.type)) {
          currentBalance += Number(movement.amount);
        } else {
          currentBalance -= Number(movement.amount);
        }
      });
    }

    // Stock bajo (qtyOnHand <= minStock) - Solo productos que controlan stock
    const lowStock = await prisma.stock.findMany({
      where: {
        quantity: {
          lte: prisma.stock.fields.minStock,
        },
        product: {
          controlsStock: true,
        },
        ...(branchId ? { branchId } : {}),
      },
      select: {
        id: true,
      },
    });

    // Tareas pendientes (si CRM activo)
    const pendingTasks = await prisma.task.count({
      where: {
        status: 'PENDING',
        ...(branchId ? {} : {}), // Las tareas no tienen branchId directo
      },
    });

    // Tareas vencidas
    const overdueTasks = await prisma.task.count({
      where: {
        status: 'PENDING',
        dueDate: {
          lt: today,
        },
      },
    });

    // Cajas sin cerrar de días anteriores
    const unclosedCash = await prisma.cashRegister.count({
      where: {
        status: CashStatus.OPEN,
        openedAt: {
          lt: today,
        },
        ...(branchId ? { branchId } : {}),
      },
    });

    // NCF próximos a agotarse
    const now = new Date();
    const lowStockNcf = await prisma.ncfSequence.findMany({
      where: {
        isActive: true,
        validFrom: { lte: now },
        OR: [
          { validUntil: null },
          { validUntil: { gte: now } },
        ],
      },
    });

    // Calcular cuántas secuencias tienen menos del 10% disponibles
    const ncfAboutToExpire = lowStockNcf.filter((seq: any) => {
      const remaining = seq.endRange - seq.currentNumber;
      const totalRange = seq.endRange - seq.startRange + 1;
      const percentageRemaining = (remaining / totalRange) * 100;
      return percentageRemaining <= 10 && remaining > 0;
    }).length;

    res.json({
      salesToday: {
        amount: todayAmount,
        trend: Math.round(trend * 10) / 10, // Redondear a 1 decimal
      },
      salesMonth: {
        amount: Number(salesMonth._sum.total || 0),
        progress: Math.round(monthProgress * 10) / 10,
      },
      receivables: {
        total: Number(receivables._sum.balance || 0),
        overdue: overdueCount,
      },
      payables: {
        total: Number(payables._sum.balance || 0),
        overdue: overduePayables,
      },
      cash: {
        currentBalance,
        status: currentCash?.status || CashStatus.CLOSED,
        branchId: currentCash?.branchId || null,
        branchName: currentCash?.branch?.name || null,
      },
      stock: {
        lowStockCount: lowStock.length,
      },
      tasks: {
        pending: pendingTasks,
        overdue: overdueTasks,
      },
      alerts: {
        overdueInvoices: overdueCount,
        lowStock: lowStock.length,
        unclosedCash,
        ncfAboutToExpire,
        overdueTasks,
      },
    });
  } catch (error) {
    console.error('Dashboard summary error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error fetching dashboard summary',
      },
    });
  }
};

export const getSalesTrend = async (req: AuthRequest, res: Response) => {
  try {
    const prisma = req.tenantPrisma || getTenantPrisma(process.env.DATABASE_URL!);
    const days = parseInt(req.query.days as string) || 7;
    const branchId = req.query.branchId as string | undefined;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const branchFilter = branchId ? { branchId } : {};

    const sales = await prisma.invoice.groupBy({
      by: ['issueDate'],
      where: {
        status: InvoiceStatus.ISSUED,
        issueDate: {
          gte: startDate,
        },
        ...branchFilter,
      },
      _sum: {
        total: true,
      },
      orderBy: {
        issueDate: 'asc',
      },
    });

    // Crear un mapa de fechas para llenar días sin ventas
    const dataMap = new Map<string, number>();
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateKey = date.toISOString().split('T')[0];
      dataMap.set(dateKey, 0);
    }

    // Llenar con datos reales
    sales.forEach((sale: any) => {
      const dateKey = sale.issueDate.toISOString().split('T')[0];
      dataMap.set(dateKey, Number(sale._sum.total || 0));
    });

    // Convertir a array ordenado
    const data = Array.from(dataMap.entries())
      .map(([date, amount]) => ({
        date,
        amount,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    res.json({
      period: `last_${days}_days`,
      data,
    });
  } catch (error) {
    console.error('Sales trend error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error fetching sales trend',
      },
    });
  }
};

export const getRecentActivity = async (req: AuthRequest, res: Response) => {
  try {
    const prisma = req.tenantPrisma || getTenantPrisma(process.env.DATABASE_URL!);
    const limit = parseInt(req.query.limit as string) || 10;
    const branchId = req.query.branchId as string | undefined;
    const branchFilter = branchId ? { branchId } : {};

    // Obtener facturas recientes
    const invoices = await prisma.invoice.findMany({
      take: Math.ceil(limit * 0.5), // 50% facturas
      where: {
        ...branchFilter,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        number: true,
        total: true,
        status: true,
        createdAt: true,
        user: {
          select: {
            name: true,
          },
        },
        client: {
          select: {
            name: true,
          },
        },
      },
    });

    // Obtener pagos recientes
    const payments = await prisma.payment.findMany({
      take: Math.ceil(limit * 0.3), // 30% pagos
      where: {
        invoice: branchId ? { branchId } : undefined,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        amount: true,
        paymentDate: true,
        createdAt: true,
        invoice: {
          select: {
            number: true,
          },
        },
        user: {
          select: {
            name: true,
          },
        },
        client: {
          select: {
            name: true,
          },
        },
      },
    });

    // Obtener ajustes de inventario recientes
    const adjustments = await prisma.inventoryAdjustment.findMany({
      take: Math.ceil(limit * 0.2), // 20% ajustes
      where: {
        ...branchFilter,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        adjustmentDate: true,
        createdAt: true,
        user: {
          select: {
            name: true,
          },
        },
        items: {
          take: 1,
          select: {
            product: {
              select: {
                code: true,
              },
            },
          },
        },
      },
    });

    // Combinar y ordenar todas las actividades
    const activities = [
      ...invoices.map((invoice) => ({
        date: invoice.createdAt,
        type: 'FACTURA',
        reference: invoice.number,
        amount: Number(invoice.total),
        client: invoice.client?.name || 'Sin cliente',
        user: invoice.user.name,
      })),
      ...payments.map((payment) => ({
        date: payment.createdAt,
        type: 'PAGO',
        reference: payment.invoice?.number || 'N/A',
        amount: Number(payment.amount),
        client: payment.client.name,
        user: payment.user.name,
      })),
      ...adjustments.map((adjustment) => ({
        date: adjustment.createdAt,
        type: 'AJUSTE_INV',
        reference: adjustment.items[0]?.product?.code || 'N/A',
        amount: 0, // Los ajustes no tienen monto directo
        client: '',
        user: adjustment.user.name,
      })),
    ]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit)
      .map((activity) => ({
        ...activity,
        date: new Date(activity.date).toISOString(),
      }));

    res.json({
      activities,
    });
  } catch (error) {
    console.error('Recent activity error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error fetching recent activity',
      },
    });
  }
};

