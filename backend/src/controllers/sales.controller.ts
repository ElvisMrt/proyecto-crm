import { Response } from 'express';
import { PrismaClient, InvoiceStatus, PaymentMethod, InvoiceType, QuoteStatus } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';
import { z } from 'zod';
import { getNextNcf } from './ncf.controller';
import { validateIdentification } from '../utils/identificationValidator';

const prisma = new PrismaClient();

const createInvoiceSchema = z.object({
  clientId: z.string().uuid().optional(), // Cliente es opcional
  type: z.enum(['FISCAL', 'NON_FISCAL']),
  paymentMethod: z.enum(['CASH', 'TRANSFER', 'CARD', 'CREDIT', 'MIXED']),
  issueDate: z.string().datetime().optional(),
  dueDate: z.string().datetime().optional(),
  branchId: z.string().uuid().optional(),
  items: z.array(z.object({
    productId: z.string().uuid().optional(),
    description: z.string(),
    quantity: z.number().positive(),
    price: z.number().nonnegative(),
    discount: z.number().nonnegative().default(0),
  })),
  discount: z.number().nonnegative().default(0),
  observations: z.string().optional(),
  saveAsDraft: z.boolean().optional().default(false),
  amountReceived: z.number().nonnegative().optional(), // For POS: amount received in cash
  includeTax: z.boolean().optional(), // ITBIS opcional (si no se proporciona, usa type === 'FISCAL' como default)
});

export const getInvoices = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    // Handle OVERDUE status filter - need to check dueDate and balance
    if (req.query.status === 'OVERDUE') {
      const now = new Date();
      where.status = InvoiceStatus.ISSUED; // Only issued invoices can be overdue
      where.dueDate = { lt: now }; // Due date has passed
      where.balance = { gt: 0 }; // Still has balance
    } else if (req.query.status) {
      where.status = req.query.status;
    }

    if (req.query.type) {
      where.type = req.query.type;
    }

    if (req.query.clientId) {
      where.clientId = req.query.clientId;
    }

    if (req.query.branchId) {
      where.branchId = req.query.branchId;
    }

    if (req.query.paymentMethod) {
      where.paymentMethod = req.query.paymentMethod;
    }

    if (req.query.startDate || req.query.endDate) {
      where.issueDate = {};
      if (req.query.startDate) {
        where.issueDate.gte = new Date(req.query.startDate as string);
      }
      if (req.query.endDate) {
        const endDate = new Date(req.query.endDate as string);
        endDate.setHours(23, 59, 59, 999);
        where.issueDate.lte = endDate;
      }
    }

    if (req.query.minAmount || req.query.maxAmount) {
      where.total = {};
      if (req.query.minAmount) {
        where.total.gte = parseFloat(req.query.minAmount as string);
      }
      if (req.query.maxAmount) {
        where.total.lte = parseFloat(req.query.maxAmount as string);
      }
    }

    if (req.query.search) {
      where.OR = [
        { number: { contains: req.query.search as string, mode: 'insensitive' } },
        { ncf: { contains: req.query.search as string, mode: 'insensitive' } },
        { client: { name: { contains: req.query.search as string, mode: 'insensitive' } } },
      ];
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          client: {
            select: {
              id: true,
              name: true,
            },
          },
          branch: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.invoice.count({ where }),
    ]);

    const now = new Date();

    res.json({
      data: invoices.map((invoice) => {
        // Calculate dynamic status based on current balance and due date
        let calculatedStatus = invoice.status;
        const balance = Number(invoice.balance);
        
        // If fully paid (balance = 0), always mark as PAID regardless of stored status
        if (balance === 0) {
          calculatedStatus = InvoiceStatus.PAID;
        }
        // If has balance and due date passed, mark as OVERDUE (only if currently ISSUED)
        else if (
          invoice.status === InvoiceStatus.ISSUED &&
          invoice.dueDate &&
          invoice.dueDate < now &&
          balance > 0
        ) {
          calculatedStatus = InvoiceStatus.OVERDUE;
        }
        // If status is PAID but has balance, correct to ISSUED or OVERDUE
        else if (invoice.status === InvoiceStatus.PAID && balance > 0) {
          if (invoice.dueDate && invoice.dueDate < now) {
            calculatedStatus = InvoiceStatus.OVERDUE;
          } else {
            calculatedStatus = InvoiceStatus.ISSUED;
          }
        }
        
        return {
        id: invoice.id,
        number: invoice.number,
        ncf: invoice.ncf,
        client: invoice.client,
        branch: invoice.branch,
          status: calculatedStatus,
        type: invoice.type,
        paymentMethod: invoice.paymentMethod,
        total: Number(invoice.total),
          balance: balance,
        issueDate: invoice.issueDate,
          dueDate: invoice.dueDate,
        };
      }),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error fetching invoices',
      },
    });
  }
};

export const getInvoice = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            identification: true,
            email: true,
            phone: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
          },
        },
        payments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            paymentDate: 'desc',
          },
        },
        creditNotes: {
          select: {
            id: true,
            number: true,
            ncf: true,
            reason: true,
            total: true,
            issueDate: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!invoice) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Invoice not found',
        },
      });
    }

    // Get cancelled by user if exists
    let cancelledByUser = null;
    if (invoice.cancelledBy) {
      const cancelledBy = await prisma.user.findUnique({
        where: { id: invoice.cancelledBy },
        select: {
          id: true,
          name: true,
        },
      });
      cancelledByUser = cancelledBy;
    }

    // Calculate dynamic status based on current balance and due date
    const now = new Date();
    let calculatedStatus = invoice.status;
    const balance = Number(invoice.balance);
    
    // If fully paid (balance = 0), always mark as PAID regardless of stored status
    if (balance === 0) {
      calculatedStatus = InvoiceStatus.PAID;
    }
    // If has balance and due date passed, mark as OVERDUE (only if currently ISSUED)
    else if (
      invoice.status === InvoiceStatus.ISSUED &&
      invoice.dueDate &&
      invoice.dueDate < now &&
      balance > 0
    ) {
      calculatedStatus = InvoiceStatus.OVERDUE;
    }
    // If status is PAID but has balance, correct to ISSUED or OVERDUE
    else if (invoice.status === InvoiceStatus.PAID && balance > 0) {
      if (invoice.dueDate && invoice.dueDate < now) {
        calculatedStatus = InvoiceStatus.OVERDUE;
      } else {
        calculatedStatus = InvoiceStatus.ISSUED;
      }
    }

    res.json({
      ...invoice,
      status: calculatedStatus,
      cancelledByUser,
      subtotal: Number(invoice.subtotal),
      tax: Number(invoice.tax),
      discount: Number(invoice.discount),
      total: Number(invoice.total),
      balance: Number(invoice.balance),
      items: invoice.items.map((item) => ({
        ...item,
        quantity: Number(item.quantity),
        price: Number(item.price),
        discount: Number(item.discount),
        subtotal: Number(item.subtotal),
      })),
    });
  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error fetching invoice',
      },
    });
  }
};

