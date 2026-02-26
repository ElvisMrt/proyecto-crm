import { Response } from 'express';
import { TenantRequest } from '../middleware/tenant.middleware';
import { Decimal } from '@prisma/client/runtime/library';

// GET /supplier-invoices/stats - Obtener estadísticas de facturas
export async function getSupplierInvoicesStats(req: TenantRequest, res: Response) {
  try {
    const prisma = req.tenantPrisma;

    if (!prisma) {
      return res.status(500).json({
        error: { code: 'PRISMA_NOT_INITIALIZED', message: 'Database connection not available' }
      });
    }

    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    // Total de facturas
    const totalInvoices = await prisma.supplierInvoice.count();

    // Facturas pendientes (con saldo > 0)
    const pendingInvoices = await prisma.supplierInvoice.count({
      where: {
        balance: { gt: 0 },
        status: { in: ['PENDING', 'PARTIAL'] }
      }
    });

    // Facturas vencidas
    const overdueInvoices = await prisma.supplierInvoice.count({
      where: {
        balance: { gt: 0 },
        dueDate: { lt: today },
        status: { in: ['PENDING', 'PARTIAL'] }
      }
    });

    // Deuda total
    const totalDebtResult = await prisma.supplierInvoice.aggregate({
      where: {
        balance: { gt: 0 },
        status: { in: ['PENDING', 'PARTIAL'] }
      },
      _sum: { balance: true }
    });

    // Deuda vencida
    const overdueDebtResult = await prisma.supplierInvoice.aggregate({
      where: {
        balance: { gt: 0 },
        dueDate: { lt: today },
        status: { in: ['PENDING', 'PARTIAL'] }
      },
      _sum: { balance: true }
    });

    // Próximas a vencer (30 días)
    const upcomingDueResult = await prisma.supplierInvoice.aggregate({
      where: {
        balance: { gt: 0 },
        dueDate: {
          gte: today,
          lte: thirtyDaysFromNow
        },
        status: { in: ['PENDING', 'PARTIAL'] }
      },
      _sum: { balance: true }
    });

    res.json({
      success: true,
      data: {
        totalInvoices,
        pendingInvoices,
        overdueInvoices,
        totalDebt: Number(totalDebtResult._sum.balance || 0),
        overdueDebt: Number(overdueDebtResult._sum.balance || 0),
        upcomingDue: Number(upcomingDueResult._sum.balance || 0)
      }
    });
  } catch (error) {
    console.error('Get supplier invoices stats error:', error);
    res.json({
      success: true,
      data: {
        totalInvoices: 0,
        pendingInvoices: 0,
        overdueInvoices: 0,
        totalDebt: 0,
        overdueDebt: 0,
        upcomingDue: 0
      }
    });
  }
}

// GET /supplier-invoices - Listar facturas de proveedores
export async function getSupplierInvoices(req: TenantRequest, res: Response) {
  try {
    const { supplierId, status, overdue, page = 1, limit = 20 } = req.query;
    const prisma = req.tenantPrisma;

    if (!prisma) {
      return res.status(500).json({
        error: { code: 'PRISMA_NOT_INITIALIZED', message: 'Database connection not available' }
      });
    }

    const where: any = {};
    
    if (supplierId) {
      where.supplierId = supplierId as string;
    }

    if (status) {
      const statusValues = (status as string).split(',');
      if (statusValues.length === 1) {
        where.status = statusValues[0];
      } else {
        where.status = { in: statusValues };
      }
    }

    if (overdue === 'true') {
      where.status = { in: ['PENDING', 'PARTIAL'] };
      where.dueDate = { lt: new Date() };
    }

    const skip = (Number(page) - 1) * Number(limit);

    let invoices = [];
    let total = 0;
    
    try {
      [invoices, total] = await Promise.all([
        prisma.supplierInvoice.findMany({
          where,
          include: {
            supplier: {
              select: {
                id: true,
                code: true,
                name: true,
                email: true,
                phone: true
              }
            }
          },
          orderBy: { invoiceDate: 'desc' },
          skip,
          take: Number(limit)
        }),
        prisma.supplierInvoice.count({ where })
      ]);
    } catch (queryError) {
      console.error('Query error:', queryError);
      // Si falla, retornar array vacío
      invoices = [];
      total = 0;
    }

    res.json({
      success: true,
      data: invoices,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Get supplier invoices error:', error);
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Error al obtener facturas' }
    });
  }
}

