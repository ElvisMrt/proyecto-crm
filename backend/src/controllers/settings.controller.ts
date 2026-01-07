import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Schemas
const updateCompanySchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  rnc: z.string().optional(),
});

const createBranchSchema = z.object({
  name: z.string().min(1),
  code: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  managerId: z.string().uuid().optional(),
  isActive: z.boolean().default(true),
});

const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  role: z.enum(['ADMINISTRATOR', 'SUPERVISOR', 'OPERATOR', 'CASHIER']).default('OPERATOR'),
  branchId: z.string().uuid().optional(),
  password: z.string().min(6),
  isActive: z.boolean().default(true),
});

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  role: z.enum(['ADMINISTRATOR', 'SUPERVISOR', 'OPERATOR', 'CASHIER']).optional(),
  branchId: z.string().uuid().optional().nullable(),
  isActive: z.boolean().optional(),
  password: z.string().min(6).optional(),
});

// ============================================
// COMPANY
// ============================================
export const getCompany = async (req: AuthRequest, res: Response) => {
  try {
    // Get the first active tenant or create a default one
    let tenant = await prisma.tenant.findFirst({
      where: { status: 'ACTIVE' },
    });

    if (!tenant) {
      // Create a default tenant if none exists
      tenant = await prisma.tenant.create({
        data: {
          name: 'Mi Empresa',
          slug: 'mi-empresa',
          email: 'info@miempresa.com',
          phone: '809-000-0000',
          address: 'Santo Domingo, República Dominicana',
          country: 'DO',
          status: 'ACTIVE',
          plan: 'BASIC',
        },
      });
    }

    res.json({
      id: tenant.id,
      name: tenant.name,
      email: tenant.email,
      phone: tenant.phone || '',
      address: tenant.address || '',
      rnc: '', // RNC is not in Tenant model, we'll store it separately if needed
      logo: null,
    });
  } catch (error) {
    console.error('Get company error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error fetching company data',
      },
    });
  }
};

export const updateCompany = async (req: AuthRequest, res: Response) => {
  try {
    const data = updateCompanySchema.parse(req.body);
    
    // Get the first active tenant or create one
    let tenant = await prisma.tenant.findFirst({
      where: { status: 'ACTIVE' },
    });

    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    if (data.email) updateData.email = data.email;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.address !== undefined) updateData.address = data.address;

    if (tenant) {
      tenant = await prisma.tenant.update({
        where: { id: tenant.id },
        data: updateData,
      });
    } else {
      tenant = await prisma.tenant.create({
        data: {
          name: data.name || 'Mi Empresa',
          slug: 'mi-empresa',
          email: data.email || 'info@miempresa.com',
          phone: data.phone,
          address: data.address,
          country: 'DO',
          status: 'ACTIVE',
          plan: 'BASIC',
        },
      });
    }

    res.json({
      message: 'Company updated successfully',
      data: {
        id: tenant.id,
        name: tenant.name,
        email: tenant.email,
        phone: tenant.phone || '',
        address: tenant.address || '',
        rnc: data.rnc || '',
      },
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
    console.error('Update company error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error updating company',
      },
    });
  }
};

// ============================================
// BRANCHES
// ============================================
export const getBranches = async (req: AuthRequest, res: Response) => {
  try {
    const branches = await prisma.branch.findMany({
      orderBy: { name: 'asc' },
    });

    res.json({
      data: branches,
    });
  } catch (error) {
    console.error('Get branches error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error fetching branches',
      },
    });
  }
};

export const getBranch = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const branch = await prisma.branch.findUnique({
      where: { id },
    });

    if (!branch) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Branch not found',
        },
      });
    }

    res.json(branch);
  } catch (error) {
    console.error('Get branch error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error fetching branch',
      },
    });
  }
};

export const createBranch = async (req: AuthRequest, res: Response) => {
  try {
    const data = createBranchSchema.parse(req.body);

    const branch = await prisma.branch.create({
      data,
    });

    res.status(201).json({
      id: branch.id,
      name: branch.name,
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
    console.error('Create branch error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error creating branch',
      },
    });
  }
};

export const updateBranch = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data = createBranchSchema.partial().parse(req.body);

    const branch = await prisma.branch.update({
      where: { id },
      data,
    });

    res.json({
      id: branch.id,
      name: branch.name,
    });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Branch not found',
        },
      });
    }
    console.error('Update branch error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error updating branch',
      },
    });
  }
};