export const createInvoice = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Not authenticated',
        },
      });
    }

    const data = createInvoiceSchema.parse(req.body);

    // Validar RNC/Cédula del cliente SOLO si es factura fiscal, hay cliente, y NO es borrador
    // Las facturas no fiscales o borradores no requieren validación de identificación
    if (data.type === 'FISCAL' && data.clientId && !data.saveAsDraft) {
      const client = await prisma.client.findUnique({
        where: { id: data.clientId },
        select: { identification: true, name: true },
      });

      if (!client) {
        return res.status(400).json({
          error: {
            code: 'CLIENT_NOT_FOUND',
            message: 'Cliente no encontrado',
          },
        });
      }

      if (!client.identification) {
        return res.status(400).json({
          error: {
            code: 'MISSING_CLIENT_IDENTIFICATION',
            message: 'El cliente no tiene RNC/Cédula registrado. Las facturas fiscales requieren identificación del cliente.',
          },
        });
      }

      // Validar formato de identificación
      const identificationValidation = validateIdentification(client.identification);
      if (!identificationValidation.isValid) {
        return res.status(400).json({
          error: {
            code: 'INVALID_CLIENT_IDENTIFICATION',
            message: `La identificación del cliente (${client.name}) es inválida: ${identificationValidation.error}. Por favor, actualice la identificación del cliente antes de emitir una factura fiscal.`,
          },
        });
      }
    }

    // Generate invoice number
    const lastInvoice = await prisma.invoice.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { number: true },
    });

    let nextNumber = 1;
    if (lastInvoice) {
      const match = lastInvoice.number.match(/#FA-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }

    const invoiceNumber = `#FA-${String(nextNumber).padStart(4, '0')}`;

    // Calculate totals
    let subtotal = 0;
    data.items.forEach((item) => {
      const itemSubtotal = item.quantity * item.price - item.discount;
      subtotal += itemSubtotal;
    });

    subtotal -= data.discount;
    // ITBIS es opcional - se calcula solo si includeTax está marcado o si es FISCAL (compatibilidad hacia atrás)
    const tax = (data.includeTax !== undefined ? data.includeTax : data.type === 'FISCAL') ? subtotal * 0.18 : 0;
    const total = subtotal + tax;
    const balance = data.paymentMethod === 'CREDIT' ? total : 0;

    // Cliente es opcional - usar undefined si no se proporciona
    const clientId = data.clientId || undefined;

    // Obtener branchId del formulario o del primer branch activo
    let branchId = data.branchId || null;
    if (!branchId) {
      const firstBranch = await prisma.branch.findFirst({
        where: { isActive: true },
        orderBy: { name: 'asc' },
      });
      branchId = firstBranch?.id || null;
    }

    // Validate stock availability for products that control stock
    if (branchId) {
      for (const item of data.items) {
        if (item.productId) {
          const product = await prisma.product.findUnique({
            where: { id: item.productId },
            select: { 
              id: true,
              name: true,
              code: true,
              controlsStock: true,
            },
          });

          if (!product) {
            return res.status(400).json({
              error: {
                code: 'PRODUCT_NOT_FOUND',
                message: `Producto con ID ${item.productId} no encontrado`,
              },
            });
          }

          // Only validate stock if product controls stock
          if (product.controlsStock) {
            const stock = await prisma.stock.findFirst({
              where: {
                productId: item.productId,
                branchId: branchId,
              },
            });

            const availableStock = stock ? Number(stock.quantity) : 0;

            // Solo validar si hay stock disponible (permitir si stock es 0 o negativo para permitir ajustes)
            // Pero si hay stock y es insuficiente, bloquear
            if (availableStock > 0 && availableStock < item.quantity) {
              return res.status(400).json({
                error: {
                  code: 'INSUFFICIENT_STOCK',
                  message: `Stock insuficiente para el producto "${product.name}" (${product.code}). Stock disponible: ${availableStock.toFixed(2)}, Cantidad solicitada: ${item.quantity.toFixed(2)}`,
                  product: {
                    id: product.id,
                    name: product.name,
                    code: product.code,
                  },
                  availableStock,
                  requestedQuantity: item.quantity,
                },
              });
            }
          }
        }
      }
    }

    // Check cash register if cash payment
    if (data.paymentMethod === 'CASH') {
      const openCash = await prisma.cashRegister.findFirst({
        where: { 
          status: 'OPEN',
          branchId: branchId || undefined,
        },
      });

      if (!openCash) {
        return res.status(400).json({
          error: {
            code: 'CASH_NOT_OPEN',
            message: 'Cash register must be open for cash payments',
          },
        });
      }
    }

    // Determine status: DRAFT if saveAsDraft is true, otherwise ISSUED
    const invoiceStatus = data.saveAsDraft ? InvoiceStatus.DRAFT : InvoiceStatus.ISSUED;

    // Obtener NCF del sistema de secuencias si es factura fiscal (solo si no es borrador)
    let ncf: string | null = null;
    if (data.type === 'FISCAL' && !data.saveAsDraft) {
      ncf = await getNextNcf('FACE', branchId);
      if (!ncf) {
        return res.status(400).json({
          error: {
            code: 'NCF_NOT_AVAILABLE',
            message: 'No hay secuencias NCF disponibles para facturas fiscales. Por favor, configure una secuencia NCF en Configuración.',
          },
        });
      }
    }

    // Create invoice in transaction
    const invoice = await prisma.$transaction(async (tx) => {
      const invoiceData: any = {
        number: invoiceNumber,
        ncf: data.saveAsDraft ? null : ncf, // No NCF for drafts
        type: data.type as InvoiceType,
        status: invoiceStatus,
        paymentMethod: data.paymentMethod as PaymentMethod,
        subtotal,
        tax,
        discount: data.discount,
        total,
        balance: data.saveAsDraft ? 0 : balance, // No balance for drafts
        issueDate: data.issueDate ? new Date(data.issueDate) : new Date(),
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        userId: req.user!.id,
        branchId: branchId,
        observations: data.observations,
        items: {
          create: data.items.map((item) => ({
            productId: item.productId || null,
            description: item.description,
            quantity: item.quantity,
            price: item.price,
            discount: item.discount,
            subtotal: item.quantity * item.price - item.discount,
          })),
        },
      };

      // Cliente es opcional - solo incluir si se proporciona
      if (clientId) {
        invoiceData.clientId = clientId;
      }

      const newInvoice = await tx.invoice.create({
        data: invoiceData,
        include: {
          client: true,
          items: true,
        },
      });

      // Only update stock if not a draft
      if (!data.saveAsDraft) {
      // Update stock for each product
      for (const item of data.items) {
        if (item.productId && branchId) {
          // Find or create stock record
          const stock = await tx.stock.findFirst({
            where: {
              productId: item.productId,
              branchId: branchId,
            },
          });

          if (stock) {
            await tx.stock.update({
              where: { id: stock.id },
              data: {
                quantity: {
                  decrement: item.quantity,
                },
              },
            });
          } else {
            // Create stock record if it doesn't exist
            await tx.stock.create({
              data: {
                productId: item.productId,
                branchId: branchId,
                quantity: -item.quantity,
              },
            });
          }

          // Get current balance after update
          const updatedStock = await tx.stock.findFirst({
            where: {
              productId: item.productId,
              branchId: branchId,
            },
          });
          const currentBalance = updatedStock ? Number(updatedStock.quantity) : 0;

          // Create inventory movement
          await tx.inventoryMovement.create({
            data: {
              productId: item.productId,
              branchId: branchId,
              type: 'SALE',
              quantity: -item.quantity,
              balance: currentBalance,
              documentType: 'Invoice',
              documentId: newInvoice.id,
              userId: req.user!.id,
            },
          });
        }
        }
      }

      // Create cash movement if cash payment and not draft
      if (!data.saveAsDraft && data.paymentMethod === 'CASH' && branchId) {
        const openCash = await tx.cashRegister.findFirst({
          where: { 
            status: 'OPEN',
            branchId: branchId,
          },
        });

        if (openCash) {
          await tx.cashMovement.create({
            data: {
              cashRegisterId: openCash.id,
              type: 'SALE',
              concept: `Factura ${invoiceNumber}`,
              amount: total,
              method: PaymentMethod.CASH,
              invoiceId: newInvoice.id,
              userId: req.user!.id,
              movementDate: new Date(), // Fecha explícita del movimiento
            },
          });
        }
      }

      return newInvoice;
    });

    // Check if this is a POS sale (has amountReceived) - return full invoice with change
    const requestData = req.body;
    if (requestData.amountReceived !== undefined) {
      // Get full invoice data for response
      const fullInvoice = await prisma.invoice.findUnique({
        where: { id: invoice.id },
        include: {
          client: {
            select: {
              id: true,
              name: true,
              identification: true,
              email: true,
              phone: true,
            },
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                },
              },
            },
          },
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      // Calculate change if cash payment and amountReceived provided
      let change = 0;
      if (requestData.paymentMethod === 'CASH' && requestData.amountReceived !== undefined) {
        change = Math.max(0, Number(requestData.amountReceived) - Number(invoice.total));
      }

      return res.status(201).json({
        invoice: {
          id: fullInvoice!.id,
          number: fullInvoice!.number,
          ncf: fullInvoice!.ncf,
          type: fullInvoice!.type,
          status: fullInvoice!.status,
          issueDate: fullInvoice!.issueDate,
          dueDate: fullInvoice!.dueDate,
          subtotal: Number(fullInvoice!.subtotal),
          tax: Number(fullInvoice!.tax),
          discount: Number(fullInvoice!.discount),
          total: Number(fullInvoice!.total),
          balance: Number(fullInvoice!.balance),
          paymentMethod: fullInvoice!.paymentMethod,
          observations: fullInvoice!.observations,
          client: fullInvoice!.client,
          items: fullInvoice!.items.map((item) => ({
            id: item.id,
            productId: item.productId,
            product: item.product,
            description: item.description,
            quantity: Number(item.quantity),
            price: Number(item.price),
            discount: Number(item.discount),
            subtotal: Number(item.subtotal),
          })),
          user: fullInvoice!.user,
        },
        change: change,
        amountReceived: requestData.amountReceived || Number(invoice.total),
      });
    }

    res.status(201).json({
      id: invoice.id,
      number: invoice.number,
      ncf: invoice.ncf,
      total: Number(invoice.total),
      balance: Number(invoice.balance),
      status: invoice.status,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input',
          details: error.errors,
        },
      });
    }

    console.error('Create invoice error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error creating invoice',
      },
    });
  }
};

