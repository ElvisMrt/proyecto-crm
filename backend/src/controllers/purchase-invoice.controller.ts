import { Response } from 'express';
import { TenantRequest } from '../middleware/tenant.middleware';

// POST /purchases/:id/generate-invoice - Generar factura para una compra existente
export async function generateInvoiceForPurchase(req: TenantRequest, res: Response) {
  try {
    const { id } = req.params;
    const prisma = req.tenantPrisma;

    if (!prisma) {
      return res.status(500).json({
        error: { code: 'PRISMA_NOT_INITIALIZED', message: 'Database connection not available' }
      });
    }

    // Verificar que la compra existe
    const purchase = await prisma.purchase.findUnique({
      where: { id },
      include: {
        supplier: true
      }
    });

    if (!purchase) {
      return res.status(404).json({
        error: { code: 'PURCHASE_NOT_FOUND', message: 'Compra no encontrada' }
      });
    }

    // Verificar si ya tiene una factura
    const existingInvoice = await prisma.supplierInvoice.findFirst({
      where: { purchaseId: id }
    });

    if (existingInvoice) {
      return res.status(400).json({
        error: { code: 'INVOICE_EXISTS', message: 'Esta compra ya tiene una factura asociada' },
        data: existingInvoice
      });
    }

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
    const invoiceDate = purchase.purchaseDate;
    const dueDate = new Date(invoiceDate);
    dueDate.setDate(dueDate.getDate() + 30);

    // Crear la factura
    const invoice = await prisma.supplierInvoice.create({
      data: {
        code: invoiceCode,
        supplierId: purchase.supplierId,
        purchaseId: purchase.id,
        invoiceDate,
        dueDate,
        subtotal: purchase.subtotal,
        tax: purchase.tax,
        discount: purchase.discount,
        total: purchase.total,
        paid: 0,
        balance: purchase.total,
        status: 'PENDING',
        notes: `Factura generada para compra ${purchase.code}`
      }
    });

    console.log('✅ Invoice created for existing purchase:', invoice.code);

    res.status(201).json({
      success: true,
      data: invoice,
      message: `Factura ${invoiceCode} generada exitosamente para compra ${purchase.code}`
    });
  } catch (error: any) {
    console.error('❌ Generate invoice error:', error);
    res.status(500).json({
      error: { 
        code: 'INTERNAL_ERROR', 
        message: 'Error al generar factura',
        details: error.message
      }
    });
  }
}
