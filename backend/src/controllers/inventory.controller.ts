import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';
import { z } from 'zod';

const prisma = new PrismaClient();

const createProductSchema = z.object({
  code: z.string().optional(),
  barcode: z.string().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  categoryId: z.string().uuid(),
  brand: z.string().optional(),
  unit: z.string().default('UNIT'),
  salePrice: z.number().nonnegative(),
  cost: z.number().nonnegative().optional(),
  hasTax: z.boolean().default(true),
  taxPercent: z.number().default(18),
  controlsStock: z.boolean().default(true),
  minStock: z.number().nonnegative().default(0),
  imageUrl: z.string().optional(),
});

const createAdjustmentSchema = z.object({
  branchId: z.string().uuid(),
  type: z.enum(['ENTRY', 'EXIT']),
  reason: z.string().optional(),
  items: z.array(z.object({
    productId: z.string().uuid(),
    adjustmentQuantity: z.number().positive(),
  })),
  observations: z.string().optional(),
});

export const getProducts = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (req.query.categoryId) {
      where.categoryId = req.query.categoryId;
    }

    if (req.query.isActive !== undefined) {
      where.isActive = req.query.isActive === 'true';
    }

    if (req.query.controlsStock !== undefined) {
      where.controlsStock = req.query.controlsStock === 'true';
    }

    if (req.query.search) {
      where.OR = [
        { code: { contains: req.query.search as string, mode: 'insensitive' } },
        { name: { contains: req.query.search as string, mode: 'insensitive' } },
        { barcode: { contains: req.query.search as string, mode: 'insensitive' } },
      ];
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        include: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
          stocks: {
            include: {
              branch: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { name: 'asc' },
      }),
      prisma.product.count({ where }),
    ]);

    res.json({
      data: products.map((product) => ({
        ...product,
        salePrice: Number(product.salePrice),
        cost: product.cost ? Number(product.cost) : null,
        taxPercent: Number(product.taxPercent),
        minStock: Number(product.minStock),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error fetching products',
      },
    });
  }
};

export const getProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        stocks: {
          include: {
            branch: true,
          },
        },
      },
    });

    if (!product) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Product not found',
        },
      });
    }

    res.json({
      ...product,
      salePrice: Number(product.salePrice),
      cost: product.cost ? Number(product.cost) : null,
      taxPercent: Number(product.taxPercent),
      minStock: Number(product.minStock),
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error fetching product',
      },
    });
  }
};

export const createProduct = async (req: AuthRequest, res: Response) => {
  try {
    const data = createProductSchema.parse(req.body);

    // Generar código automático si no se proporciona
    let productCode = data.code;
    if (!productCode || productCode.trim() === '') {
      // Buscar el último código numérico
      const lastProduct = await prisma.product.findFirst({
        where: {
          code: {
            startsWith: 'PROD-',
          },
        },
        orderBy: {
          code: 'desc',
        },
      });

      let nextNumber = 1;
      if (lastProduct && lastProduct.code) {
        const match = lastProduct.code.match(/PROD-(\d+)/);
        if (match) {
          nextNumber = parseInt(match[1], 10) + 1;
        }
      }
      productCode = `PROD-${String(nextNumber).padStart(4, '0')}`;
    }

    // Verificar que el código no exista
    const existingProduct = await prisma.product.findUnique({
      where: { code: productCode },
    });

    if (existingProduct) {
      return res.status(400).json({
        error: {
          code: 'DUPLICATE_CODE',
          message: 'El código del producto ya existe',
        },
      });
    }

    const product = await prisma.product.create({
      data: {
        ...data,
        code: productCode,
        salePrice: data.salePrice,
        cost: data.cost,
        taxPercent: data.taxPercent,
        minStock: data.minStock,
      },
    });

    // Create initial stock if controls stock
    if (data.controlsStock) {
      // Obtener todas las sucursales activas
      const activeBranches = await prisma.branch.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'asc' },
      });

      if (activeBranches.length === 0) {
        // Si no hay sucursales, mostrar advertencia pero permitir crear el producto
        console.warn(`Product ${product.code} created with controlsStock=true but no active branches exist`);
      } else {
        // Crear stock en todas las sucursales activas
        await Promise.all(
          activeBranches.map((branch) =>
            prisma.stock.create({
          data: {
            productId: product.id,
                branchId: branch.id,
            quantity: 0,
            minStock: data.minStock,
          },
            })
          )
        );
      }
    }

    res.status(201).json({
      id: product.id,
      code: product.code,
      name: product.name,
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

    if (error.code === 'P2002') {
      return res.status(400).json({
        error: {
          code: 'DUPLICATE_CODE',
          message: 'Product code or barcode already exists',
        },
      });
    }

    console.error('Create product error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error creating product',
      },
    });
  }
};

export const updateProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data = createProductSchema.partial().parse(req.body);

    const product = await prisma.product.update({
      where: { id },
      data,
    });

    res.json({
      id: product.id,
      code: product.code,
      name: product.name,
    });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Product not found',
        },
      });
    }

    console.error('Update product error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error updating product',
      },
    });
  }
};