export const updateInvoice = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Not authenticated',
        },
      });
    }

    const { id } = req.params;
    const data = createInvoiceSchema.parse(req.body);

    // Get existing invoice
    const existingInvoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        items: true,
        payments: true,
      },
    });

    if (!existingInvoice) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Invoice not found',
        },
      });
    }

    // Allow editing of draft or issued invoices that haven't been paid
    if (existingInvoice.status !== InvoiceStatus.ISSUED && existingInvoice.status !== InvoiceStatus.DRAFT) {
      return res.status(400).json({
        error: {
          code: 'INVALID_STATUS',
          message: 'Solo se pueden editar facturas en borrador o emitidas sin pagos',
        },
      });
    }

    // Check if invoice has payments
    if (existingInvoice.payments.length > 0) {
      return res.status(400).json({
        error: {
          code: 'HAS_PAYMENTS',
          message: 'Cannot edit invoice that has payments. Use credit note instead.',
        },
      });
    }

    // Validate client identification if fiscal
    if (data.type === 'FISCAL' && data.clientId) {
      const client = await prisma.client.findUnique({
        where: { id: data.clientId },
        select: { identification: true, name: true },
      });

      if (!client) {
        return res.status(400).json({
          error: {
            code: 'CLIENT_NOT_FOUND',
            message: 'Cliente no encontrado',
          },
        });
      }

      if (!client.identification) {
        return res.status(400).json({
          error: {
            code: 'MISSING_CLIENT_IDENTIFICATION',
            message: 'El cliente no tiene RNC/Cédula registrado. Las facturas fiscales requieren identificación del cliente.',
          },
        });
      }

      const identificationValidation = validateIdentification(client.identification);
      if (!identificationValidation.isValid) {
        return res.status(400).json({
          error: {
            code: 'INVALID_CLIENT_IDENTIFICATION',
            message: `La identificación del cliente (${client.name}) es inválida: ${identificationValidation.error}. Por favor, actualice la identificación del cliente antes de emitir una factura fiscal.`,
          },
        });
      }
    }

    // Calculate totals
    let subtotal = 0;
    data.items.forEach((item) => {
      const itemSubtotal = item.quantity * item.price - item.discount;
      subtotal += itemSubtotal;
    });

    subtotal -= data.discount;
    // ITBIS es opcional - se calcula solo si includeTax está marcado o si es FISCAL (compatibilidad hacia atrás)
    const tax = (data.includeTax !== undefined ? data.includeTax : data.type === 'FISCAL') ? subtotal * 0.18 : 0;
    const total = subtotal + tax;
    const balance = data.paymentMethod === 'CREDIT' ? total : 0;

    // Get branchId
    let branchId = data.branchId || existingInvoice.branchId;
    if (!branchId) {
      const firstBranch = await prisma.branch.findFirst({
        where: { isActive: true },
        orderBy: { name: 'asc' },
      });
      branchId = firstBranch?.id || null;
    }

    // Validate stock availability for products that control stock
    if (branchId) {
      // First, restore stock from old items to get accurate available stock
      const oldItemsStock: Record<string, number> = {};
      
      for (const oldItem of existingInvoice.items) {
        if (oldItem.productId) {
          const stock = await prisma.stock.findFirst({
            where: {
              productId: oldItem.productId,
              branchId: branchId,
            },
          });
          const currentStock = stock ? Number(stock.quantity) : 0;
          // Add back the old quantity to get the stock before this invoice
          oldItemsStock[oldItem.productId] = currentStock + Number(oldItem.quantity);
        }
      }

      // Now validate new items
      for (const item of data.items) {
        if (item.productId) {
          const product = await prisma.product.findUnique({
            where: { id: item.productId },
            select: { 
              id: true,
              name: true,
              code: true,
              controlsStock: true,
            },
          });

          if (!product) {
            return res.status(400).json({
              error: {
                code: 'PRODUCT_NOT_FOUND',
                message: `Producto con ID ${item.productId} no encontrado`,
              },
            });
          }

          // Only validate stock if product controls stock
          if (product.controlsStock) {
            // Get available stock (considering old items that will be restored)
            let availableStock = 0;
            
            if (oldItemsStock[item.productId] !== undefined) {
              // This product was in the old invoice, use restored stock
              availableStock = oldItemsStock[item.productId];
            } else {
              // New product, get current stock
              const stock = await prisma.stock.findFirst({
                where: {
                  productId: item.productId,
                  branchId: branchId,
                },
              });
              availableStock = stock ? Number(stock.quantity) : 0;
            }

            // Check if we're increasing quantity for a product that was already in the invoice
            const oldItem = existingInvoice.items.find(i => i.productId === item.productId);
            if (oldItem) {
              const oldQuantity = Number(oldItem.quantity);
              const additionalQuantity = item.quantity - oldQuantity;
              
              if (additionalQuantity > 0 && availableStock < additionalQuantity) {
                return res.status(400).json({
                  error: {
                    code: 'INSUFFICIENT_STOCK',
                    message: `Stock insuficiente para aumentar la cantidad del producto "${product.name}" (${product.code}). Stock disponible: ${availableStock.toFixed(2)}, Cantidad adicional solicitada: ${additionalQuantity.toFixed(2)}`,
                    product: {
                      id: product.id,
                      name: product.name,
                      code: product.code,
                    },
                    availableStock,
                    requestedQuantity: item.quantity,
                    oldQuantity,
                  },
                });
              }
            } else if (availableStock > 0 && availableStock < item.quantity) {
              // New item or increased quantity beyond available
              return res.status(400).json({
                error: {
                  code: 'INSUFFICIENT_STOCK',
                  message: `Stock insuficiente para el producto "${product.name}" (${product.code}). Stock disponible: ${availableStock.toFixed(2)}, Cantidad solicitada: ${item.quantity.toFixed(2)}`,
                  product: {
                    id: product.id,
                    name: product.name,
                    code: product.code,
                  },
                  availableStock,
                  requestedQuantity: item.quantity,
                },
              });
            }
          }
        }
      }
    }

    // Check cash register if cash payment
    if (data.paymentMethod === 'CASH') {
      const openCash = await prisma.cashRegister.findFirst({
        where: { 
          status: 'OPEN',
          branchId: branchId || undefined,
        },
      });

      if (!openCash) {
        return res.status(400).json({
          error: {
            code: 'CASH_NOT_OPEN',
            message: 'Cash register must be open for cash payments',
          },
        });
      }
    }

      // Update invoice in transaction
    const updatedInvoice = await prisma.$transaction(async (tx) => {
      // Get existing cash movement if any
      const existingCashMovement = await tx.cashMovement.findFirst({
        where: { invoiceId: id },
      });

      // Handle cash movement changes
      if (existingCashMovement) {
        // If payment method changed from cash to something else, delete cash movement
        if (data.paymentMethod !== 'CASH') {
          await tx.cashMovement.delete({
            where: { id: existingCashMovement.id },
          });
        } else if (existingCashMovement.amount !== total) {
          // If still cash but amount changed, update cash movement
          await tx.cashMovement.update({
            where: { id: existingCashMovement.id },
            data: { amount: total },
          });
        }
      } else if (data.paymentMethod === 'CASH' && branchId) {
        // If payment method changed from credit to cash, create cash movement
        const openCash = await tx.cashRegister.findFirst({
          where: { 
            status: 'OPEN',
            branchId: branchId,
          },
        });

        if (openCash) {
          await tx.cashMovement.create({
            data: {
              cashRegisterId: openCash.id,
              type: 'SALE',
              concept: `Factura ${existingInvoice.number}`,
              amount: total,
              method: PaymentMethod.CASH,
              invoiceId: id,
              userId: req.user!.id,
            },
          });
        }
      }

      // Delete old items
      await tx.invoiceItem.deleteMany({
        where: { invoiceId: id },
      });

      // Restore old stock
      for (const oldItem of existingInvoice.items) {
        if (oldItem.productId && branchId) {
          const stock = await tx.stock.findFirst({
            where: {
              productId: oldItem.productId,
              branchId: branchId,
            },
          });

          if (stock) {
            await tx.stock.update({
              where: { id: stock.id },
              data: {
                quantity: {
                  increment: Number(oldItem.quantity),
                },
              },
            });
          }
        }
      }

      // Update invoice
      const invoiceData: any = {
        type: data.type as InvoiceType,
        paymentMethod: data.paymentMethod as PaymentMethod,
        subtotal,
        tax,
        discount: data.discount,
        total,
        balance,
        issueDate: data.issueDate ? new Date(data.issueDate) : existingInvoice.issueDate,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        branchId: branchId,
        observations: data.observations,
        items: {
          create: data.items.map((item) => ({
            productId: item.productId || null,
            description: item.description,
            quantity: item.quantity,
            price: item.price,
            discount: item.discount,
            subtotal: item.quantity * item.price - item.discount,
          })),
        },
      };

      // Cliente es opcional - solo incluir si se proporciona
      if (data.clientId) {
        invoiceData.clientId = data.clientId;
      } else if (existingInvoice.clientId) {
        // Si se está eliminando el cliente, establecerlo como null
        invoiceData.clientId = null;
      }

      const updated = await tx.invoice.update({
        where: { id },
        data: invoiceData,
        include: {
          client: true,
          items: true,
        },
      });

      // Update stock for new items
      for (const item of data.items) {
        if (item.productId && branchId) {
          // Get product to check if it controls stock and get minStock
          const product = await tx.product.findUnique({
            where: { id: item.productId },
            select: { 
              id: true,
              controlsStock: true,
              minStock: true,
            },
          });

          // Only process if product controls stock
          if (!product || !product.controlsStock) {
            continue;
          }

          const stock = await tx.stock.findFirst({
            where: {
              productId: item.productId,
              branchId: branchId,
            },
          });

          if (stock) {
            await tx.stock.update({
              where: { id: stock.id },
              data: {
                quantity: {
                  decrement: item.quantity,
                },
              },
            });

            // Get current balance after update
            const updatedStock = await tx.stock.findFirst({
              where: {
                productId: item.productId,
                branchId: branchId,
              },
            });
            const currentBalance = updatedStock ? Number(updatedStock.quantity) : 0;

            // Create inventory movement
            await tx.inventoryMovement.create({
              data: {
                productId: item.productId,
                branchId: branchId,
                type: 'SALE',
                quantity: -item.quantity,
                balance: currentBalance,
                documentType: 'Invoice',
                documentId: id,
                userId: req.user!.id,
                observations: 'Actualización de factura',
              },
            });
          } else {
            // Create stock record if it doesn't exist (start with 0, then subtract)
            const newQuantity = 0 - Number(item.quantity);
            await tx.stock.create({
              data: {
                productId: item.productId,
                branchId: branchId,
                quantity: newQuantity,
                minStock: Number(product.minStock) || 0,
              },
            });

            // Create inventory movement
            await tx.inventoryMovement.create({
              data: {
                productId: item.productId,
                branchId: branchId,
                type: 'SALE',
                quantity: -item.quantity,
                balance: newQuantity,
                documentType: 'Invoice',
                documentId: id,
                userId: req.user!.id,
                observations: 'Actualización de factura',
              },
            });
          }
        }
      }

      return updated;
    });

    res.json({
      id: updatedInvoice.id,
      number: updatedInvoice.number,
      ncf: updatedInvoice.ncf,
      total: Number(updatedInvoice.total),
      balance: Number(updatedInvoice.balance),
      status: updatedInvoice.status,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input',
          details: error.errors,
        },
      });
    }

    console.error('Update invoice error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error updating invoice',
      },
    });
  }
};

