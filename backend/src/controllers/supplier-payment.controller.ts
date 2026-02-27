import { Response } from 'express';
import { TenantRequest } from '../middleware/tenant.middleware';

// GET /supplier-payments/stats - Obtener estadísticas de pagos
export async function getSupplierPaymentsStats(req: TenantRequest, res: Response) {
  try {
    const prisma = req.tenantPrisma;

    if (!prisma) {
      return res.status(500).json({
        error: { code: 'PRISMA_NOT_INITIALIZED', message: 'Database connection not available' }
      });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const totalPayments = await prisma.supplierPayment.count();
    
    const paymentsThisMonth = await prisma.supplierPayment.count({
      where: {
        paymentDate: { gte: startOfMonth }
      }
    });

    const amountThisMonthResult = await prisma.supplierPayment.aggregate({
      where: {
        paymentDate: { gte: startOfMonth }
      },
      _sum: { amount: true }
    });

    res.json({
      success: true,
      data: {
        totalPayments,
        paymentsThisMonth,
        amountThisMonth: Number(amountThisMonthResult._sum.amount || 0)
      }
    });
  } catch (error) {
    console.error('Get supplier payments stats error:', error);
    res.json({
      success: true,
      data: {
        totalPayments: 0,
        paymentsThisMonth: 0,
        amountThisMonth: 0
      }
    });
  }
}

// GET /supplier-payments - Listar pagos
export async function getSupplierPayments(req: TenantRequest, res: Response) {
  try {
    const { supplierId, startDate, endDate, page = 1, limit = 20 } = req.query;
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

    if (startDate || endDate) {
      where.paymentDate = {};
      if (startDate) where.paymentDate.gte = new Date(startDate as string);
      if (endDate) where.paymentDate.lte = new Date(endDate as string);
    }

    const skip = (Number(page) - 1) * Number(limit);

    let payments: any[] = [];
    let total = 0;
    
    try {
      [payments, total] = await Promise.all<any[]>([
        prisma.supplierPayment.findMany({
          where,
          include: {
            supplier: {
              select: {
                id: true,
                code: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: { paymentDate: 'desc' },
          skip,
          take: Number(limit)
        }),
        prisma.supplierPayment.count({ where })
      ]);
    } catch (queryError) {
      console.error('Query error:', queryError);
      // Si falla, retornar array vacío
      payments = [];
      total = 0;
    }

    res.json({
      success: true,
      data: payments,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Get supplier payments error:', error);
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Error al obtener pagos' }
    });
  }
}

// GET /supplier-payments/:id - Obtener pago por ID
export async function getSupplierPaymentById(req: TenantRequest, res: Response) {
  try {
    const { id } = req.params;
    const prisma = req.tenantPrisma;

    if (!prisma) {
      return res.status(500).json({
        error: { code: 'PRISMA_NOT_INITIALIZED', message: 'Database connection not available' }
      });
    }

    const payment = await prisma.supplierPayment.findUnique({
      where: { id },
      include: {
        supplier: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        branch: true,
        details: {
          include: {
            invoice: true
          }
        }
      }
    });

    if (!payment) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Pago no encontrado' }
      });
    }

    res.json({
      success: true,
      data: payment
    });
  } catch (error) {
    console.error('Get supplier payment by ID error:', error);
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Error al obtener pago' }
    });
  }
}

