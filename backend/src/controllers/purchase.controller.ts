import { Response } from 'express';
import { TenantRequest } from '../middleware/tenant.middleware';

type PurchaseItemInput = {
  productId?: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  tax?: number;
  discount?: number;
};

function normalizePurchaseItems(items: any[]): PurchaseItemInput[] {
  return items
    .filter((item) => item && item.description && Number(item.quantity) > 0)
    .map((item) => ({
      productId: item.productId || null,
      description: String(item.description),
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice || 0),
      tax: Number(item.tax || 0),
      discount: Number(item.discount || 0),
    }));
}

function calculatePurchaseTotals(items: PurchaseItemInput[]) {
  const subtotal = items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unitPrice)), 0);
  const tax = items.reduce((sum, item) => sum + Number(item.tax || 0), 0);
  const discount = items.reduce((sum, item) => sum + Number(item.discount || 0), 0);
  const total = subtotal + tax - discount;

  return { subtotal, tax, discount, total };
}

async function buildSupplierInvoiceFromPurchase(prisma: NonNullable<TenantRequest['tenantPrisma']>, purchaseId: string) {
  const purchase = await prisma.purchase.findUnique({
    where: { id: purchaseId },
    include: {
      supplier: true,
    },
  });

  if (!purchase) {
    throw Object.assign(new Error('Compra no encontrada'), {
      statusCode: 404,
      code: 'PURCHASE_NOT_FOUND',
    });
  }

  const existingInvoice = await prisma.supplierInvoice.findFirst({
    where: { purchaseId },
  });

  if (existingInvoice) {
    throw Object.assign(new Error('Esta compra ya tiene una factura asociada'), {
      statusCode: 400,
      code: 'INVOICE_EXISTS',
      data: existingInvoice,
    });
  }

  const lastInvoice = await prisma.supplierInvoice.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { code: true },
  });

  let invoiceCode = 'FINV-000001';
  if (lastInvoice?.code) {
    const match = lastInvoice.code.match(/FINV-(\d+)/);
    if (match) {
      invoiceCode = `FINV-${String(parseInt(match[1], 10) + 1).padStart(6, '0')}`;
    }
  }

  const invoiceDate = purchase.purchaseDate;
  const dueDate = new Date(invoiceDate);
  dueDate.setDate(dueDate.getDate() + 30);

  const invoice = await prisma.supplierInvoice.create({
    data: {
      code: invoiceCode,
      supplierId: purchase.supplierId,
      purchaseId: purchase.id,
      branchId: purchase.branchId,
      invoiceDate,
      dueDate,
      subtotal: purchase.subtotal,
      tax: purchase.tax,
      discount: purchase.discount,
      total: purchase.total,
      paid: 0,
      balance: purchase.total,
      status: 'PENDING',
      notes: `Factura generada para compra ${purchase.code}`,
    },
  });

  return {
    purchase,
    invoice,
    invoiceCode,
  };
}

// GET /purchases - Listar compras
export async function getPurchases(req: TenantRequest, res: Response) {
  try {
    const prisma = req.tenantPrisma;
    if (!prisma) {
      return res.status(500).json({
        error: { code: 'PRISMA_NOT_INITIALIZED', message: 'Database connection not available' }
      });
    }

    const { page = 1, limit = 20, supplierId, status } = req.query;
    const where: any = {};

    if (supplierId) where.supplierId = supplierId as string;
    if (status) where.status = status as string;

    const skip = (Number(page) - 1) * Number(limit);

    let purchases: any[] = [];
    let total = 0;

    try {
      [purchases, total] = await Promise.all<any[]>([
        prisma.purchase.findMany({
          where,
          include: {
            supplier: {
              select: {
                id: true,
                code: true,
                name: true
              }
            }
          },
          orderBy: { purchaseDate: 'desc' },
          skip,
          take: Number(limit)
        }),
        prisma.purchase.count({ where })
      ]);
    } catch (queryError) {
      console.error('Query error:', queryError);
      purchases = [];
      total = 0;
    }

    res.json({
      success: true,
      data: purchases,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Get purchases error:', error);
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Error al obtener compras' }
    });
  }
}

// GET /purchases/:id - Obtener compra por ID
export async function getPurchaseById(req: TenantRequest, res: Response) {
  try {
    const prisma = req.tenantPrisma;
    if (!prisma) {
      return res.status(500).json({
        error: { code: 'PRISMA_NOT_INITIALIZED', message: 'Database connection not available' }
      });
    }

    const { id } = req.params;
    const purchase = await prisma.purchase.findUnique({
      where: { id },
      include: {
        supplier: true,
        branch: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                code: true,
                name: true,
                controlsStock: true,
              },
            },
          },
        },
        invoice: true,
        paymentDetails: true,
      },
    });

    if (!purchase) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Compra no encontrada' }
      });
    }

    res.json({
      success: true,
      data: purchase,
    });
  } catch (error) {
    console.error('Get purchase by ID error:', error);
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Error al obtener compra' }
    });
  }
}