export const duplicateInvoice = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Not authenticated',
        },
      });
    }

    const { id } = req.params;

    // Get original invoice
    const originalInvoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        items: true,
        client: true,
      },
    });

    if (!originalInvoice) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Invoice not found',
        },
      });
    }

    // Generate new invoice number
    const lastInvoice = await prisma.invoice.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { number: true },
    });

    let nextNumber = 1;
    if (lastInvoice) {
      const match = lastInvoice.number.match(/#FA-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }

    const invoiceNumber = `#FA-${String(nextNumber).padStart(4, '0')}`;

    // Create duplicate invoice (as draft, not issued)
    const duplicate = await prisma.invoice.create({
      data: {
        number: invoiceNumber,
        ncf: null, // No NCF for draft
        clientId: originalInvoice.clientId,
        type: originalInvoice.type,
        status: InvoiceStatus.DRAFT, // Create as draft so it doesn't affect inventory/cash
        paymentMethod: originalInvoice.paymentMethod,
        subtotal: originalInvoice.subtotal,
        tax: originalInvoice.tax,
        discount: originalInvoice.discount,
        total: originalInvoice.total,
        balance: originalInvoice.paymentMethod === 'CREDIT' ? originalInvoice.total : 0,
        issueDate: new Date(), // Set current date as issue date
        dueDate: originalInvoice.dueDate,
        userId: req.user.id,
        branchId: originalInvoice.branchId,
        observations: originalInvoice.observations ? `Copia de ${originalInvoice.number}` : `Copia de ${originalInvoice.number}`,
        items: {
          create: originalInvoice.items.map((item) => ({
            productId: item.productId || null,
            description: item.description,
            quantity: item.quantity,
            price: item.price,
            discount: item.discount,
            subtotal: item.subtotal,
          })),
        },
      },
      include: {
        client: true,
        items: true,
      },
    });

    res.status(201).json({
      id: duplicate.id,
      number: duplicate.number,
      total: Number(duplicate.total),
      status: duplicate.status,
    });
  } catch (error) {
    console.error('Duplicate invoice error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error duplicating invoice',
      },
    });
  }
};

