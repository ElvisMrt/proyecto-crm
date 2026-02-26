import { Response } from 'express';
import { TenantRequest } from '../middleware/tenant.middleware';

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

    let purchases = [];
    let total = 0;

    try {
      [purchases, total] = await Promise.all([
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
    res.status(404).json({
      error: { code: 'NOT_FOUND', message: 'Compra no encontrada' }
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

    const { supplierId, purchaseDate, total, notes, status } = req.body;

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

    // Preparar datos para crear la compra
    const totalValue = parseFloat(String(total || 0));
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
        branchId: (req as any).branchId || null,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
        total: totalValue,
        subtotal: totalValue,
        tax: 0,
        discount: 0,
        notes: notes || null,
        status: status || 'PENDING'
      },
      include: {
        supplier: {
          select: {
            id: true,
            code: true,
            name: true
          }
        }
      }
    });

    console.log('✅ Purchase created:', purchase.id);

    // Generar factura automáticamente
    console.log('📝 Generating invoice for purchase...');
    
    // Obtener el último número de factura
    const lastInvoice = await prisma.supplierInvoice.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { code: true }
    });

    let invoiceCode = 'FINV-000001';
    if (lastInvoice && lastInvoice.code) {
      const match = lastInvoice.code.match(/FINV-(\d+)/);
      if (match) {
        const nextNumber = parseInt(match[1]) + 1;
        invoiceCode = `FINV-${String(nextNumber).padStart(6, '0')}`;
      }
    }

    // Calcular fecha de vencimiento (30 días después de la fecha de compra)
    const invoiceDate = purchaseDate ? new Date(purchaseDate) : new Date();
    const dueDate = new Date(invoiceDate);
    dueDate.setDate(dueDate.getDate() + 30);

    console.log('📝 Creating invoice with data:', {
      code: invoiceCode,
      supplierId,
      purchaseId: purchase.id,
      branchId: (req as any).branchId || null,
      invoiceDate,
      dueDate,
      total: totalValue
    });

    const invoice = await prisma.supplierInvoice.create({
      data: {
        code: invoiceCode,
        supplierId,
        purchaseId: purchase.id,
        branchId: (req as any).branchId || null,
        invoiceDate,
        dueDate,
        subtotal: totalValue,
        tax: 0,
        discount: 0,
        total: totalValue,
        paid: 0,
        balance: totalValue,
        status: 'PENDING',
        notes: `Factura generada automáticamente para compra ${code}`
      }
    });

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

    const { supplierId, purchaseDate, deliveryDate, subtotal, tax, discount, total, notes, status } = req.body;

    // Calcular total si se proporcionan los componentes
    const calculatedTotal = total !== undefined ? total : 
      (subtotal !== undefined ? Number(subtotal) + Number(tax || 0) - Number(discount || 0) : undefined);

    const updateData: any = {};
    
    if (supplierId !== undefined) updateData.supplierId = supplierId;
    if (purchaseDate !== undefined) updateData.purchaseDate = new Date(purchaseDate);
    if (deliveryDate !== undefined) updateData.deliveryDate = deliveryDate ? new Date(deliveryDate) : null;
    if (subtotal !== undefined) updateData.subtotal = Number(subtotal);
    if (tax !== undefined) updateData.tax = Number(tax);
    if (discount !== undefined) updateData.discount = Number(discount);
    if (calculatedTotal !== undefined) updateData.total = Number(calculatedTotal);
    if (notes !== undefined) updateData.notes = notes;
    if (status !== undefined) updateData.status = status;

    const purchase = await prisma.purchase.update({
      where: { id },
      data: updateData,
      include: {
        supplier: {
          select: {
            id: true,
            code: true,
            name: true
          }
        }
      }
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
    res.status(501).json({
      error: { code: 'NOT_IMPLEMENTED', message: 'Funcionalidad no implementada' }
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
    res.status(501).json({
      error: { code: 'NOT_IMPLEMENTED', message: 'Funcionalidad no implementada' }
    });
  } catch (error) {
    console.error('Create invoice from purchase error:', error);
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Error al crear factura' }
    });
  }
}