export const getStock = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (req.query.branchId) {
      where.branchId = req.query.branchId;
    }

    if (req.query.categoryId) {
      where.product = {
        categoryId: req.query.categoryId,
      };
    }

    if (req.query.search) {
      where.product = {
        ...where.product,
        OR: [
          { code: { contains: req.query.search as string, mode: 'insensitive' } },
          { name: { contains: req.query.search as string, mode: 'insensitive' } },
        ],
      };
    }

    // For lowStock filter, we need to use raw SQL or fetch all and filter
    // Using a more efficient approach: fetch all matching stocks first if lowStock filter is active
    let stocks;
    let total;

    if (req.query.lowStock === 'true') {
      // Fetch all stocks matching other filters first
      const allStocks = await prisma.stock.findMany({
        where,
        include: {
          product: {
            include: {
              category: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          branch: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      // Filter by lowStock in memory
      const lowStockItems = allStocks.filter(
        (stock) => Number(stock.quantity) <= Number(stock.minStock)
      );

      total = lowStockItems.length;
      
      // Apply pagination
      const paginatedItems = lowStockItems.slice(skip, skip + limit);
      
      stocks = paginatedItems;
    } else {
      // Normal query without lowStock filter
      [stocks, total] = await Promise.all([
      prisma.stock.findMany({
        where,
        skip,
        take: limit,
        include: {
          product: {
            include: {
              category: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          branch: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: [
          { product: { name: 'asc' } },
        ],
      }),
      prisma.stock.count({ where }),
    ]);
    }

    const mappedStocks = stocks.map((stock) => ({
        id: stock.id,
        product: stock.product,
        branch: stock.branch,
        quantity: Number(stock.quantity),
        minStock: Number(stock.minStock),
        status: Number(stock.quantity) === 0 ? 'OUT' :
          Number(stock.quantity) <= Number(stock.minStock) ? 'LOW' : 'OK',
    }));

    res.json({
      data: mappedStocks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get stock error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error fetching stock',
      },
    });
  }
};

export const getMovements = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (req.query.productId) {
      where.productId = req.query.productId;
    }

    if (req.query.branchId) {
      where.branchId = req.query.branchId;
    }

    if (req.query.type) {
      where.type = req.query.type;
    }

    if (req.query.startDate || req.query.endDate) {
      where.movementDate = {};
      if (req.query.startDate) {
        where.movementDate.gte = new Date(req.query.startDate as string);
      }
      if (req.query.endDate) {
        where.movementDate.lte = new Date(req.query.endDate as string);
      }
    }

    const [movements, total] = await Promise.all([
      prisma.inventoryMovement.findMany({
        where,
        skip,
        take: limit,
        include: {
          product: {
            select: {
              id: true,
              code: true,
              name: true,
              category: {
                select: {
                  name: true,
                },
              },
            },
          },
          branch: {
            select: {
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
        orderBy: { movementDate: 'desc' },
      }),
      prisma.inventoryMovement.count({ where }),
    ]);

    res.json({
      data: movements.map((movement) => ({
        ...movement,
        quantity: Number(movement.quantity),
        balance: Number(movement.balance),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get movements error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error fetching movements',
      },
    });
  }
};

export const createAdjustment = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Not authenticated',
        },
      });
    }

    const data = createAdjustmentSchema.parse(req.body);

    const adjustment = await prisma.$transaction(async (tx) => {
      const adjustmentItems = [];

      for (const item of data.items) {
        // Validate that product controls stock
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          select: { 
            id: true,
            name: true,
            code: true,
            controlsStock: true,
            minStock: true,
          },
        });

        if (!product) {
          throw new Error(`Product ${item.productId} not found`);
        }

        if (!product.controlsStock) {
          throw new Error(`Product ${product.name} (${product.code}) does not control stock. Cannot adjust inventory for products that don't control stock.`);
        }

        // Get current stock
        const stock = await tx.stock.findUnique({
          where: {
            productId_branchId: {
              productId: item.productId,
              branchId: data.branchId,
            },
          },
        });

        const previousQuantity = stock ? Number(stock.quantity) : 0;
        const adjustmentQuantity = data.type === 'EXIT'
          ? -item.adjustmentQuantity
          : item.adjustmentQuantity;
        const newQuantity = previousQuantity + adjustmentQuantity;

        if (newQuantity < 0) {
          throw new Error(`Insufficient stock for product ${product.name} (${product.code}). Cannot have negative stock.`);
        }

        // Create or update stock
        if (!stock) {
          // Create stock record if it doesn't exist
          await tx.stock.create({
            data: {
              productId: item.productId,
              branchId: data.branchId,
              quantity: newQuantity,
              minStock: Number(product.minStock) || 0,
            },
          });
        } else {
          // Update existing stock
        await tx.stock.update({
          where: {
            productId_branchId: {
              productId: item.productId,
              branchId: data.branchId,
            },
          },
          data: {
            quantity: newQuantity,
          },
        });
        }

        // Create movement
        await tx.inventoryMovement.create({
          data: {
            productId: item.productId,
            branchId: data.branchId,
            type: data.type === 'ENTRY' ? 'ADJUSTMENT_ENTRY' : 'ADJUSTMENT_EXIT',
            quantity: adjustmentQuantity,
            balance: newQuantity,
            documentType: 'Adjustment',
            userId: req.user!.id,
                observations: data.reason || data.observations || 'Ajuste de inventario',
          },
        });

        adjustmentItems.push({
          productId: item.productId,
          previousQuantity,
          adjustmentQuantity,
          newQuantity,
        });
      }

      // Create adjustment record
      const adjustment = await tx.inventoryAdjustment.create({
        data: {
          branchId: data.branchId,
          type: data.type as any,
          reason: data.reason,
          userId: req.user!.id,
          observations: data.observations,
          items: {
            create: adjustmentItems.map((item) => ({
              productId: item.productId,
              previousQuantity: item.previousQuantity,
              adjustmentQuantity: item.adjustmentQuantity,
              newQuantity: item.newQuantity,
            })),
          },
        },
      });

      return adjustment;
    });

    res.status(201).json({
      adjustment: {
        id: adjustment.id,
        type: adjustment.type,
        reason: adjustment.reason,
      },
      stockUpdated: true,
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

    console.error('Create adjustment error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Error creating adjustment',
      },
    });
  }
};

