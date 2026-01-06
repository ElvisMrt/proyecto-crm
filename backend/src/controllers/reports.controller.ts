import { Response } from 'express';
import { PrismaClient, InvoiceStatus } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

export const getGeneralSummary = async (req: AuthRequest, res: Response) => {
  try {
    const branchId = req.query.branchId as string | undefined;
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date();
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();
    
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    const branchFilter = branchId ? { branchId } : {};

    // Sales Today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const salesToday = await prisma.invoice.aggregate({
      where: {
        ...branchFilter,
        issueDate: { gte: todayStart, lte: todayEnd },
        status: { not: 'CANCELLED' },
      },
      _sum: { total: true },
      _count: true,
    });

    // Sales This Month
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const salesMonth = await prisma.invoice.aggregate({
      where: {
        ...branchFilter,
        issueDate: { gte: monthStart },
        status: { not: 'CANCELLED' },
      },
      _sum: { total: true },
    });

    // Receivables
    const receivables = await prisma.invoice.aggregate({
      where: {
        ...branchFilter,
        status: { in: ['ISSUED', 'OVERDUE'] },
        balance: { gt: 0 },
      },
      _sum: { balance: true },
    });

    const now = new Date();
    const overdueReceivables = await prisma.invoice.aggregate({
      where: {
        ...branchFilter,
        status: { in: ['ISSUED', 'OVERDUE'] },
        balance: { gt: 0 },
        dueDate: { lt: now },
      },
      _sum: { balance: true },
    });

    // Cash Status
    const currentCash = await prisma.cashRegister.findFirst({
      where: {
        ...branchFilter,
        status: 'OPEN',
      },
      include: {
        movements: true,
      },
    });

    let cashStatus = {
      balance: 0,
      status: 'CLOSED' as const,
    };

    if (currentCash) {
      const income = currentCash.movements
        .filter((m) => m.type === 'INCOME')
        .reduce((sum, m) => sum + Number(m.amount), 0);
      const expenses = currentCash.movements
        .filter((m) => m.type === 'EXPENSE')
        .reduce((sum, m) => sum + Number(m.amount), 0);
      cashStatus = {
        balance: Number(currentCash.initialAmount) + income - expenses,
        status: 'OPEN',
      };
    }

    // Low Stock Products
    const allStocks = await prisma.stock.findMany({
      where: branchFilter,
      include: {
        product: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const lowStockProducts = allStocks
      .filter((s) => Number(s.quantity) <= Number(s.minStock))
      .slice(0, 5)
      .map((s) => ({
        id: s.product.id,
        name: s.product.name,
        stock: Number(s.quantity),
        minStock: Number(s.minStock),
      }));

    // Sales vs Income vs Expenses (for chart)
    const days = [];
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      days.push(new Date(d));
    }

    const chartData = await Promise.all(
      days.map(async (day) => {
        const dayStart = new Date(day);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(day);
        dayEnd.setHours(23, 59, 59, 999);

        const [sales, income, expenses] = await Promise.all([
          prisma.invoice.aggregate({
            where: {
              ...branchFilter,
              issueDate: { gte: dayStart, lte: dayEnd },
              status: { not: 'CANCELLED' },
            },
            _sum: { total: true },
          }),
          prisma.cashMovement.aggregate({
            where: {
              ...branchFilter,
              type: 'INCOME',
              movementDate: { gte: dayStart, lte: dayEnd },
            },
            _sum: { amount: true },
          }),
          prisma.cashMovement.aggregate({
            where: {
              ...branchFilter,
              type: 'EXPENSE',
              movementDate: { gte: dayStart, lte: dayEnd },
            },
            _sum: { amount: true },
          }),
        ]);

        return {
          date: day.toISOString().split('T')[0],
          sales: Number(sales._sum.total || 0),
          income: Number(income._sum.amount || 0),
          expenses: Number(expenses._sum.amount || 0),
        };
      })
    );

    // Top Products
    const topProducts = await prisma.invoiceItem.groupBy({
      by: ['productId'],
      where: {
        invoice: {
          ...branchFilter,
          issueDate: { gte: startDate, lte: endDate },
          status: { not: 'CANCELLED' },
        },
      },
      _sum: {
        quantity: true,
        subtotal: true,
      },
      orderBy: {
        _sum: {
          subtotal: 'desc',
        },
      },
      take: 5,
    });

    const productsWithDetails = await Promise.all(
      topProducts.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: { id: true, name: true },
        });
        return {
          product: product || { id: item.productId, name: 'Producto eliminado' },
          quantity: Number(item._sum.quantity || 0),
          total: Number(item._sum.subtotal || 0),
        };
      })
    );

    // Best Clients
    const bestClients = await prisma.invoice.groupBy({
      by: ['clientId'],
      where: {
        ...branchFilter,
        issueDate: { gte: startDate, lte: endDate },
        status: { not: 'CANCELLED' },
      },
      _sum: { total: true },
      orderBy: {
        _sum: {
          total: 'desc',
        },
      },
      take: 5,
    });

    const clientsWithDetails = await Promise.all(
      bestClients.map(async (item) => {
        const client = await prisma.client.findUnique({
          where: { id: item.clientId },
          select: { id: true, name: true },
        });
        return {
          client: client || { id: item.clientId, name: 'Cliente eliminado' },
          total: Number(item._sum.total || 0),
        };
      })
    );

    res.json({
      salesToday: {
        amount: Number(salesToday._sum.total || 0),
        count: salesToday._count,
      },
      salesMonth: {
        amount: Number(salesMonth._sum.total || 0),
      },
      receivables: {
        total: Number(receivables._sum.balance || 0),
        overdue: Number(overdueReceivables._sum.balance || 0),
      },
      cash: cashStatus,
      lowStockProducts,
      chartData,
      topProducts: productsWithDetails,
      bestClients: clientsWithDetails,
    });
  } catch (error) {
    console.error('Get general summary error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error fetching general summary',
      },
    });
  }
};