// POST /purchases - Crear compra
export async function createPurchase(req: TenantRequest, res: Response) {
  try {
    console.log('📥 POST /purchases - Request body:', JSON.stringify(req.body, null, 2));
    
    const prisma = req.tenantPrisma;
    if (!prisma) {
      console.error('❌ Prisma not initialized');
      return res.status(500).json({
        error: { code: 'PRISMA_NOT_INITIALIZED', message: 'Database connection not available' }
      });
    }

    const { supplierId, purchaseDate, total, notes, status, branchId, items = [] } = req.body;

    // Validar campos requeridos
    if (!supplierId) {
      console.error('❌ Validation error: supplierId is required');
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'El proveedor es requerido' }
      });
    }

    // Validar que supplierId sea un UUID válido
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(supplierId)) {
      console.error('❌ Validation error: supplierId is not a valid UUID:', supplierId);
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'El ID del proveedor no es válido' }
      });
    }

    // Verificar que el proveedor existe
    const supplierExists = await prisma.supplier.findUnique({
      where: { id: supplierId },
      select: { id: true, name: true }
    });

    if (!supplierExists) {
      console.error('❌ Supplier not found:', supplierId);
      return res.status(400).json({
        error: { code: 'SUPPLIER_NOT_FOUND', message: 'El proveedor seleccionado no existe' }
      });
    }

    console.log('✅ Supplier found:', supplierExists.name);

    // Obtener userId del contexto (req.user) o buscar el primer usuario disponible
    let userId = (req as any).user?.id;
    
    if (!userId) {
      const firstUser = await prisma.user.findFirst({
        where: { isActive: true },
        select: { id: true }
      });
      
      if (!firstUser) {
        return res.status(400).json({
          error: { code: 'NO_USER_FOUND', message: 'No hay usuarios disponibles en el sistema' }
        });
      }
      
      userId = firstUser.id;
    }

    // Generar código automático
    console.log('🔍 Generating purchase code...');
    const lastPurchase = await prisma.purchase.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { code: true }
    });

    let code = 'COMP0001';
    if (lastPurchase && lastPurchase.code.match(/^COMP(\d+)$/)) {
      const lastNumber = parseInt(lastPurchase.code.replace('COMP', ''));
      code = `COMP${String(lastNumber + 1).padStart(4, '0')}`;
    }
    console.log('✅ Generated code:', code);

    const normalizedItems = normalizePurchaseItems(Array.isArray(items) ? items : []);
    const calculatedTotals = normalizedItems.length > 0
      ? calculatePurchaseTotals(normalizedItems)
      : {
          subtotal: parseFloat(String(total || 0)),
          tax: 0,
          discount: 0,
          total: parseFloat(String(total || 0)),
        };

    const totalValue = calculatedTotals.total;
    console.log('📝 Creating purchase with data:', {
      code,
      supplierId,
      userId,
      total: totalValue,
      status: status || 'PENDING'
    });

    // VALIDACIÓN RUNTIME: Verificar que Prisma ve la columna deliveryDate
    const checkColumn = await prisma.$queryRawUnsafe<any[]>(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = current_schema()
        AND table_name = 'Purchase'
        AND column_name = 'deliveryDate'
    `);
    console.log('✅ deliveryDate exists at runtime?', checkColumn.length > 0, checkColumn);

    // VALIDACIÓN RUNTIME: Verificar database y schema actual
    const checkDb = await prisma.$queryRaw<any[]>`SELECT current_database(), current_schema()`;
    console.log('✅ Current database and schema:', checkDb);

    const purchase = await prisma.purchase.create({
      data: {
        code,
        supplierId,
        userId,
        branchId: branchId || (req as any).branchId || null,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
        total: calculatedTotals.total,
        subtotal: calculatedTotals.subtotal,
        tax: calculatedTotals.tax,
        discount: calculatedTotals.discount,
        paid: 0,
        balance: totalValue,
        notes: notes || null,
        status: status || 'PENDING',
        items: normalizedItems.length > 0 ? {
          create: normalizedItems.map((item) => ({
            productId: item.productId,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            tax: item.tax || 0,
            discount: item.discount || 0,
            total: (item.quantity * item.unitPrice) + Number(item.tax || 0) - Number(item.discount || 0),
          }))
        } : undefined
      },
      include: {
        supplier: {
          select: {
            id: true,
            code: true,
            name: true
          }
        },
        items: true,
      }
    });

    console.log('✅ Purchase created:', purchase.id);

    console.log('📝 Generating invoice for purchase...');
    const { invoice, invoiceCode } = await buildSupplierInvoiceFromPurchase(prisma, purchase.id);

    console.log('✅ Invoice created:', invoice.code);

    res.status(201).json({
      success: true,
      data: {
        purchase,
        invoice
      },
      message: `Compra ${code} creada exitosamente con factura ${invoiceCode}`
    });
  } catch (error: any) {
    console.error('❌ Create purchase error:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Error stack:', error.stack);
    
    // Si es un error de Prisma, dar más detalles
    if (error.code) {
      console.error('Prisma error code:', error.code);
      console.error('Prisma meta:', error.meta);
    }
    
    res.status(500).json({
      error: { 
        code: error.code || 'INTERNAL_ERROR', 
        message: 'Error al crear compra',
        details: error.message,
        prismaCode: error.code,
        prismaMeta: error.meta
      }
    });
  }
}

// PUT /purchases/:id - Actualizar compra
export async function updatePurchase(req: TenantRequest, res: Response) {
  try {
    const { id } = req.params;
    const prisma = req.tenantPrisma;

    if (!prisma) {
      return res.status(500).json({
        error: { code: 'PRISMA_NOT_INITIALIZED', message: 'Database connection not available' }
      });
    }

    const { supplierId, purchaseDate, deliveryDate, subtotal, tax, discount, total, notes, status, branchId, items } = req.body;
    const currentPurchase = await prisma.purchase.findUnique({
      where: { id },
      select: { paid: true },
    });

    if (!currentPurchase) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Compra no encontrada' }
      });
    }

    const normalizedItems = Array.isArray(items) ? normalizePurchaseItems(items) : null;
    const itemTotals = normalizedItems && normalizedItems.length > 0 ? calculatePurchaseTotals(normalizedItems) : null;

    // Calcular total si se proporcionan los componentes
    const calculatedTotal = itemTotals
      ? itemTotals.total
      : total !== undefined ? total :
        (subtotal !== undefined ? Number(subtotal) + Number(tax || 0) - Number(discount || 0) : undefined);

    const updateData: any = {};
    
    if (supplierId !== undefined) updateData.supplierId = supplierId;
    if (branchId !== undefined) updateData.branchId = branchId || null;
    if (purchaseDate !== undefined) updateData.purchaseDate = new Date(purchaseDate);
    if (deliveryDate !== undefined) updateData.deliveryDate = deliveryDate ? new Date(deliveryDate) : null;
    if (itemTotals) {
      updateData.subtotal = itemTotals.subtotal;
      updateData.tax = itemTotals.tax;
      updateData.discount = itemTotals.discount;
    } else {
      if (subtotal !== undefined) updateData.subtotal = Number(subtotal);
      if (tax !== undefined) updateData.tax = Number(tax);
      if (discount !== undefined) updateData.discount = Number(discount);
    }
    if (calculatedTotal !== undefined) {
      updateData.total = Number(calculatedTotal);
      updateData.balance = Math.max(Number(calculatedTotal) - Number(currentPurchase.paid || 0), 0);
    }
    if (notes !== undefined) updateData.notes = notes;
    if (status !== undefined) updateData.status = status;

    const purchase = await prisma.$transaction(async (tx) => {
      if (normalizedItems) {
        await tx.purchaseItem.deleteMany({
          where: { purchaseId: id }
        });
      }

      return tx.purchase.update({
        where: { id },
        data: {
          ...updateData,
          items: normalizedItems ? {
            create: normalizedItems.map((item) => ({
              productId: item.productId,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              tax: item.tax || 0,
              discount: item.discount || 0,
              total: (item.quantity * item.unitPrice) + Number(item.tax || 0) - Number(item.discount || 0),
            }))
          } : undefined
        },
        include: {
          supplier: {
            select: {
              id: true,
              code: true,
              name: true
            }
          },
          items: true,
        }
      });
    });

    res.json({
      success: true,
      data: purchase,
      message: 'Compra actualizada exitosamente'
    });
  } catch (error: any) {
    console.error('Update purchase error:', error);
    res.status(500).json({
      error: { 
        code: 'INTERNAL_ERROR', 
        message: 'Error al actualizar compra',
        details: error.message
      }
    });
  }
}

// DELETE /purchases/:id - Eliminar compra
export async function deletePurchase(req: TenantRequest, res: Response) {
  try {
    const { id } = req.params;
    const prisma = req.tenantPrisma;

    if (!prisma) {
      return res.status(500).json({
        error: { code: 'PRISMA_NOT_INITIALIZED', message: 'Database connection not available' }
      });
    }

    await prisma.purchase.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Compra eliminada correctamente'
    });
  } catch (error) {
    console.error('Delete purchase error:', error);
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Error al eliminar compra' }
    });
  }
}

// POST /purchases/:id/receive - Marcar compra como recibida
export async function receivePurchase(req: TenantRequest, res: Response) {
  try {
    const { id } = req.params;
    const prisma = req.tenantPrisma;

    if (!prisma) {
      return res.status(500).json({
        error: { code: 'PRISMA_NOT_INITIALIZED', message: 'Database connection not available' }
      });
    }

    const purchase = await prisma.purchase.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!purchase) {
      return res.status(404).json({
        error: { code: 'PURCHASE_NOT_FOUND', message: 'Compra no encontrada' }
      });
    }

    if (purchase.status === 'RECEIVED') {
      return res.json({
        success: true,
        data: purchase,
        stockUpdated: false,
        message: 'La compra ya estaba recibida',
      });
    }

    if (purchase.items.length > 0 && !purchase.branchId) {
      return res.status(400).json({
        error: { code: 'BRANCH_REQUIRED', message: 'La compra debe tener sucursal para actualizar inventario' }
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedPurchase = await tx.purchase.update({
        where: { id },
        data: {
          status: 'RECEIVED',
          deliveryDate: purchase.deliveryDate || new Date(),
        },
        include: {
          items: true,
          supplier: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      let stockUpdated = 0;

      for (const item of purchase.items) {
        if (!item.productId || !purchase.branchId) {
          continue;
        }

        const product = await tx.product.findUnique({
          where: { id: item.productId },
          select: {
            id: true,
            code: true,
            name: true,
            controlsStock: true,
            minStock: true,
          },
        });

        if (!product || !product.controlsStock) {
          continue;
        }

        const quantity = Number(item.quantity);
        const existingStock = await tx.stock.findUnique({
          where: {
            productId_branchId: {
              productId: item.productId,
              branchId: purchase.branchId,
            },
          },
        });

        const newQuantity = Number(existingStock?.quantity || 0) + quantity;

        await tx.stock.upsert({
          where: {
            productId_branchId: {
              productId: item.productId,
              branchId: purchase.branchId,
            },
          },
          update: {
            quantity: newQuantity,
          },
          create: {
            productId: item.productId,
            branchId: purchase.branchId,
            quantity: newQuantity,
            minStock: Number(product.minStock) || 0,
          },
        });

        await tx.inventoryMovement.create({
          data: {
            productId: item.productId,
            branchId: purchase.branchId,
            type: 'ADJUSTMENT_ENTRY',
            quantity,
            balance: newQuantity,
            documentType: 'PurchaseReceipt',
            documentId: purchase.id,
            userId: purchase.userId,
            observations: `Recepcion de compra ${purchase.code}`,
          },
        });

        stockUpdated += 1;
      }

      return {
        purchase: updatedPurchase,
        stockUpdated,
      };
    });

    res.json({
      success: true,
      data: result.purchase,
      stockUpdated: result.stockUpdated,
      message: result.stockUpdated > 0
        ? 'Compra recibida y stock actualizado'
        : 'Compra recibida exitosamente',
    });
  } catch (error) {
    console.error('Receive purchase error:', error);
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Error al recibir compra' }
    });
  }
}

// POST /purchases/:id/create-invoice - Crear factura desde compra
export async function createInvoiceFromPurchase(req: TenantRequest, res: Response) {
  try {
    const { id } = req.params;
    const prisma = req.tenantPrisma;

    if (!prisma) {
      return res.status(500).json({
        error: { code: 'PRISMA_NOT_INITIALIZED', message: 'Database connection not available' }
      });
    }

    const { purchase, invoice, invoiceCode } = await buildSupplierInvoiceFromPurchase(prisma, id);

    res.status(201).json({
      success: true,
      data: invoice,
      message: `Factura ${invoiceCode} generada exitosamente para compra ${purchase.code}`
    });
  } catch (error: any) {
    if (error?.statusCode) {
      return res.status(error.statusCode).json({
        error: {
          code: error.code || 'BUSINESS_RULE_ERROR',
          message: error.message,
        },
        data: error.data,
      });
    }

    console.error('Create invoice from purchase error:', error);
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Error al crear factura' }
    });
  }
}