// POST /supplier-payments - Crear pago
export async function createSupplierPayment(req: TenantRequest, res: Response) {
  try {
    const prisma = req.tenantPrisma;

    if (!prisma) {
      return res.status(500).json({
        error: { code: 'PRISMA_NOT_INITIALIZED', message: 'Database connection not available' }
      });
    }

    const {
      supplierId,
      branchId,
      paymentDate,
      amount,
      paymentMethod,
      reference,
      notes,
      invoices, // Array de { invoiceId, amount }
      invoiceAllocations, // Array de { invoiceId, amount } (desde frontend)
      purchases // Array de { purchaseId, amount }
    } = req.body;

    const userId = (req as any).userId || (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        error: { code: 'UNAUTHORIZED', message: 'Usuario no autenticado' }
      });
    }

    // Validar campos requeridos
    if (!supplierId || !amount || !paymentMethod) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Proveedor, monto y método de pago son requeridos' }
      });
    }

    // Usar invoiceAllocations si está disponible, sino usar invoices
    const invoicesToProcess = invoiceAllocations || invoices;

    // Validar que haya al menos facturas o compras
    if ((!invoicesToProcess || invoicesToProcess.length === 0) && (!purchases || purchases.length === 0)) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Debe especificar al menos una factura o compra a pagar' }
      });
    }

    // Validar que la suma de los montos coincida con el monto total
    const totalInvoicesAmount = invoicesToProcess ? invoicesToProcess.reduce((sum: number, inv: any) => sum + Number(inv.amount), 0) : 0;
    const totalPurchasesAmount = purchases ? purchases.reduce((sum: number, pur: any) => sum + Number(pur.amount), 0) : 0;
    const totalAmount = totalInvoicesAmount + totalPurchasesAmount;
    
    if (Math.abs(totalAmount - Number(amount)) > 0.01) {
      return res.status(400).json({
        error: { code: 'AMOUNT_MISMATCH', message: 'La suma de los montos no coincide con el monto total del pago' }
      });
    }

    // Generar código único
    const lastPayment = await prisma.supplierPayment.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { code: true }
    });

    const nextNumber = lastPayment 
      ? parseInt(lastPayment.code.split('-')[1]) + 1 
      : 1;
    const code = `FPAG-${String(nextNumber).padStart(6, '0')}`;

    // Crear pago con detalles en una transacción
    const payment = await prisma.$transaction(async (tx) => {
      // Crear el pago
      const newPayment = await tx.supplierPayment.create({
        data: {
          code,
          supplierId,
          branchId: branchId || null,
          userId,
          paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
          amount: Number(amount),
          paymentMethod,
          reference,
          notes
        }
      });

      // Crear detalles y actualizar facturas
      if (invoicesToProcess && invoicesToProcess.length > 0) {
        for (const invoiceDetail of invoicesToProcess) {
          const { invoiceId, amount: invoiceAmount } = invoiceDetail;

          // Crear detalle del pago
          await tx.supplierPaymentDetail.create({
            data: {
              paymentId: newPayment.id,
              invoiceId,
              amount: Number(invoiceAmount)
            }
          });

          // Obtener factura actual
          const invoice = await tx.supplierInvoice.findUnique({
            where: { id: invoiceId }
          });

          if (!invoice) {
            throw new Error(`Factura ${invoiceId} no encontrada`);
          }

          // Calcular nuevos valores
          const newPaid = Number(invoice.paid) + Number(invoiceAmount);
          const newBalance = Number(invoice.total) - newPaid;

          // Determinar nuevo estado
          let newStatus = invoice.status;
          if (newBalance <= 0) {
            newStatus = 'PAID';
          } else if (newPaid > 0) {
            newStatus = 'PARTIAL';
          }

          // Actualizar factura
          await tx.supplierInvoice.update({
            where: { id: invoiceId },
            data: {
              paid: newPaid,
              balance: newBalance,
              status: newStatus
            }
          });
        }
      }

      // Crear detalles y actualizar compras
      if (purchases && purchases.length > 0) {
        for (const purchaseDetail of purchases) {
          const { purchaseId, amount: purchaseAmount } = purchaseDetail;

          // Crear detalle del pago
          await tx.purchasePaymentDetail.create({
            data: {
              paymentId: newPayment.id,
              purchaseId,
              amount: Number(purchaseAmount)
            }
          });

          // Obtener compra actual
          const purchase = await tx.purchase.findUnique({
            where: { id: purchaseId }
          });

          if (!purchase) {
            throw new Error(`Compra ${purchaseId} no encontrada`);
          }

          // Calcular nuevos valores
          const newPaid = Number(purchase.paid) + Number(purchaseAmount);
          const newBalance = Number(purchase.total) - newPaid;

          // Actualizar compra
          await tx.purchase.update({
            where: { id: purchaseId },
            data: {
              paid: newPaid,
              balance: newBalance
            }
          });
        }
      }

      // Retornar pago con relaciones
      return tx.supplierPayment.findUnique({
        where: { id: newPayment.id },
        include: {
          supplier: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          branch: true,
          details: {
            include: {
              invoice: true
            }
          }
        }
      });
    });

    res.status(201).json({
      success: true,
      data: payment
    });
  } catch (error) {
    console.error('Create supplier payment error:', error);
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Error al crear pago' }
    });
  }
}