// GET /supplier-invoices/:id - Obtener factura por ID
export async function getSupplierInvoiceById(req: TenantRequest, res: Response) {
  try {
    const { id } = req.params;
    const prisma = req.tenantPrisma;

    if (!prisma) {
      return res.status(500).json({
        error: { code: 'PRISMA_NOT_INITIALIZED', message: 'Database connection not available' }
      });
    }

    const invoice = await prisma.supplierInvoice.findUnique({
      where: { id },
      include: {
        supplier: true,
        purchase: {
          include: {
            items: {
              include: {
                product: true
              }
            }
          }
        },
        branch: true,
        payments: {
          include: {
            payment: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true
                  }
                }
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!invoice) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Factura no encontrada' }
      });
    }

    res.json({
      success: true,
      data: invoice
    });
  } catch (error) {
    console.error('Get supplier invoice by ID error:', error);
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Error al obtener factura' }
    });
  }
}

// POST /supplier-invoices - Crear factura
export async function createSupplierInvoice(req: TenantRequest, res: Response) {
  try {
    const prisma = req.tenantPrisma;

    if (!prisma) {
      return res.status(500).json({
        error: { code: 'PRISMA_NOT_INITIALIZED', message: 'Database connection not available' }
      });
    }

    const {
      supplierId,
      purchaseId,
      branchId,
      invoiceDate,
      dueDate,
      subtotal,
      tax,
      discount,
      notes,
      reference
    } = req.body;

    // Validar campos requeridos
    if (!supplierId || !dueDate) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Proveedor y fecha de vencimiento son requeridos' }
      });
    }

    // Si hay purchaseId, verificar que no tenga factura
    if (purchaseId) {
      const existingInvoice = await prisma.supplierInvoice.findFirst({
        where: { purchaseId }
      });

      if (existingInvoice) {
        return res.status(400).json({
          error: { code: 'INVOICE_EXISTS', message: 'Esta compra ya tiene una factura asociada' }
        });
      }
    }

    // Generar código único
    const lastInvoice = await prisma.supplierInvoice.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { code: true }
    });

    const nextNumber = lastInvoice 
      ? parseInt(lastInvoice.code.split('-')[1]) + 1 
      : 1;
    const code = `FINV-${String(nextNumber).padStart(6, '0')}`;

    const total = Number(subtotal) + Number(tax || 0) - Number(discount || 0);

    const invoice = await prisma.supplierInvoice.create({
      data: {
        code,
        supplierId,
        purchaseId: purchaseId || null,
        branchId: branchId || null,
        invoiceDate: invoiceDate ? new Date(invoiceDate) : new Date(),
        dueDate: new Date(dueDate),
        status: 'PENDING',
        subtotal: Number(subtotal),
        tax: Number(tax || 0),
        discount: Number(discount || 0),
        total,
        paid: 0,
        balance: total,
        notes,
        reference
      },
      include: {
        supplier: true,
        purchase: true,
        branch: true
      }
    });

    res.status(201).json({
      success: true,
      data: invoice
    });
  } catch (error) {
    console.error('Create supplier invoice error:', error);
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Error al crear factura' }
    });
  }
}

// PUT /supplier-invoices/:id - Actualizar factura
export async function updateSupplierInvoice(req: TenantRequest, res: Response) {
  try {
    const { id } = req.params;
    const prisma = req.tenantPrisma;

    if (!prisma) {
      return res.status(500).json({
        error: { code: 'PRISMA_NOT_INITIALIZED', message: 'Database connection not available' }
      });
    }

    const {
      invoiceDate,
      dueDate,
      status,
      subtotal,
      tax,
      discount,
      total,
      notes,
      reference
    } = req.body;

    const invoice = await prisma.supplierInvoice.update({
      where: { id },
      data: {
        invoiceDate: invoiceDate ? new Date(invoiceDate) : undefined,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        status: status || undefined,
        subtotal: subtotal ? Number(subtotal) : undefined,
        tax: tax ? Number(tax) : undefined,
        discount: discount ? Number(discount) : undefined,
        total: total ? Number(total) : undefined,
        notes,
        reference
      },
      include: {
        supplier: true,
        purchase: true,
        branch: true
      }
    });

    res.json({
      success: true,
      data: invoice
    });
  } catch (error) {
    console.error('Update supplier invoice error:', error);
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Error al actualizar factura' }
    });
  }
}

