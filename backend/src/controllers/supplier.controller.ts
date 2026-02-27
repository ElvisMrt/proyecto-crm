import { Request, Response } from 'express';
import { TenantRequest } from '../middleware/tenant.middleware';
import { Pool } from 'pg';

// GET /suppliers/stats - Obtener estadísticas de proveedores
export async function getSuppliersStats(req: TenantRequest, res: Response) {
  try {
    const prisma = req.tenantPrisma;

    if (!prisma) {
      return res.status(500).json({
        error: { code: 'PRISMA_NOT_INITIALIZED', message: 'Database connection not available' }
      });
    }

    const totalSuppliers = await prisma.supplier.count();
    const activeSuppliers = await prisma.supplier.count({
      where: { isActive: true }
    });

    res.json({
      success: true,
      data: {
        totalSuppliers,
        activeSuppliers
      }
    });
  } catch (error) {
    console.error('Get suppliers stats error:', error);
    res.json({
      success: true,
      data: {
        totalSuppliers: 0,
        activeSuppliers: 0
      }
    });
  }
}

// GET /suppliers - Listar proveedores
export async function getSuppliers(req: TenantRequest, res: Response) {
  const pool = new Pool({ connectionString: req.tenant?.databaseUrl });
  
  try {
    const { search, isActive, category } = req.query;

    if (!req.tenant?.databaseUrl) {
      return res.status(500).json({
        error: { code: 'DATABASE_NOT_CONFIGURED', message: 'Database connection not available' }
      });
    }

    // Construir condiciones WHERE para SQL
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (search) {
      conditions.push(`(
        s.name ILIKE $${paramIndex} OR 
        s.code ILIKE $${paramIndex} OR 
        s.email ILIKE $${paramIndex} OR 
        s."taxId" ILIKE $${paramIndex}
      )`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (isActive !== undefined) {
      conditions.push(`s."isActive" = $${paramIndex}`);
      params.push(isActive === 'true');
      paramIndex++;
    }

    if (category) {
      conditions.push(`s.category = $${paramIndex}`);
      params.push(category);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Usar conexión directa de PostgreSQL
    const result = await pool.query(`
      SELECT 
        s.*,
        COALESCE(COUNT(DISTINCT p.id), 0)::int as "_count_purchases",
        COALESCE(COUNT(DISTINCT si.id), 0)::int as "_count_invoices",
        COALESCE(COUNT(DISTINCT sp.id), 0)::int as "_count_payments"
      FROM "Supplier" s
      LEFT JOIN "Purchase" p ON p."supplierId" = s.id
      LEFT JOIN "SupplierInvoice" si ON si."supplierId" = s.id
      LEFT JOIN "SupplierPayment" sp ON sp."supplierId" = s.id
      ${whereClause}
      GROUP BY s.id
      ORDER BY s.name ASC
    `, params);

    const suppliers = result.rows;

    // Calcular totales financieros por proveedor
    const suppliersWithFinancials = await Promise.all(
      suppliers.map(async (supplier: any) => {
        const invoicesResult = await pool.query(`
          SELECT total, paid, balance, status
          FROM "SupplierInvoice"
          WHERE "supplierId" = $1
        `, [supplier.id]);

        const invoices = invoicesResult.rows;
        const totalPurchased = invoices.reduce((sum: number, inv: any) => sum + Number(inv.total), 0);
        const totalPaid = invoices.reduce((sum: number, inv: any) => sum + Number(inv.paid), 0);
        const totalBalance = invoices.reduce((sum: number, inv: any) => sum + Number(inv.balance), 0);
        const overdueInvoices = invoices.filter((inv: any) => inv.status === 'OVERDUE').length;

        return {
          ...supplier,
          _count: {
            purchases: supplier._count_purchases,
            invoices: supplier._count_invoices,
            payments: supplier._count_payments
          },
          financials: {
            totalPurchased,
            totalPaid,
            totalBalance,
            overdueInvoices
          }
        };
      })
    );

    res.json({
      success: true,
      data: suppliersWithFinancials
    });
  } catch (error) {
    console.error('Get suppliers error:', error);
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Error al obtener proveedores' }
    });
  } finally {
    await pool.end();
  }
}

// GET /suppliers/:id - Obtener proveedor por ID
export async function getSupplierById(req: TenantRequest, res: Response) {
  try {
    const { id } = req.params;
    const prisma = req.tenantPrisma;

    if (!prisma) {
      return res.status(500).json({
        error: { code: 'PRISMA_NOT_INITIALIZED', message: 'Database connection not available' }
      });
    }

    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        purchases: {
          orderBy: { purchaseDate: 'desc' },
          take: 10
        },
        invoices: {
          orderBy: { invoiceDate: 'desc' },
          take: 10
        },
        payments: {
          orderBy: { paymentDate: 'desc' },
          take: 10
        }
      }
    });

    if (!supplier) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Proveedor no encontrado' }
      });
    }

    // Calcular resumen financiero
    const invoices = await prisma.supplierInvoice.findMany({
      where: { supplierId: id }
    });

    const financials = {
      totalPurchased: invoices.reduce((sum: number, inv: any) => sum + Number(inv.total), 0),
      totalPaid: invoices.reduce((sum: number, inv: any) => sum + Number(inv.paid), 0),
      totalBalance: invoices.reduce((sum: number, inv: any) => sum + Number(inv.balance), 0),
      pendingInvoices: invoices.filter(inv => inv.status === 'PENDING').length,
      overdueInvoices: invoices.filter(inv => inv.status === 'OVERDUE').length
    };

    res.json({
      success: true,
      data: {
        ...supplier,
        financials
      }
    });
  } catch (error) {
    console.error('Get supplier by ID error:', error);
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Error al obtener proveedor' }
    });
  }
}

