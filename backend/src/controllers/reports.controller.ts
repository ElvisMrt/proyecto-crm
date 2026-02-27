import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { getTenantPrisma } from '../middleware/tenant.middleware';


export const getGeneralSummary = async (req: AuthRequest, res: Response) => {
  try {
    const prisma = req.tenantPrisma || getTenantPrisma(process.env.DATABASE_URL!);
    const branchId = req.query.branchId as string | undefined;
    let startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date();
    let endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();
    
    // If dates are invalid, use current month
    if (isNaN(startDate.getTime())) {
      startDate = new Date();
      startDate.setDate(1);
    }
    if (isNaN(endDate.getTime())) {
      endDate = new Date();
    }
    
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
    const cashWhere: any = {
      status: 'OPEN',
    };
    if (branchId) {
      cashWhere.branchId = branchId;
    }
    const currentCash = await prisma.cashRegister.findFirst({
      where: cashWhere,
      include: {
        movements: true,
      },
    });

    let cashStatus: { balance: number; status: 'OPEN' | 'CLOSED' } = {
      balance: 0,
      status: 'CLOSED',
    };

    if (currentCash) {
      const income = currentCash.movements
        .filter((m: any) => m.type === 'SALE' || m.type === 'PAYMENT' || m.type === 'MANUAL_ENTRY' || m.type === 'OPENING')
        .reduce((sum: number, m: any) => sum + Number(m.amount), 0);
      const expenses = currentCash.movements
        .filter((m: any) => m.type === 'MANUAL_EXIT')
        .reduce((sum: number, m: any) => sum + Number(m.amount), 0);
      cashStatus = {
        balance: Number(currentCash.initialAmount) + income - expenses,
        status: 'OPEN',
      };
    }

    // Low Stock Products - Solo productos que controlan stock
    const allStocks = await prisma.stock.findMany({
      where: branchFilter,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            controlsStock: true,
          },
        },
      },
    });

    const lowStockProducts = allStocks
      .filter((s: any) => s.product.controlsStock && Number(s.quantity) <= Number(s.minStock))
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
      days.map(async (day: any) => {
        const dayStart = new Date(day);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(day);
        dayEnd.setHours(23, 59, 59, 999);

        const incomeWhere: any = {
          type: { in: ['SALE', 'PAYMENT', 'MANUAL_ENTRY', 'OPENING'] },
          movementDate: { gte: dayStart, lte: dayEnd },
        };
        if (branchId) {
          incomeWhere.cashRegister = { branchId };
        }

        const expensesWhere: any = {
          type: 'MANUAL_EXIT',
          movementDate: { gte: dayStart, lte: dayEnd },
        };
        if (branchId) {
          expensesWhere.cashRegister = { branchId };
        }

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
            where: incomeWhere,
            _sum: { amount: true },
          }),
          prisma.cashMovement.aggregate({
            where: expensesWhere,
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
      topProducts
        .filter((item: any) => item.productId) // Filter out null productIds
        .map(async (item: any) => {
        const product = await prisma.product.findUnique({
            where: { id: item.productId! },
          select: { id: true, name: true },
        });
        return {
            product: product || { id: item.productId!, name: 'Producto eliminado' },
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
      bestClients
        .filter((item: any) => item.clientId) // Filter out null clientIds
        .map(async (item: any) => {
        const client = await prisma.client.findUnique({
            where: { id: item.clientId! },
          select: { id: true, name: true },
        });
        return {
            client: client || { id: item.clientId!, name: 'Cliente eliminado' },
          total: Number(item._sum.total || 0),
        };
      })
    );

    // Ensure all data comes from database - no hardcoded values
    const response = {
      salesToday: {
        amount: Number(salesToday._sum.total || 0),
        count: salesToday._count || 0,
      },
      salesMonth: {
        amount: Number(salesMonth._sum.total || 0),
      },
      receivables: {
        total: Number(receivables._sum.balance || 0),
        overdue: Number(overdueReceivables._sum.balance || 0),
      },
      cash: cashStatus,
      lowStockProducts: lowStockProducts || [],
      chartData: chartData || [],
      topProducts: productsWithDetails || [],
      bestClients: clientsWithDetails || [],
    };

    // Log to verify data is from database
    console.log('General Summary - Data from DB:', {
      invoicesCount: salesToday._count,
      salesTodayAmount: response.salesToday.amount,
      salesMonthAmount: response.salesMonth.amount,
      receivablesTotal: response.receivables.total,
      lowStockCount: response.lowStockProducts.length,
      topProductsCount: response.topProducts.length,
      bestClientsCount: response.bestClients.length,
    });

    res.json(response);
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
    const prisma = req.tenantPrisma || getTenantPrisma(process.env.DATABASE_URL!);
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

    const costs = invoiceItems.reduce((sum: number, item: any) => {
      const cost = item.product?.cost ? Number(item.product.cost) : 0;
      return sum + cost * Number(item.quantity);
    }, 0);

    // Expenses from cash movements (MANUAL_EXIT represents expenses/withdrawals)
    const expensesWhere: any = {
      type: 'MANUAL_EXIT',
      movementDate: { gte: date, lte: dayEnd },
    };
    if (branchId) {
      expensesWhere.cashRegister = { branchId };
    }
    const expenses = await prisma.cashMovement.aggregate({
      where: expensesWhere,
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
    const prisma = req.tenantPrisma || getTenantPrisma(process.env.DATABASE_URL!);
    let startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date();
    let endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();
    const branchId = req.query.branchId as string | undefined;
    const clientId = req.query.clientId as string | undefined;
    const status = req.query.status as string | undefined;

    // If dates are invalid, use current month
    if (isNaN(startDate.getTime())) {
      startDate = new Date();
      startDate.setDate(1);
    }
    if (isNaN(endDate.getTime())) {
      endDate = new Date();
    }

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

    // Ensure all data comes from database - no hardcoded values
    const response = {
      data: invoices.map((inv) => ({
        id: inv.id,
        number: inv.number,
        date: inv.issueDate.toISOString(),
        client: inv.client?.name || 'Cliente eliminado',
        branch: inv.branch?.name || '-',
        user: inv.user?.name || '-',
        total: Number(inv.total),
        status: inv.status,
      })),
      summary: {
        total: summary.total || 0,
        count: summary.count || 0,
      },
    };

    // Log to verify data is from database
    console.log('Sales Report - Data from DB:', {
      invoicesCount: invoices.length,
      totalAmount: response.summary.total,
      invoiceCount: response.summary.count,
    });

    res.json(response);
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
    const prisma = req.tenantPrisma || getTenantPrisma(process.env.DATABASE_URL!);
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

    invoices.forEach((inv: any) => {
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
      invoices: invoices.map((inv) => ({
        id: inv.id,
        number: inv.number,
        date: inv.issueDate,
        dueDate: inv.dueDate,
        client: inv.client?.name || 'Cliente eliminado',
        total: Number(inv.total),
        balance: Number(inv.balance),
        status: inv.status,
        daysOverdue: inv.dueDate && inv.dueDate < now
          ? Math.floor((now.getTime() - inv.dueDate.getTime()) / (1000 * 60 * 60 * 24))
          : null,
      })),
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
    const prisma = req.tenantPrisma || getTenantPrisma(process.env.DATABASE_URL!);
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date();
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();
    const branchId = req.query.branchId as string | undefined;

    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    const branchFilter = branchId ? { branchId } : {};

    const cashRegisters = await prisma.cashRegister.findMany({
      where: {
        ...branchFilter,
        OR: [
          { openedAt: { gte: startDate, lte: endDate } },
          { closedAt: { gte: startDate, lte: endDate } },
          {
            AND: [
              { openedAt: { lte: startDate } },
              {
                OR: [
                  { closedAt: { gte: startDate } },
                  { status: 'OPEN' },
                ],
              },
            ],
          },
        ],
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
          .filter((m: any) => m.type === 'SALE' || m.type === 'PAYMENT' || m.type === 'MANUAL_ENTRY' || m.type === 'OPENING')
          .reduce((sum: number, m: any) => sum + Number(m.amount), 0);
        const expenses = cash.movements
          .filter((m: any) => m.type === 'MANUAL_EXIT')
          .reduce((sum: number, m: any) => sum + Number(m.amount), 0);

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
          .filter((m: any) => m.type === 'SALE' || m.type === 'PAYMENT' || m.type === 'MANUAL_ENTRY' || m.type === 'OPENING')
          .reduce((sum: number, m: any) => sum + Number(m.amount), 0);
        const expenses = cash.movements
          .filter((m: any) => m.type === 'MANUAL_EXIT')
          .reduce((sum: number, m: any) => sum + Number(m.amount), 0);

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
    const prisma = req.tenantPrisma || getTenantPrisma(process.env.DATABASE_URL!);
    const branchId = req.query.branchId as string | undefined;
    const branchFilter = branchId ? { branchId } : {};

    const stocks = await prisma.stock.findMany({
      where: branchFilter,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            code: true,
            cost: true,
            salePrice: true,
            controlsStock: true,
          },
        },
        branch: {
          select: { name: true },
        },
      },
    });

    const lowStock = stocks.filter((s: any) => s.product.controlsStock && Number(s.quantity) <= Number(s.minStock));

    const totalValue = stocks.reduce((sum: number, s: any) => {
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

export const getSuppliersReport = async (req: AuthRequest, res: Response) => {
  try {
    const prisma = req.tenantPrisma || getTenantPrisma(process.env.DATABASE_URL!);

    const suppliers = await prisma.supplier.findMany({
      include: {
        invoices: {
          select: {
            total: true,
            paid: true,
            balance: true,
            status: true,
            dueDate: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    const now = new Date();
    const suppliersWithFinancials = suppliers.map((supplier) => {
      const totalPurchased = supplier.invoices.reduce((sum: number, inv: any) => sum + Number(inv.total), 0);
      const totalPaid = supplier.invoices.reduce((sum: number, inv: any) => sum + Number(inv.paid), 0);
      const totalBalance = supplier.invoices.reduce((sum: number, inv: any) => sum + Number(inv.balance), 0);
      const overdueInvoices = supplier.invoices.filter(
        (inv) => Number(inv.balance) > 0 && inv.dueDate && inv.dueDate < now
      ).length;

      return {
        id: supplier.id,
        code: supplier.code,
        name: supplier.name,
        totalPurchased,
        totalPaid,
        totalBalance,
        invoicesCount: supplier.invoices.length,
        overdueInvoices,
        isActive: supplier.isActive,
      };
    });

    const summary = {
      totalSuppliers: suppliers.length,
      activeSuppliers: suppliers.filter((s: any) => s.isActive).length,
      totalDebt: suppliersWithFinancials.reduce((sum: number, s: any) => sum + s.totalBalance, 0),
      totalOverdue: suppliersWithFinancials
        .filter((s: any) => s.overdueInvoices > 0)
        .reduce((sum: number, s: any) => sum + s.totalBalance, 0),
    };

    res.json({
      data: suppliersWithFinancials,
      summary,
    });
  } catch (error) {
    console.error('Get suppliers report error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error fetching suppliers report',
      },
    });
  }
};

export const getPurchasesReport = async (req: AuthRequest, res: Response) => {
  try {
    const prisma = req.tenantPrisma || getTenantPrisma(process.env.DATABASE_URL!);
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date();
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();
    const status = req.query.status as string | undefined;

    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    const where: any = {
      purchaseDate: { gte: startDate, lte: endDate },
    };

    if (status && status !== 'ALL') {
      where.status = status;
    }

    const purchases = await prisma.purchase.findMany({
      where,
      include: {
        supplier: { select: { name: true } },
      },
      orderBy: { purchaseDate: 'desc' },
    });

    const summary = {
      totalPurchases: purchases.length,
      totalAmount: purchases.reduce((sum: number, p: any) => sum + Number(p.total), 0),
      pending: purchases.filter((p: any) => p.status === 'PENDING').length,
      received: purchases.filter((p: any) => p.status === 'RECEIVED').length,
    };

    res.json({
      data: purchases.map((p) => ({
        id: p.id,
        code: p.code,
        supplier: p.supplier?.name || 'N/A',
        purchaseDate: p.purchaseDate.toISOString(),
        status: p.status,
        total: Number(p.total),
        hasInvoice: false, // Se puede mejorar con una query adicional si es necesario
      })),
      summary,
    });
  } catch (error) {
    console.error('Get purchases report error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error fetching purchases report',
      },
    });
  }
};

export const getPayablesReport = async (req: AuthRequest, res: Response) => {
  try {
    const prisma = req.tenantPrisma || getTenantPrisma(process.env.DATABASE_URL!);
    const now = new Date();

    const invoices = await prisma.supplierInvoice.findMany({
      where: {
        balance: { gt: 0 },
        status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] },
      },
      include: {
        supplier: { select: { name: true } },
      },
      orderBy: { dueDate: 'asc' },
    });

    const aging = {
      '0-30': 0,
      '31-60': 0,
      '61-90': 0,
      '90+': 0,
    };

    let totalPayable = 0;
    let totalOverdue = 0;

    const invoicesWithAging = invoices.map((inv) => {
      const balance = Number(inv.balance);
      totalPayable += balance;

      let daysOverdue: number | null = null;
      if (inv.dueDate && inv.dueDate < now) {
        daysOverdue = Math.floor((now.getTime() - inv.dueDate.getTime()) / (1000 * 60 * 60 * 24));
        totalOverdue += balance;

        if (daysOverdue <= 30) aging['0-30'] += balance;
        else if (daysOverdue <= 60) aging['31-60'] += balance;
        else if (daysOverdue <= 90) aging['61-90'] += balance;
        else aging['90+'] += balance;
      }

      return {
        id: inv.id,
        code: inv.code,
        supplier: inv.supplier?.name || 'N/A',
        invoiceDate: inv.invoiceDate.toISOString(),
        dueDate: inv.dueDate.toISOString(),
        total: Number(inv.total),
        paid: Number(inv.paid),
        balance,
        status: inv.status,
        daysOverdue,
      };
    });

    res.json({
      invoices: invoicesWithAging,
      summary: {
        totalPayable,
        totalOverdue,
        invoicesCount: invoices.length,
        aging,
      },
    });
  } catch (error) {
    console.error('Get payables report error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error fetching payables report',
      },
    });
  }
};