// ============================================
// USERS
// ============================================
export const getUsers = async (req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        branchId: true,
        branch: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        isActive: true,
        lastLogin: true,
        createdAt: true,
      },
      orderBy: { name: 'asc' },
    });

    res.json({
      data: users,
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error fetching users',
      },
    });
  }
};

export const getUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'User not found',
        },
      });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error fetching user',
      },
    });
  }
};

export const createUser = async (req: AuthRequest, res: Response) => {
  try {
    const data = createUserSchema.parse(req.body);

    // Check if email already exists
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      return res.status(400).json({
        error: {
          code: 'DUPLICATE_EMAIL',
          message: 'Ya existe un usuario con este email',
        },
      });
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: hashedPassword,
        role: data.role,
        branchId: data.branchId || null,
        isActive: data.isActive,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        branchId: true,
      },
    });

    res.status(201).json(user);
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
          code: 'DUPLICATE_EMAIL',
          message: 'Ya existe un usuario con este email',
        },
      });
    }
    console.error('Create user error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error creating user',
      },
    });
  }
};

export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data = updateUserSchema.parse(req.body);

    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    if (data.email) updateData.email = data.email;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.role) updateData.role = data.role;
    if (data.branchId !== undefined) updateData.branchId = data.branchId || null;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    // Check email uniqueness if email is being updated
    if (data.email) {
      const existing = await prisma.user.findUnique({
        where: { email: data.email },
      });
      if (existing && existing.id !== id) {
        return res.status(400).json({
          error: {
            code: 'DUPLICATE_EMAIL',
            message: 'Ya existe otro usuario con este email',
          },
        });
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    res.json(user);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'User not found',
        },
      });
    }
    console.error('Update user error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error updating user',
      },
    });
  }
};

export const toggleUserStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: { isActive: isActive !== undefined ? isActive : true },
      select: {
        id: true,
        isActive: true,
      },
    });

    res.json(user);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'User not found',
        },
      });
    }
    console.error('Toggle user status error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error updating user status',
      },
    });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check if user has associated data
    const [invoices, payments, cashMovements] = await Promise.all([
      prisma.invoice.count({ where: { userId: id } }),
      prisma.payment.count({ where: { userId: id } }),
      prisma.cashMovement.count({ where: { userId: id } }),
    ]);

    if (invoices > 0 || payments > 0 || cashMovements > 0) {
      // Instead of deleting, deactivate the user
      const user = await prisma.user.update({
        where: { id },
        data: { isActive: false },
      });

      return res.json({
        message: 'User deactivated successfully (has associated data)',
        data: user,
      });
    }

    // Safe to delete if no associated data
    await prisma.user.delete({
      where: { id },
    });

    res.json({
      message: 'User deleted successfully',
    });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'User not found',
        },
      });
    }
    console.error('Delete user error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error deleting user',
      },
    });
  }
};

// ============================================
// ROLES & PERMISSIONS (Read-only for now)
// ============================================
export const getRoles = async (req: AuthRequest, res: Response) => {
  try {
    // Return predefined roles with their permissions
    const roles = [
      {
        id: 'ADMINISTRATOR',
        name: 'Administrador',
        description: 'Acceso completo al sistema',
        permissions: 'all',
      },
      {
        id: 'SUPERVISOR',
        name: 'Supervisor',
        description: 'Supervisión y gestión operativa',
        permissions: 'supervisor',
      },
      {
        id: 'OPERATOR',
        name: 'Operador',
        description: 'Operaciones diarias',
        permissions: 'operator',
      },
      {
        id: 'CASHIER',
        name: 'Cajero',
        description: 'Operaciones de caja',
        permissions: 'cashier',
      },
    ];

    res.json({ data: roles });
  } catch (error) {
    console.error('Get roles error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error fetching roles',
      },
    });
  }
};

export const getPermissions = async (req: AuthRequest, res: Response) => {
  try {
    // Return all permissions grouped by module
    const { PERMISSIONS } = require('../middleware/permissions.middleware');
    
    const permissionsByModule: any = {};
    Object.entries(PERMISSIONS).forEach(([key, value]) => {
      const module = key.split('_')[0].toLowerCase();
      if (!permissionsByModule[module]) {
        permissionsByModule[module] = [];
      }
      permissionsByModule[module].push({
        key,
        value,
        label: key.replace(/_/g, ' ').toLowerCase(),
      });
    });

    res.json({ data: permissionsByModule });
  } catch (error) {
    console.error('Get permissions error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error fetching permissions',
      },
    });
  }
};