// DELETE /supplier-payments/:id - Eliminar pago (reversar)
export async function deleteSupplierPayment(req: TenantRequest, res: Response) {
  try {
    const { id } = req.params;
    const prisma = req.tenantPrisma;

    if (!prisma) {
      return res.status(500).json({
        error: { code: 'PRISMA_NOT_INITIALIZED', message: 'Database connection not available' }
      });
    }

    // Obtener pago con detalles
    const payment = await prisma.supplierPayment.findUnique({
      where: { id },
      include: {
        details: true
      }
    });

    if (!payment) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Pago no encontrado' }
      });
    }

    // Reversar pago en una transacción
    await prisma.$transaction(async (tx) => {
      // Reversar cada factura
      for (const detail of payment.details) {
        const invoice = await tx.supplierInvoice.findUnique({
          where: { id: detail.invoiceId }
        });

        if (invoice) {
          const newPaid = Number(invoice.paid) - Number(detail.amount);
          const newBalance = Number(invoice.total) - newPaid;

          // Determinar nuevo estado
          let newStatus = invoice.status;
          if (newBalance >= Number(invoice.total)) {
            newStatus = 'PENDING';
          } else if (newPaid > 0) {
            newStatus = 'PARTIAL';
          }

          // Si estaba vencida, revisar fecha
          if (invoice.dueDate < new Date() && newStatus !== 'PAID') {
            newStatus = 'OVERDUE';
          }

          await tx.supplierInvoice.update({
            where: { id: detail.invoiceId },
            data: {
              paid: newPaid,
              balance: newBalance,
              status: newStatus
            }
          });
        }
      }

      // Eliminar pago (los detalles se eliminan en cascada)
      await tx.supplierPayment.delete({
        where: { id }
      });
    });

    res.json({
      success: true,
      message: 'Pago reversado exitosamente'
    });
  } catch (error) {
    console.error('Delete supplier payment error:', error);
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Error al reversar pago' }
    });
  }
}

// GET /supplier-payments/stats - Estadísticas de pagos
export async function getPaymentStats(req: TenantRequest, res: Response) {
  try {
    const prisma = req.tenantPrisma;

    if (!prisma) {
      return res.status(500).json({
        error: { code: 'PRISMA_NOT_INITIALIZED', message: 'Database connection not available' }
      });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const [
      totalPayments,
      paymentsThisMonth,
      paymentsThisYear,
      payments
    ] = await Promise.all([
      prisma.supplierPayment.count(),
      prisma.supplierPayment.count({
        where: { paymentDate: { gte: startOfMonth } }
      }),
      prisma.supplierPayment.count({
        where: { paymentDate: { gte: startOfYear } }
      }),
      prisma.supplierPayment.findMany({
        select: { amount: true, paymentDate: true }
      })
    ]);

    const totalAmount = payments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);
    const amountThisMonth = payments
      .filter(p => p.paymentDate >= startOfMonth)
      .reduce((sum: number, p: any) => sum + Number(p.amount), 0);
    const amountThisYear = payments
      .filter(p => p.paymentDate >= startOfYear)
      .reduce((sum: number, p: any) => sum + Number(p.amount), 0);

    res.json({
      success: true,
      data: {
        totalPayments,
        paymentsThisMonth,
        paymentsThisYear,
        totalAmount,
        amountThisMonth,
        amountThisYear
      }
    });
  } catch (error) {
    console.error('Get payment stats error:', error);
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Error al obtener estadísticas' }
    });
  }
}