// POST /suppliers - Crear proveedor
export async function createSupplier(req: TenantRequest, res: Response) {
  try {
    const prisma = req.tenantPrisma;

    if (!prisma) {
      return res.status(500).json({
        error: { code: 'PRISMA_NOT_INITIALIZED', message: 'Database connection not available' }
      });
    }

    const {
      code: providedCode,
      name,
      contactName,
      email,
      phone,
      mobile,
      address,
      city,
      country,
      taxId,
      website,
      notes,
      creditLimit,
      creditDays,
      category
    } = req.body;

    // Validar campos requeridos
    if (!name) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'El nombre es requerido' }
      });
    }

    // Generar código automáticamente si no se proporciona
    let code = providedCode?.trim();
    
    if (!code) {
      // Obtener el último proveedor para generar código secuencial
      const lastSupplier = await prisma.supplier.findFirst({
        orderBy: { createdAt: 'desc' },
        select: { code: true }
      });

      if (lastSupplier && lastSupplier.code.match(/^PROV(\d+)$/)) {
        const lastNumber = parseInt(lastSupplier.code.replace('PROV', ''));
        code = `PROV${String(lastNumber + 1).padStart(4, '0')}`;
      } else {
        code = 'PROV0001';
      }
    }

    // Verificar si el código ya existe
    const existing = await prisma.supplier.findUnique({
      where: { code }
    });

    if (existing) {
      return res.status(400).json({
        error: { code: 'DUPLICATE_CODE', message: 'El código de proveedor ya existe' }
      });
    }

    const supplier = await prisma.supplier.create({
      data: {
        code,
        name,
        contactName,
        email,
        phone,
        mobile,
        address,
        city,
        country: country || 'DO',
        taxId,
        website,
        notes,
        creditLimit: creditLimit || 0,
        creditDays: creditDays || 0,
        category
      }
    });

    res.status(201).json({
      success: true,
      data: supplier
    });
  } catch (error) {
    console.error('Create supplier error:', error);
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Error al crear proveedor' }
    });
  }
}