export const cancelInvoice = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Not authenticated',
        },
      });
    }

    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Cancellation reason is required',
        },
      });
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        items: true,
        branch: true,
        payments: {
          select: {
            id: true,
            amount: true,
          },
        },
      },
    });

    if (!invoice) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Invoice not found',
        },
      });
    }

    if (invoice.status === InvoiceStatus.CANCELLED) {
      return res.status(400).json({
        error: {
          code: 'ALREADY_CANCELLED',
          message: 'Invoice is already cancelled',
        },
      });
    }

    // Check if invoice has payments - cannot cancel if it has partial payments
    if (invoice.payments && invoice.payments.length > 0) {
      const totalPaid = invoice.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
      if (totalPaid > 0) {
        return res.status(400).json({
          error: {
            code: 'HAS_PAYMENTS',
            message: 'No se puede anular una factura que ya tiene pagos registrados. Use una Nota de Crédito para revertir parcialmente la factura.',
            totalPaid,
            invoiceTotal: Number(invoice.total),
          },
        });
      }
    }

    // Cancel invoice in transaction
    await prisma.$transaction(async (tx) => {
      // Update invoice status
      await tx.invoice.update({
        where: { id },
        data: {
          status: InvoiceStatus.CANCELLED,
          cancelledAt: new Date(),
          cancellationReason: reason,
          cancelledBy: req.user!.id,
        },
      });

      // Get branch from invoice
      const branchId = invoice.branchId;
      
      // Restore stock
      for (const item of invoice.items) {
        if (item.productId && branchId) {
          const stock = await tx.stock.findFirst({
            where: {
              productId: item.productId,
              branchId: branchId,
            },
          });

          if (stock) {
            await tx.stock.update({
              where: { id: stock.id },
              data: {
                quantity: {
                  increment: Number(item.quantity),
                },
              },
            });
          }

          // Get current balance after update
          const updatedStock = await tx.stock.findFirst({
            where: {
              productId: item.productId,
              branchId: branchId,
            },
          });
          const currentBalance = updatedStock ? Number(updatedStock.quantity) : 0;

          // Create inventory movement
          await tx.inventoryMovement.create({
            data: {
              productId: item.productId,
              branchId: branchId,
              type: 'ADJUSTMENT_ENTRY',
              quantity: Number(item.quantity),
              balance: currentBalance,
              documentType: 'InvoiceCancellation',
              documentId: invoice.id,
              userId: req.user!.id,
              observations: `Anulación: ${reason}`,
            },
          });
        }
      }
    });

    res.json({
      message: 'Invoice cancelled successfully',
      invoice: {
        id: invoice.id,
        status: InvoiceStatus.CANCELLED,
      },
    });
  } catch (error) {
    console.error('Cancel invoice error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error cancelling invoice',
      },
    });
  }
};

export const deleteInvoice = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Not authenticated',
        },
      });
    }

    const { id } = req.params;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!invoice) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Invoice not found',
        },
      });
    }

    // Only allow deletion of DRAFT invoices
    if (invoice.status !== InvoiceStatus.DRAFT) {
      return res.status(400).json({
        error: {
          code: 'CANNOT_DELETE',
          message: 'Solo se pueden eliminar facturas en estado borrador. Las facturas emitidas deben ser anuladas, no eliminadas.',
        },
      });
    }

    // Delete invoice (items will be deleted automatically due to cascade)
    await prisma.invoice.delete({
      where: { id },
    });

    res.json({
      message: 'Invoice deleted successfully',
    });
  } catch (error) {
    console.error('Delete invoice error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error deleting invoice',
      },
    });
  }
};

// ============================================
// COTIZACIONES (QUOTES)
// ============================================

const createQuoteSchema = z.object({
  clientId: z.string().uuid().optional(),
  items: z.array(z.object({
    productId: z.string().uuid().optional(),
    description: z.string(),
    quantity: z.number().positive(),
    price: z.number().nonnegative(),
    discount: z.number().nonnegative().default(0),
  })),
  discount: z.number().nonnegative().default(0),
  validUntil: z.string().datetime().optional(),
  observations: z.string().optional(),
  includeTax: z.boolean().optional().default(false), // ITBIS opcional
});

export const getQuotes = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (req.query.status) {
      where.status = req.query.status;
    }

    if (req.query.clientId) {
      where.clientId = req.query.clientId;
    }

    if (req.query.search) {
      where.OR = [
        { number: { contains: req.query.search as string } },
      ];
    }

    const [quotes, total] = await Promise.all([
      prisma.quote.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          client: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.quote.count({ where }),
    ]);

    res.json({
      data: quotes.map((quote) => ({
        id: quote.id,
        number: quote.number,
        client: quote.client,
        status: quote.status,
        total: Number(quote.total),
        validUntil: quote.validUntil,
        createdAt: quote.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get quotes error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error fetching quotes',
      },
    });
  }
};