export const getLowStockAlerts = async (req: AuthRequest, res: Response) => {
  try {
    const branchId = req.query.branchId as string | undefined;
    
    const where: any = {
      quantity: {
        lte: prisma.stock.fields.minStock,
      },
    };

    if (branchId) {
      where.branchId = branchId;
    }

    const stocks = await prisma.stock.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            code: true,
            name: true,
            category: {
              select: {
                name: true,
              },
            },
          },
        },
        branch: {
          select: {
            name: true,
          },
        },
      },
    });

    res.json({
      data: stocks.map((stock) => ({
        product: stock.product,
        branch: stock.branch,
        currentStock: Number(stock.quantity),
        minStock: Number(stock.minStock),
        difference: Number(stock.quantity) - Number(stock.minStock),
      })),
    });
  } catch (error) {
    console.error('Get low stock alerts error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error fetching low stock alerts',
      },
    });
  }
};

// Categories
const createCategorySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

export const getCategories = async (req: AuthRequest, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    res.json({
      data: categories.map((category) => ({
        id: category.id,
        name: category.name,
        description: category.description,
        productCount: category._count.products,
      })),
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error fetching categories',
      },
    });
  }
};

export const createCategory = async (req: AuthRequest, res: Response) => {
  try {
    const data = createCategorySchema.parse(req.body);

    const category = await prisma.category.create({
      data,
    });

    res.status(201).json({
      id: category.id,
      name: category.name,
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

    if (error.code === 'P2002') {
      return res.status(400).json({
        error: {
          code: 'DUPLICATE_NAME',
          message: 'Category name already exists',
        },
      });
    }

    console.error('Create category error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error creating category',
      },
    });
  }
};

export const updateCategory = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data = createCategorySchema.partial().parse(req.body);

    const category = await prisma.category.update({
      where: { id },
      data,
    });

    res.json({
      id: category.id,
      name: category.name,
    });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Category not found',
        },
      });
    }

    console.error('Update category error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error updating category',
      },
    });
  }
};

export const deleteCategory = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check if category has products
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    if (!category) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Category not found',
        },
      });
    }

    if (category._count.products > 0) {
      return res.status(400).json({
        error: {
          code: 'CATEGORY_HAS_PRODUCTS',
          message: `No se puede eliminar la categoría porque tiene ${category._count.products} producto(s) asociado(s). Primero mueva los productos a otra categoría o desactívelos.`,
        },
      });
    }

    await prisma.category.delete({
      where: { id },
    });

    res.json({
      message: 'Category deleted successfully',
    });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Category not found',
        },
      });
    }

    console.error('Delete category error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error deleting category',
      },
    });
  }
};

export const deleteProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check if product has history (invoices, movements, etc.)
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            invoiceItems: true,
            quoteItems: true,
            inventoryMovements: true,
            stocks: true,
          },
        },
      },
    });

    if (!product) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Product not found',
        },
      });
    }

    const hasHistory = 
      product._count.invoiceItems > 0 ||
      product._count.quoteItems > 0 ||
      product._count.inventoryMovements > 0;

    if (hasHistory) {
      return res.status(400).json({
        error: {
          code: 'PRODUCT_HAS_HISTORY',
          message: 'No se puede eliminar el producto porque tiene historial (ventas, cotizaciones o movimientos). Solo se puede desactivar.',
        },
      });
    }

    // Delete product (stocks will be deleted by cascade)
    await prisma.product.delete({
      where: { id },
    });

    res.json({
      message: 'Product deleted successfully',
    });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Product not found',
        },
      });
    }

    console.error('Delete product error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error deleting product',
      },
    });
  }
};