export const getDailyProfit = async (req: AuthRequest, res: Response) => {
  try {
    const date = req.query.date ? new Date(req.query.date as string) : new Date();
    const branchId = req.query.branchId as string | undefined;

    date.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const branchFilter = branchId ? { branchId } : {};

    // Sales
    const sales = await prisma.invoice.aggregate({
      where: {
        ...branchFilter,
        issueDate: { gte: date, lte: dayEnd },
        status: { not: 'CANCELLED' },
      },
      _sum: { total: true },
    });

    // Calculate costs from invoice items
    const invoiceItems = await prisma.invoiceItem.findMany({
      where: {
        invoice: {
          ...branchFilter,
          issueDate: { gte: date, lte: dayEnd },
          status: { not: 'CANCELLED' },
        },
      },
      include: {
        product: {
          select: { cost: true },
        },
      },
    });

    const costs = invoiceItems.reduce((sum, item) => {
      const cost = item.product.cost ? Number(item.product.cost) : 0;
      return sum + cost * Number(item.quantity);
    }, 0);

    // Expenses from cash movements (MANUAL_EXIT represents expenses/withdrawals)
    const expenses = await prisma.cashMovement.aggregate({
      where: {
        ...branchFilter,
        type: 'MANUAL_EXIT',
        movementDate: { gte: date, lte: dayEnd },
      },
      _sum: { amount: true },
    });

    const totalSales = Number(sales._sum.total || 0);
    const totalCosts = costs;
    const totalExpenses = Number(expenses._sum.amount || 0);
    const netProfit = totalSales - totalCosts - totalExpenses;

    res.json({
      date: date.toISOString().split('T')[0],
      sales: totalSales,
      costs: totalCosts,
      expenses: totalExpenses,
      netProfit,
      isPositive: netProfit >= 0,
    });
  } catch (error) {
    console.error('Get daily profit error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error fetching daily profit',
      },
    });
  }
};

export const getSalesReport = async (req: AuthRequest, res: Response) => {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date();
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();
    const branchId = req.query.branchId as string | undefined;
    const clientId = req.query.clientId as string | undefined;
    const status = req.query.status as string | undefined;

    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    const where: any = {
      issueDate: { gte: startDate, lte: endDate },
    };

    if (branchId) where.branchId = branchId;
    if (clientId) where.clientId = clientId;
    if (status) where.status = status;
    else where.status = { not: 'CANCELLED' };

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        client: { select: { name: true } },
        branch: { select: { name: true } },
        user: { select: { name: true } },
      },
      orderBy: { issueDate: 'desc' },
    });

    const summary = invoices.reduce(
      (acc, inv) => {
        acc.total += Number(inv.total);
        acc.count += 1;
        return acc;
      },
      { total: 0, count: 0 }
    );

    res.json({
      data: invoices.map((inv) => ({
        id: inv.id,
        number: inv.number,
        date: inv.issueDate,
        client: inv.client.name,
        branch: inv.branch?.name,
        user: inv.user.name,
        total: Number(inv.total),
        status: inv.status,
      })),
      summary,
    });
  } catch (error) {
    console.error('Get sales report error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error fetching sales report',
      },
    });
  }
};