// DELETE /supplier-invoices/:id - Eliminar factura
export async function deleteSupplierInvoice(req: TenantRequest, res: Response) {
  try {
    const { id } = req.params;
    const prisma = req.tenantPrisma;

    if (!prisma) {
      return res.status(500).json({
        error: { code: 'PRISMA_NOT_INITIALIZED', message: 'Database connection not available' }
      });
    }

    // Verificar si tiene pagos
    const invoice = await prisma.supplierInvoice.findUnique({
      where: { id },
      include: {
        payments: true
      }
    });

    if (invoice && invoice.payments.length > 0) {
      return res.status(400).json({
        error: {
          code: 'HAS_PAYMENTS',
          message: 'No se puede eliminar una factura con pagos registrados'
        }
      });
    }

    await prisma.supplierInvoice.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Factura eliminada exitosamente'
    });
  } catch (error) {
    console.error('Delete supplier invoice error:', error);
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Error al eliminar factura' }
    });
  }
}

// PATCH /supplier-invoices/:id/status - Actualizar estado de factura
export async function updateInvoiceStatus(req: TenantRequest, res: Response) {
  try {
    const { id } = req.params;
    const prisma = req.tenantPrisma;

    if (!prisma) {
      return res.status(500).json({
        error: { code: 'PRISMA_NOT_INITIALIZED', message: 'Database connection not available' }
      });
    }

    const invoice = await prisma.supplierInvoice.findUnique({
      where: { id }
    });

    if (!invoice) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Factura no encontrada' }
      });
    }

    // Determinar estado basado en pagos y fecha
    let newStatus = invoice.status;
    const now = new Date();

    if (Number(invoice.balance) <= 0) {
      newStatus = 'PAID';
    } else if (Number(invoice.paid) > 0) {
      newStatus = 'PARTIAL';
    } else if (invoice.dueDate < now) {
      newStatus = 'OVERDUE';
    } else {
      newStatus = 'PENDING';
    }

    const updatedInvoice = await prisma.supplierInvoice.update({
      where: { id },
      data: { status: newStatus },
      include: {
        supplier: true,
        purchase: true
      }
    });

    res.json({
      success: true,
      data: updatedInvoice
    });
  } catch (error) {
    console.error('Update invoice status error:', error);
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Error al actualizar estado' }
    });
  }
}

// GET /supplier-invoices/stats - Estadísticas de facturas
export async function getInvoiceStats(req: TenantRequest, res: Response) {
  try {
    const prisma = req.tenantPrisma;

    if (!prisma) {
      return res.status(500).json({
        error: { code: 'PRISMA_NOT_INITIALIZED', message: 'Database connection not available' }
      });
    }

    const now = new Date();

    const [
      totalInvoices,
      pendingInvoices,
      overdueInvoices,
      paidInvoices,
      invoices
    ] = await Promise.all([
      prisma.supplierInvoice.count(),
      prisma.supplierInvoice.count({ where: { status: 'PENDING' } }),
      prisma.supplierInvoice.count({ where: { status: 'OVERDUE' } }),
      prisma.supplierInvoice.count({ where: { status: 'PAID' } }),
      prisma.supplierInvoice.findMany({
        select: { total: true, paid: true, balance: true, status: true, dueDate: true }
      })
    ]);

    const totalDebt = invoices
      .filter(inv => inv.status !== 'PAID' && inv.status !== 'CANCELLED')
      .reduce((sum, inv) => sum + Number(inv.balance), 0);

    const overdueDebt = invoices
      .filter(inv => inv.status === 'OVERDUE')
      .reduce((sum, inv) => sum + Number(inv.balance), 0);

    const next30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const upcomingDue = invoices
      .filter(inv => 
        (inv.status === 'PENDING' || inv.status === 'PARTIAL') && 
        inv.dueDate <= next30Days && 
        inv.dueDate >= now
      )
      .reduce((sum, inv) => sum + Number(inv.balance), 0);

    res.json({
      success: true,
      data: {
        totalInvoices,
        pendingInvoices,
        overdueInvoices,
        paidInvoices,
        totalDebt,
        overdueDebt,
        upcomingDue
      }
    });
  } catch (error) {
    console.error('Get invoice stats error:', error);
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Error al obtener estadísticas' }
    });
  }
}
