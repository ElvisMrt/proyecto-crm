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
      let resolvedBranchId = branchId || null;

      if (invoicesToProcess && invoicesToProcess.length > 0) {
        const invoiceIds = invoicesToProcess.map((inv: any) => inv.invoiceId);
        const selectedInvoices = await tx.supplierInvoice.findMany({
          where: { id: { in: invoiceIds } },
          select: {
            id: true,
            supplierId: true,
            branchId: true,
            balance: true,
            dueDate: true,
            paid: true,
            total: true,
            status: true,
          }
        });

        if (selectedInvoices.length !== invoiceIds.length) {
          throw new Error('Una o mas facturas no existen');
        }

        for (const invoice of selectedInvoices) {
          if (invoice.supplierId !== supplierId) {
            throw new Error('Todas las facturas deben pertenecer al mismo proveedor');
          }
        }

        const invoiceBranches = Array.from(new Set(selectedInvoices.map((invoice) => invoice.branchId).filter(Boolean)));
        if (!resolvedBranchId && invoiceBranches.length === 1) {
          resolvedBranchId = invoiceBranches[0] as string;
        }
        if (resolvedBranchId && invoiceBranches.some((candidate) => candidate !== resolvedBranchId)) {
          throw new Error('No se pueden mezclar facturas de sucursales distintas en un mismo pago');
        }

        for (const invoiceDetail of invoicesToProcess) {
          const sourceInvoice = selectedInvoices.find((invoice) => invoice.id === invoiceDetail.invoiceId);
          const requestedAmount = Number(invoiceDetail.amount);
          if (!sourceInvoice || requestedAmount <= 0) {
            throw new Error('Monto de factura invalido');
          }
          if (requestedAmount - Number(sourceInvoice.balance) > 0.01) {
            throw new Error(`El monto aplicado excede el saldo de la factura ${sourceInvoice.id}`);
          }
        }
      }

      if (purchases && purchases.length > 0) {
        const purchaseIds = purchases.map((purchase: any) => purchase.purchaseId);
        const selectedPurchases = await tx.purchase.findMany({
          where: { id: { in: purchaseIds } },
          select: {
            id: true,
            supplierId: true,
            branchId: true,
            balance: true,
            total: true,
            paid: true,
          }
        });

        if (selectedPurchases.length !== purchaseIds.length) {
          throw new Error('Una o mas compras no existen');
        }

        for (const purchase of selectedPurchases) {
          if (purchase.supplierId !== supplierId) {
            throw new Error('Todas las compras deben pertenecer al mismo proveedor');
          }
        }

        const purchaseBranches = Array.from(new Set(selectedPurchases.map((purchase) => purchase.branchId).filter(Boolean)));
        if (!resolvedBranchId && purchaseBranches.length === 1) {
          resolvedBranchId = purchaseBranches[0] as string;
        }
        if (resolvedBranchId && purchaseBranches.some((candidate) => candidate !== resolvedBranchId)) {
          throw new Error('No se pueden mezclar compras de sucursales distintas en un mismo pago');
        }

        for (const purchaseDetail of purchases) {
          const sourcePurchase = selectedPurchases.find((purchase) => purchase.id === purchaseDetail.purchaseId);
          const requestedAmount = Number(purchaseDetail.amount);
          if (!sourcePurchase || requestedAmount <= 0) {
            throw new Error('Monto de compra invalido');
          }
          if (requestedAmount - Number(sourcePurchase.balance) > 0.01) {
            throw new Error(`El monto aplicado excede el saldo de la compra ${sourcePurchase.id}`);
          }
        }
      }

      let cashRegisterId: string | null = null;
      if (paymentMethod === 'CASH') {
        if (!resolvedBranchId) {
          throw new Error('Debe especificar una sucursal valida para pagos en efectivo');
        }

        const openCash = await tx.cashRegister.findFirst({
          where: {
            branchId: resolvedBranchId,
            status: 'OPEN',
          },
          orderBy: { openedAt: 'desc' },
        });

        if (!openCash) {
          throw new Error('No hay una caja abierta para registrar este pago en efectivo');
        }

        cashRegisterId = openCash.id;
      }

      // Crear el pago
      const newPayment = await tx.supplierPayment.create({
        data: {
          code,
          supplierId,
          branchId: resolvedBranchId,
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
            newStatus = invoice.dueDate < new Date() ? 'OVERDUE' : 'PARTIAL';
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

      if (cashRegisterId) {
        await tx.cashMovement.create({
          data: {
            cashRegisterId,
            type: 'MANUAL_EXIT',
            concept: `Pago a proveedor ${code}`,
            amount: Number(amount),
            method: paymentMethod,
            paymentId: newPayment.id,
            userId,
            observations: notes || reference || 'Pago a proveedor',
          }
        });
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

    if (error instanceof Error) {
      const businessErrorMap: Array<{ pattern: RegExp; code: string; status: number }> = [
        { pattern: /no existen|no encontrada/i, code: 'NOT_FOUND', status: 404 },
        { pattern: /mismo proveedor|monto .* invalido|excede el saldo|mezclar .* sucursales|sucursal valida|caja abierta/i, code: 'BUSINESS_RULE_ERROR', status: 400 },
      ];

      const matchedError = businessErrorMap.find((entry) => entry.pattern.test(error.message));
      if (matchedError) {
        return res.status(matchedError.status).json({
          error: {
            code: matchedError.code,
            message: error.message,
          }
        });
      }
    }

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
        details: true,
        purchaseDetails: true
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

      for (const detail of payment.purchaseDetails) {
        const purchase = await tx.purchase.findUnique({
          where: { id: detail.purchaseId }
        });

        if (purchase) {
          const newPaid = Math.max(Number(purchase.paid) - Number(detail.amount), 0);
          const newBalance = Math.max(Number(purchase.total) - newPaid, 0);

          await tx.purchase.update({
            where: { id: detail.purchaseId },
            data: {
              paid: newPaid,
              balance: newBalance
            }
          });
        }
      }

      await tx.cashMovement.deleteMany({
        where: { paymentId: id }
      });

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