// PUT /suppliers/:id - Actualizar proveedor
export async function updateSupplier(req: TenantRequest, res: Response) {
  try {
    const { id } = req.params;
    const prisma = req.tenantPrisma;

    if (!prisma) {
      return res.status(500).json({
        error: { code: 'PRISMA_NOT_INITIALIZED', message: 'Database connection not available' }
      });
    }

    const {
      name,
      contactName,
      email,
      phone,
      mobile,
      address,
      city,
      country,
      taxId,
      website,
      notes,
      isActive,
      creditLimit,
      creditDays,
      category
    } = req.body;

    const supplier = await prisma.supplier.update({
      where: { id },
      data: {
        name,
        contactName,
        email,
        phone,
        mobile,
        address,
        city,
        country,
        taxId,
        website,
        notes,
        isActive,
        creditLimit,
        creditDays,
        category
      }
    });

    res.json({
      success: true,
      data: supplier
    });
  } catch (error) {
    console.error('Update supplier error:', error);
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Error al actualizar proveedor' }
    });
  }
}

// DELETE /suppliers/:id - Eliminar proveedor
export async function deleteSupplier(req: TenantRequest, res: Response) {
  try {
    const { id } = req.params;
    const prisma = req.tenantPrisma;

    if (!prisma) {
      return res.status(500).json({
        error: { code: 'PRISMA_NOT_INITIALIZED', message: 'Database connection not available' }
      });
    }

    // Verificar si tiene compras o facturas
    const hasTransactions = await prisma.supplier.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            purchases: true,
            invoices: true,
            payments: true
          }
        }
      }
    });

    if (hasTransactions && (
      hasTransactions._count.purchases > 0 ||
      hasTransactions._count.invoices > 0 ||
      hasTransactions._count.payments > 0
    )) {
      return res.status(400).json({
        error: {
          code: 'HAS_TRANSACTIONS',
          message: 'No se puede eliminar un proveedor con transacciones. Desactívelo en su lugar.'
        }
      });
    }

    await prisma.supplier.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Proveedor eliminado exitosamente'
    });
  } catch (error) {
    console.error('Delete supplier error:', error);
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Error al eliminar proveedor' }
    });
  }
}

// GET /suppliers/stats - Estadísticas generales
export async function getSupplierStats(req: TenantRequest, res: Response) {
  try {
    const prisma = req.tenantPrisma;

    if (!prisma) {
      return res.status(500).json({
        error: { code: 'PRISMA_NOT_INITIALIZED', message: 'Database connection not available' }
      });
    }

    const totalSuppliers = await prisma.supplier.count();
    const activeSuppliers = await prisma.supplier.count({ where: { isActive: true } });

    const invoices = await prisma.supplierInvoice.findMany({
      select: { total: true, paid: true, balance: true, status: true, dueDate: true }
    });

    const totalDebt = invoices.reduce((sum: number, inv: any) => sum + Number(inv.balance), 0);
    const overdueDebt = invoices
      .filter(inv => inv.status === 'OVERDUE')
      .reduce((sum: number, inv: any) => sum + Number(inv.balance), 0);

    const now = new Date();
    const next30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const upcomingDue = invoices
      .filter(inv => inv.status === 'PENDING' && inv.dueDate <= next30Days && inv.dueDate >= now)
      .reduce((sum: number, inv: any) => sum + Number(inv.balance), 0);

    const recentPayments = await prisma.supplierPayment.findMany({
      where: {
        paymentDate: {
          gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        }
      },
      select: { amount: true }
    });

    const recentPaymentsTotal = recentPayments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);

    res.json({
      success: true,
      data: {
        totalSuppliers,
        activeSuppliers,
        totalDebt,
        overdueDebt,
        upcomingDue,
        recentPaymentsTotal
      }
    });
  } catch (error) {
    console.error('Get supplier stats error:', error);
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Error al obtener estadísticas' }
    });
  }
}