export const getQuote = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const quote = await prisma.quote.findUnique({
      where: { id },
      include: {
        client: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!quote) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Quote not found',
        },
      });
    }

    res.json({
      ...quote,
      subtotal: Number(quote.subtotal),
      tax: Number(quote.tax),
      discount: Number(quote.discount),
      total: Number(quote.total),
      items: quote.items.map((item) => ({
        ...item,
        quantity: Number(item.quantity),
        price: Number(item.price),
        discount: Number(item.discount),
        subtotal: Number(item.subtotal),
      })),
    });
  } catch (error) {
    console.error('Get quote error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error fetching quote',
      },
    });
  }
};

export const createQuote = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Not authenticated',
        },
      });
    }

    const data = createQuoteSchema.parse(req.body);

    // Generate quote number
    const lastQuote = await prisma.quote.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { number: true },
    });

    let nextNumber = 1;
    if (lastQuote) {
      const match = lastQuote.number.match(/#COT-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }

    const quoteNumber = `#COT-${String(nextNumber).padStart(4, '0')}`;

    // Calculate totals
    let subtotal = 0;
    data.items.forEach((item) => {
      const itemSubtotal = item.quantity * item.price - item.discount;
      subtotal += itemSubtotal;
    });

    subtotal -= data.discount;
    const tax = data.includeTax ? subtotal * 0.18 : 0; // 18% ITBIS solo si está marcado
    const total = subtotal + tax;

    const quoteData: any = {
        number: quoteNumber,
        status: QuoteStatus.OPEN,
        subtotal,
        tax,
        discount: data.discount,
        total,
        validUntil: data.validUntil ? new Date(data.validUntil) : null,
        userId: req.user.id,
        items: {
          create: data.items.map((item) => ({
            productId: item.productId || null,
            description: item.description,
            quantity: item.quantity,
            price: item.price,
            discount: item.discount,
            subtotal: item.quantity * item.price - item.discount,
          })),
        },
    };

    // Solo incluir clientId si se proporciona
    if (data.clientId) {
      quoteData.clientId = data.clientId;
    }

    const quote = await prisma.quote.create({
      data: quoteData,
      include: {
        client: true,
        items: true,
      },
    });

    res.status(201).json({
      id: quote.id,
      number: quote.number,
      total: Number(quote.total),
      status: quote.status,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input',
          details: error.errors,
        },
      });
    }

    console.error('Create quote error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error creating quote',
      },
    });
  }
};

export const updateQuote = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Not authenticated',
        },
      });
    }

    const { id } = req.params;
    const data = createQuoteSchema.parse(req.body);

    // Get existing quote
    const existingQuote = await prisma.quote.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!existingQuote) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Quote not found',
        },
      });
    }

    // Only allow editing of open quotes
    if (existingQuote.status !== QuoteStatus.OPEN) {
      return res.status(400).json({
        error: {
          code: 'INVALID_STATUS',
          message: 'Only open quotes can be edited',
        },
      });
    }

    // Calculate totals
    let subtotal = 0;
    data.items.forEach((item) => {
      const itemSubtotal = item.quantity * item.price - item.discount;
      subtotal += itemSubtotal;
    });

    subtotal -= data.discount;
    const tax = data.includeTax ? subtotal * 0.18 : 0; // 18% ITBIS solo si está marcado
    const total = subtotal + tax;

    // Update quote in transaction
    const updatedQuote = await prisma.$transaction(async (tx) => {
      // Delete old items
      await tx.quoteItem.deleteMany({
        where: { quoteId: id },
      });

      // Update quote
      const updateData: any = {
        subtotal,
        tax,
        discount: data.discount,
        total,
        validUntil: data.validUntil ? new Date(data.validUntil) : null,
        observations: data.observations,
        items: {
          create: data.items.map((item) => ({
            productId: item.productId || null,
            description: item.description,
            quantity: item.quantity,
            price: item.price,
            discount: item.discount,
            subtotal: item.quantity * item.price - item.discount,
          })),
        },
      };

      // Solo incluir clientId si se proporciona, o establecerlo como null si se está eliminando
      if (data.clientId !== undefined) {
        updateData.clientId = data.clientId || null;
      }

      const updated = await tx.quote.update({
        where: { id },
        data: updateData,
        include: {
          client: true,
          items: true,
        },
      });

      return updated;
    });

    res.json({
      id: updatedQuote.id,
      number: updatedQuote.number,
      total: Number(updatedQuote.total),
      status: updatedQuote.status,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input',
          details: error.errors,
        },
      });
    }

    console.error('Update quote error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error updating quote',
      },
    });
  }
};

export const deleteQuote = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Not authenticated',
        },
      });
    }

    const { id } = req.params;

    // Get quote
    const quote = await prisma.quote.findUnique({
      where: { id },
    });

    if (!quote) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Quote not found',
        },
      });
    }

    // Only allow deletion of open quotes
    if (quote.status !== QuoteStatus.OPEN) {
      return res.status(400).json({
        error: {
          code: 'INVALID_STATUS',
          message: 'Solo se pueden eliminar cotizaciones abiertas',
        },
      });
    }

    // Delete quote (items will be deleted automatically due to cascade)
    await prisma.quote.delete({
      where: { id },
    });

    res.json({
      message: 'Cotización eliminada exitosamente',
    });
  } catch (error) {
    console.error('Delete quote error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error deleting quote',
      },
    });
  }
};