export const getReceivablesReport = async (req: AuthRequest, res: Response) => {
  try {
    const now = new Date();
    const branchId = req.query.branchId as string | undefined;
    const branchFilter = branchId ? { branchId } : {};

    const invoices = await prisma.invoice.findMany({
      where: {
        ...branchFilter,
        status: { in: ['ISSUED', 'OVERDUE'] },
        balance: { gt: 0 },
      },
      include: {
        client: { select: { name: true } },
      },
    });

    const aging = {
      '0-30': 0,
      '31-60': 0,
      '61-90': 0,
      '90+': 0,
    };

    let totalReceivable = 0;
    let totalOverdue = 0;

    invoices.forEach((inv) => {
      const balance = Number(inv.balance);
      totalReceivable += balance;

      if (inv.dueDate && inv.dueDate < now) {
        totalOverdue += balance;
        const daysOverdue = Math.floor((now.getTime() - inv.dueDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysOverdue <= 30) aging['0-30'] += balance;
        else if (daysOverdue <= 60) aging['31-60'] += balance;
        else if (daysOverdue <= 90) aging['61-90'] += balance;
        else aging['90+'] += balance;
      } else if (inv.dueDate) {
        const daysUntilDue = Math.floor((inv.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (daysUntilDue <= 30) aging['0-30'] += balance;
      }
    });

    res.json({
      totalReceivable,
      totalOverdue,
      aging,
      invoicesCount: invoices.length,
    });
  } catch (error) {
    console.error('Get receivables report error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error fetching receivables report',
      },
    });
  }
};

export const getCashReport = async (req: AuthRequest, res: Response) => {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date();
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();
    const branchId = req.query.branchId as string | undefined;

    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    const branchFilter = branchId ? { branchId } : {};

    const cashRegisters = await prisma.cashRegister.findMany({
      where: {
        ...branchFilter,
        openedAt: { gte: startDate, lte: endDate },
      },
      include: {
        movements: true,
        openedByUser: { select: { name: true } },
        closedByUser: { select: { name: true } },
      },
      orderBy: { openedAt: 'desc' },
    });

    const summary = cashRegisters.reduce(
      (acc, cash) => {
        const income = cash.movements
          .filter((m) => m.type === 'INCOME')
          .reduce((sum, m) => sum + Number(m.amount), 0);
        const expenses = cash.movements
          .filter((m) => m.type === 'EXPENSE')
          .reduce((sum, m) => sum + Number(m.amount), 0);

        acc.totalIncome += income;
        acc.totalExpenses += expenses;
        acc.totalDifference += Number(cash.difference || 0);
        return acc;
      },
      { totalIncome: 0, totalExpenses: 0, totalDifference: 0 }
    );

    res.json({
      data: cashRegisters.map((cash) => {
        const income = cash.movements
          .filter((m) => m.type === 'INCOME')
          .reduce((sum, m) => sum + Number(m.amount), 0);
        const expenses = cash.movements
          .filter((m) => m.type === 'EXPENSE')
          .reduce((sum, m) => sum + Number(m.amount), 0);

        return {
          id: cash.id,
          openedAt: cash.openedAt,
          closedAt: cash.closedAt,
          openedBy: cash.openedByUser.name,
          closedBy: cash.closedByUser?.name,
          initialAmount: Number(cash.initialAmount),
          finalAmount: cash.finalAmount ? Number(cash.finalAmount) : null,
          income,
          expenses,
          difference: Number(cash.difference || 0),
          status: cash.status,
        };
      }),
      summary,
    });
  } catch (error) {
    console.error('Get cash report error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error fetching cash report',
      },
    });
  }
};

export const getInventoryReport = async (req: AuthRequest, res: Response) => {
  try {
    const branchId = req.query.branchId as string | undefined;
    const branchFilter = branchId ? { branchId } : {};

    const stocks = await prisma.stock.findMany({
      where: branchFilter,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            cost: true,
            salePrice: true,
          },
        },
        branch: {
          select: { name: true },
        },
      },
    });

    const lowStock = stocks.filter((s) => Number(s.quantity) <= Number(s.minStock));

    const totalValue = stocks.reduce((sum, s) => {
      const cost = s.product.cost ? Number(s.product.cost) : 0;
      return sum + cost * Number(s.quantity);
    }, 0);

    res.json({
      totalProducts: stocks.length,
      lowStockCount: lowStock.length,
      totalValue,
      stocks: stocks.map((s) => ({
        product: s.product,
        branch: s.branch.name,
        quantity: Number(s.quantity),
        minStock: Number(s.minStock),
        isLowStock: Number(s.quantity) <= Number(s.minStock),
      })),
      lowStock: lowStock.map((s) => ({
        product: s.product,
        branch: s.branch.name,
        quantity: Number(s.quantity),
        minStock: Number(s.minStock),
      })),
    });
  } catch (error) {
    console.error('Get inventory report error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error fetching inventory report',
      },
    });
  }
};