export const convertQuoteToInvoice = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Not authenticated',
        },
      });
    }

    const { id } = req.params;
    const { paymentMethod, type, dueDate } = req.body;

    const quote = await prisma.quote.findUnique({
      where: { id },
      include: {
        items: true,
        client: true,
      },
    });

    if (!quote) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Quote not found',
        },
      });
    }

    if (quote.status !== QuoteStatus.OPEN) {
      return res.status(400).json({
        error: {
          code: 'INVALID_STATUS',
          message: 'Only open quotes can be converted',
        },
      });
    }

    // Generate invoice number
    const lastInvoice = await prisma.invoice.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { number: true },
    });

    let nextNumber = 1;
    if (lastInvoice) {
      const match = lastInvoice.number.match(/#FA-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }

    const invoiceNumber = `#FA-${String(nextNumber).padStart(4, '0')}`;

    const invoiceType = (type || 'FISCAL') as InvoiceType;
    const payment = (paymentMethod || 'CREDIT') as PaymentMethod;
    const balance = payment === 'CREDIT' ? quote.total : 0;

    // Check cash register if cash payment
    if (payment === 'CASH') {
      const openCash = await prisma.cashRegister.findFirst({
        where: { status: 'OPEN' },
      });

      if (!openCash) {
        return res.status(400).json({
          error: {
            code: 'CASH_NOT_OPEN',
            message: 'Cash register must be open for cash payments',
          },
        });
      }
    }

    // Obtener NCF del sistema de secuencias si es factura fiscal
    let ncf: string | null = null;
    if (invoiceType === 'FISCAL') {
      // Obtener branchId del quote o del primer branch activo
      let branchId: string | null = null;
      const firstBranch = await prisma.branch.findFirst({
        where: { isActive: true },
        orderBy: { name: 'asc' },
      });
      branchId = firstBranch?.id || null;
      
      ncf = await getNextNcf('FACE', branchId);
      if (!ncf) {
        return res.status(400).json({
          error: {
            code: 'NCF_NOT_AVAILABLE',
            message: 'No hay secuencias NCF disponibles para facturas fiscales. Por favor, configure una secuencia NCF en Configuración.',
          },
        });
      }
    }

    // Convert quote to invoice in transaction
    const invoice = await prisma.$transaction(async (tx) => {
      // Create invoice
      const newInvoice = await tx.invoice.create({
        data: {
          number: invoiceNumber,
          ncf: ncf,
          clientId: quote.clientId,
          type: invoiceType,
          status: InvoiceStatus.ISSUED,
          paymentMethod: payment,
          subtotal: quote.subtotal,
          tax: quote.tax,
          discount: quote.discount,
          total: quote.total,
          balance,
          dueDate: dueDate ? new Date(dueDate) : null,
          userId: req.user!.id,
          observations: `Convertida desde ${quote.number}`,
          items: {
            create: quote.items.map((item) => ({
              productId: item.productId || null,
              description: item.description,
              quantity: item.quantity,
              price: item.price,
              discount: item.discount,
              subtotal: item.subtotal,
            })),
          },
        },
        include: {
          client: true,
          items: true,
        },
      });

      // Get branchId from user context or first active branch
      let branchId: string | null = null;
      const firstBranch = await tx.branch.findFirst({
        where: { isActive: true },
        orderBy: { name: 'asc' },
      });
      branchId = firstBranch?.id || null;

      // Update quote status
      await tx.quote.update({
        where: { id },
        data: {
          status: QuoteStatus.CONVERTED,
          convertedToInvoiceId: newInvoice.id,
        },
      });

      // Update stock for each product
      for (const item of quote.items) {
        if (item.productId && branchId) {
          const stock = await tx.stock.findFirst({
            where: {
              productId: item.productId,
              branchId: branchId,
            },
          });

          if (stock) {
            await tx.stock.update({
              where: { id: stock.id },
              data: {
                quantity: {
                  decrement: Number(item.quantity),
                },
              },
            });

            // Get current balance after update
            const updatedStock = await tx.stock.findFirst({
              where: {
                productId: item.productId,
                branchId: branchId,
              },
            });
            const currentBalance = updatedStock ? Number(updatedStock.quantity) : 0;

            // Create inventory movement
            await tx.inventoryMovement.create({
              data: {
                productId: item.productId,
                branchId: branchId,
                type: 'SALE',
                quantity: -Number(item.quantity),
                balance: currentBalance,
                documentType: 'Invoice',
                documentId: newInvoice.id,
                userId: req.user!.id,
              },
            });
          }
        }
      }

      // Create cash movement if cash payment
      if (payment === 'CASH' && branchId) {
        const openCash = await tx.cashRegister.findFirst({
          where: { 
            status: 'OPEN',
            branchId: branchId,
          },
        });

        if (openCash) {
          await tx.cashMovement.create({
            data: {
              cashRegisterId: openCash.id,
              type: 'SALE',
              concept: `Factura ${invoiceNumber}`,
              amount: quote.total,
              method: PaymentMethod.CASH,
              invoiceId: newInvoice.id,
              userId: req.user!.id,
            },
          });
        }
      }

      return newInvoice;
    });

    res.status(201).json({
      id: invoice.id,
      number: invoice.number,
      ncf: invoice.ncf,
      total: Number(invoice.total),
      balance: Number(invoice.balance),
      status: invoice.status,
    });
  } catch (error) {
    console.error('Convert quote error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error converting quote to invoice',
      },
    });
  }
};

// ============================================
// PUNTO DE VENTA (POS)
// ============================================

export const createPOSSale = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Not authenticated',
        },
      });
    }

    // POS uses same schema as invoice but requires cash to be open
    const data = createInvoiceSchema.parse(req.body);

    // POS always requires cash register to be open
    const openCash = await prisma.cashRegister.findFirst({
      where: { status: 'OPEN' },
    });

    if (!openCash) {
      return res.status(400).json({
        error: {
          code: 'CASH_NOT_OPEN',
          message: 'Cash register must be open for POS sales',
        },
      });
    }

    // POS typically uses cash payment
    if (data.paymentMethod !== 'CASH' && data.paymentMethod !== 'CARD' && data.paymentMethod !== 'MIXED') {
      return res.status(400).json({
        error: {
          code: 'INVALID_PAYMENT_METHOD',
          message: 'POS only accepts CASH, CARD, or MIXED payments',
        },
      });
    }

    // Validate amountReceived for cash payments
    if (data.paymentMethod === 'CASH' && data.amountReceived !== undefined) {
      // Calculate total first to validate
      const subtotal = data.items.reduce((sum, item) => {
        const itemSubtotal = item.quantity * item.price - item.discount;
        return sum + itemSubtotal;
      }, 0) - (data.discount || 0);
      
      // ITBIS es opcional - se calcula solo si includeTax está marcado o si es FISCAL (compatibilidad hacia atrás)
      const tax = (data.includeTax !== undefined ? data.includeTax : data.type === 'FISCAL') ? subtotal * 0.18 : 0;
      const finalTotal = subtotal + tax;

      if (data.amountReceived < finalTotal) {
        return res.status(400).json({
          error: {
            code: 'INSUFFICIENT_PAYMENT',
            message: `El monto recibido (${data.amountReceived}) es menor que el total (${finalTotal})`,
          },
        });
      }
    }

    // Use createInvoice logic - it will return the full invoice with change
    return createInvoice(req, res);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input',
          details: error.errors,
        },
      });
    }

    console.error('Create POS sale error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error creating POS sale',
      },
    });
  }
};

// ============================================
// NOTAS DE CRÉDITO
// ============================================

const createCreditNoteSchema = z.object({
  invoiceId: z.string().uuid(),
  reason: z.string().min(1),
  items: z.array(z.object({
    productId: z.string().uuid().optional(),
    description: z.string(),
    quantity: z.number().positive(),
    price: z.number().nonnegative(),
    discount: z.number().nonnegative().default(0),
  })),
});

export const getCreditNotes = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (req.query.invoiceId) {
      where.invoiceId = req.query.invoiceId;
    }

    if (req.query.search) {
      where.OR = [
        { number: { contains: req.query.search as string } },
        { ncf: { contains: req.query.search as string } },
      ];
    }

    const [creditNotes, total] = await Promise.all([
      prisma.creditNote.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          invoice: {
            select: {
              id: true,
              number: true,
            },
          },
        },
      }),
      prisma.creditNote.count({ where }),
    ]);

    res.json({
      data: creditNotes.map((cn) => ({
        id: cn.id,
        number: cn.number,
        ncf: cn.ncf,
        invoice: cn.invoice,
        total: Number(cn.total),
        issueDate: cn.issueDate,
        createdAt: cn.createdAt,
        reason: cn.reason,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get credit notes error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error fetching credit notes',
      },
    });
  }
};

export const getCreditNote = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const creditNote = await prisma.creditNote.findUnique({
      where: { id },
      include: {
        invoice: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!creditNote) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Credit note not found',
        },
      });
    }

    res.json({
      ...creditNote,
      subtotal: Number(creditNote.subtotal),
      tax: Number(creditNote.tax),
      total: Number(creditNote.total),
      items: creditNote.items.map((item) => ({
        ...item,
        quantity: Number(item.quantity),
        price: Number(item.price),
        subtotal: Number(item.subtotal),
      })),
    });
  } catch (error) {
    console.error('Get credit note error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error fetching credit note',
      },
    });
  }
};

export const createCreditNote = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Not authenticated',
        },
      });
    }

    const data = createCreditNoteSchema.parse(req.body);

    // Verify invoice exists and is not cancelled
    const invoice = await prisma.invoice.findUnique({
      where: { id: data.invoiceId },
      include: {
        items: true,
      },
    });

    if (!invoice) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Invoice not found',
        },
      });
    }

    if (invoice.status === InvoiceStatus.CANCELLED) {
      return res.status(400).json({
        error: {
          code: 'INVALID_INVOICE',
          message: 'Cannot create credit note for cancelled invoice',
        },
      });
    }

    // Validate that credit note items don't exceed invoice quantities
    const invoiceItemsMap = new Map(
      invoice.items.map((item) => [item.productId || item.id, Number(item.quantity)])
    );
    
    // Track total credited quantities per product
    const creditedQuantities = new Map<string, number>();
    
    for (const item of data.items) {
      if (item.productId) {
        const invoiceQuantity = invoiceItemsMap.get(item.productId) || 0;
        const currentCredited = creditedQuantities.get(item.productId) || 0;
        const newTotalCredited = currentCredited + item.quantity;
        
        if (newTotalCredited > invoiceQuantity) {
          // Find product name for error message
          const invoiceItem = invoice.items.find((i) => i.productId === item.productId);
          const productName = invoiceItem?.description || 'producto';
          
          return res.status(400).json({
            error: {
              code: 'EXCEEDS_INVOICE_QUANTITY',
              message: `La cantidad acreditar para "${productName}" (${newTotalCredited.toFixed(2)}) excede la cantidad de la factura original (${invoiceQuantity.toFixed(2)})`,
              product: {
                id: item.productId,
                name: productName,
              },
              invoiceQuantity,
              requestedQuantity: newTotalCredited,
            },
          });
        }
        
        creditedQuantities.set(item.productId, newTotalCredited);
      }
    }

    // Generate credit note number
    const lastCreditNote = await prisma.creditNote.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { number: true },
    });

    let nextNumber = 1;
    if (lastCreditNote) {
      const match = lastCreditNote.number.match(/#NC-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }

    const creditNoteNumber = `#NC-${String(nextNumber).padStart(4, '0')}`;

    // Calculate totals
    let subtotal = 0;
    data.items.forEach((item) => {
      const itemSubtotal = item.quantity * item.price - item.discount;
      subtotal += itemSubtotal;
    });

    const tax = invoice.type === 'FISCAL' ? subtotal * 0.18 : 0; // 18% ITBIS
    const total = subtotal + tax;

    // Obtener NCF del sistema de secuencias si la factura original era fiscal
    let ncf: string | null = null;
    if (invoice.type === 'FISCAL') {
      ncf = await getNextNcf('NCE', invoice.branchId);
      if (!ncf) {
        return res.status(400).json({
          error: {
            code: 'NCF_NOT_AVAILABLE',
            message: 'No hay secuencias NCF disponibles para notas de crédito. Por favor, configure una secuencia NCF en Configuración.',
          },
        });
      }
    }

    // Create credit note in transaction
    const creditNote = await prisma.$transaction(async (tx) => {
      const newCreditNote = await tx.creditNote.create({
        data: {
          number: creditNoteNumber,
          ncf: ncf,
          invoiceId: data.invoiceId,
          reason: data.reason,
          subtotal,
          tax,
          total,
          userId: req.user!.id,
          items: {
            create: data.items.map((item) => ({
              productId: item.productId || null,
              description: item.description,
              quantity: item.quantity,
              price: item.price,
              subtotal: item.quantity * item.price - item.discount,
            })),
          },
        },
        include: {
          invoice: true,
          items: true,
        },
      });

      // Update invoice balance
      await tx.invoice.update({
        where: { id: data.invoiceId },
        data: {
          balance: {
            decrement: total,
          },
        },
      });

      // Get branch from invoice
      const branchId = invoice.branchId;

      // Restore stock for each product
      for (const item of data.items) {
        if (item.productId && branchId) {
          const stock = await tx.stock.findFirst({
            where: {
              productId: item.productId,
              branchId: branchId,
            },
          });

          if (stock) {
            await tx.stock.update({
              where: { id: stock.id },
              data: {
                quantity: {
                  increment: item.quantity,
                },
              },
            });
          }

          // Get current balance
          const currentStock = await tx.stock.findFirst({
            where: {
              productId: item.productId,
              branchId: branchId,
            },
          });
          const currentBalance = currentStock ? Number(currentStock.quantity) : 0;

          // Create inventory movement
          await tx.inventoryMovement.create({
            data: {
              productId: item.productId,
              branchId: branchId,
              type: 'CREDIT_NOTE',
              quantity: item.quantity,
              balance: currentBalance,
              documentType: 'CreditNote',
              documentId: newCreditNote.id,
              userId: req.user!.id,
              observations: `Nota de crédito: ${data.reason}`,
            },
          });
        }
      }

      return newCreditNote;
    });

    res.status(201).json({
      id: creditNote.id,
      number: creditNote.number,
      ncf: creditNote.ncf,
      total: Number(creditNote.total),
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input',
          details: error.errors,
        },
      });
    }

    console.error('Create credit note error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error creating credit note',
      },
    });
  }
};

// ============================================
// HISTORIAL / ANULADOS
// ============================================

export const getCancelledInvoicesCount = async (req: AuthRequest, res: Response) => {
  try {
    const count = await prisma.invoice.count({
      where: {
        status: InvoiceStatus.CANCELLED,
        ncf: { not: null }, // Only count cancelled invoices with NCF
      },
    });

    res.json({ count });
  } catch (error) {
    console.error('Get cancelled invoices count error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error fetching cancelled invoices count',
      },
    });
  }
};

export const getCancelledInvoices = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const where: any = {
      status: InvoiceStatus.CANCELLED,
    };

    if (req.query.search) {
      where.OR = [
        { number: { contains: req.query.search as string, mode: 'insensitive' } },
        { ncf: { contains: req.query.search as string, mode: 'insensitive' } },
        { client: { name: { contains: req.query.search as string, mode: 'insensitive' } } },
      ];
    }

    // Filter by cancellation date
    if (req.query.startDate || req.query.endDate) {
      where.cancelledAt = {};
      if (req.query.startDate) {
        where.cancelledAt.gte = new Date(req.query.startDate as string);
      }
      if (req.query.endDate) {
        const endDate = new Date(req.query.endDate as string);
        endDate.setHours(23, 59, 59, 999);
        where.cancelledAt.lte = endDate;
      }
    }

    // Filter by user who cancelled
    if (req.query.cancelledBy) {
      where.cancelledBy = req.query.cancelledBy;
    }

    // Filter by cancellation reason
    if (req.query.reason) {
      where.cancellationReason = { contains: req.query.reason as string, mode: 'insensitive' };
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { cancelledAt: 'desc' },
        include: {
          client: {
            select: {
              id: true,
              name: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.invoice.count({ where }),
    ]);

    res.json({
      data: invoices.map((invoice) => ({
        id: invoice.id,
        number: invoice.number,
        ncf: invoice.ncf,
        client: invoice.client,
        total: Number(invoice.total),
        cancelledAt: invoice.cancelledAt,
        cancellationReason: invoice.cancellationReason,
        cancelledBy: invoice.user,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get cancelled invoices error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error fetching cancelled invoices',
      },
    });
  }
};

