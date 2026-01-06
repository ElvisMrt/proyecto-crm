import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';
import { z } from 'zod';

const prisma = new PrismaClient();

const createTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  clientId: z.string().uuid().optional(),
  dueDate: z.string().datetime().optional(),
  assignedToUserId: z.string().uuid().optional(),
});

const createNoteSchema = z.object({
  clientId: z.string().uuid(),
  content: z.string().min(1),
});

export const getTasks = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    // Filter by user if not admin/supervisor
    if (req.user?.role !== 'ADMINISTRATOR' && req.user?.role !== 'SUPERVISOR') {
      where.userId = req.user?.id;
    } else if (req.query.userId) {
      where.userId = req.query.userId;
    }

    if (req.query.clientId) {
      where.clientId = req.query.clientId;
    }

    if (req.query.status) {
      where.status = req.query.status;
    } else {
      // Default to pending if no status filter
      where.status = { not: 'COMPLETED' };
    }

    // Note: taskType not in schema yet, can be added later

    if (req.query.overdue === 'true') {
      const now = new Date();
      where.dueDate = { lt: now };
      where.status = 'PENDING';
    }

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        skip,
        take: limit,
        include: {
          client: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: [
          { dueDate: 'asc' },
          { createdAt: 'desc' },
        ],
      }),
      prisma.task.count({ where }),
    ]);

    const now = new Date();
    const data = tasks.map((task) => {
      const isOverdue = task.dueDate && task.dueDate < now && task.status === 'PENDING';
      const daysOverdue = isOverdue && task.dueDate
        ? Math.floor((now.getTime() - task.dueDate.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      return {
        ...task,
        isOverdue,
        daysOverdue,
      };
    });

    res.json({
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error fetching tasks',
      },
    });
  }
};

export const getTask = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        client: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!task) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Task not found',
        },
      });
    }

    res.json(task);
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error fetching task',
      },
    });
  }
};

export const createTask = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Not authenticated',
        },
      });
    }

    const data = createTaskSchema.parse(req.body);

    const task = await prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        clientId: data.clientId,
        userId: data.assignedToUserId || req.user.id,
        status: 'PENDING',
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
      },
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
    });

    res.status(201).json({
      id: task.id,
      title: task.title,
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

    console.error('Create task error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error creating task',
      },
    });
  }
};

export const updateTask = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data = createTaskSchema.partial().parse(req.body);

    const updateData: any = {};
    if (data.title) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.clientId !== undefined) updateData.clientId = data.clientId;
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    if (data.assignedToUserId) updateData.userId = data.assignedToUserId;

    const task = await prisma.task.update({
      where: { id },
      data: updateData,
    });

    res.json({
      id: task.id,
      title: task.title,
    });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Task not found',
        },
      });
    }

    console.error('Update task error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error updating task',
      },
    });
  }
};

export const completeTask = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const task = await prisma.task.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    res.json({
      id: task.id,
      status: task.status,
    });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Task not found',
        },
      });
    }

    console.error('Complete task error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error completing task',
      },
    });
  }
};

export const getOverdueTasks = async (req: AuthRequest, res: Response) => {
  try {
    const now = new Date();

    const where: any = {
      status: 'PENDING',
      dueDate: { lt: now },
    };

    if (req.user?.role !== 'ADMINISTRATOR' && req.user?.role !== 'SUPERVISOR') {
      where.userId = req.user?.id;
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    const data = tasks.map((task) => {
      const daysOverdue = task.dueDate
        ? Math.floor((now.getTime() - task.dueDate.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      return {
        ...task,
        daysOverdue,
      };
    });

    res.json({ data });
  } catch (error) {
    console.error('Get overdue tasks error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error fetching overdue tasks',
      },
    });
  }
};

export const getClientHistory = async (req: AuthRequest, res: Response) => {
  try {
    const { clientId } = req.params;

    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: {
        id: true,
        name: true,
        identification: true,
        email: true,
        phone: true,
      },
    });

    if (!client) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Client not found',
        },
      });
    }

    // Get tasks
    const tasks = await prisma.task.findMany({
      where: { clientId },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    // Get invoices summary
    const invoices = await prisma.invoice.findMany({
      where: { clientId },
      select: {
        id: true,
        number: true,
        total: true,
        balance: true,
        status: true,
        issueDate: true,
      },
      orderBy: { issueDate: 'desc' },
      take: 10,
    });

    // Get payments summary
    const payments = await prisma.payment.findMany({
      where: { clientId },
      select: {
        id: true,
        amount: true,
        paymentDate: true,
      },
      orderBy: { paymentDate: 'desc' },
      take: 10,
    });

    const totalSales = invoices.reduce((sum, inv) => sum + Number(inv.total), 0);
    const totalReceivable = invoices
      .filter((inv) => inv.status !== 'PAID' && inv.status !== 'CANCELLED')
      .reduce((sum, inv) => sum + Number(inv.balance), 0);

    res.json({
      client,
      summary: {
        totalSales,
        totalReceivable,
        invoiceCount: invoices.length,
        paymentCount: payments.length,
        taskCount: tasks.length,
      },
      tasks: tasks.map((task) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        dueDate: task.dueDate,
        completedAt: task.completedAt,
        createdAt: task.createdAt,
        user: task.user,
      })),
      recentInvoices: invoices.map((inv) => ({
        id: inv.id,
        number: inv.number,
        total: Number(inv.total),
        balance: Number(inv.balance),
        status: inv.status,
        issueDate: inv.issueDate,
      })),
      recentPayments: payments.map((p) => ({
        id: p.id,
        amount: Number(p.amount),
        paymentDate: p.paymentDate,
      })),
    });
  } catch (error) {
    console.error('Get client history error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error fetching client history',
      },
    });
  }
};

export const getNotes = async (req: AuthRequest, res: Response) => {
  try {
    const { clientId } = req.params;

    // For now, we'll use tasks with a specific type as notes
    // In a full implementation, you'd have a separate Note model
    const notes = await prisma.task.findMany({
      where: {
        clientId,
        title: { startsWith: '[NOTA]' }, // Simple way to distinguish notes
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      data: notes.map((note) => ({
        id: note.id,
        content: note.description || note.title,
        createdAt: note.createdAt,
        user: note.user,
      })),
    });
  } catch (error) {
    console.error('Get notes error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error fetching notes',
      },
    });
  }
};

export const createNote = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Not authenticated',
        },
      });
    }

    const data = createNoteSchema.parse(req.body);

    // Create as a task with special title prefix
    const note = await prisma.task.create({
      data: {
        title: '[NOTA] Nota interna',
        description: data.content,
        clientId: data.clientId,
        userId: req.user.id,
        status: 'COMPLETED', // Notes are always "completed"
        completedAt: new Date(),
      },
    });

    res.status(201).json({
      id: note.id,
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

    console.error('Create note error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error creating note',
      },
    });
  }
};

export const getCRMSummary = async (req: AuthRequest, res: Response) => {
  try {
    const now = new Date();
    
    const wherePending: any = {
      status: 'PENDING',
    };
    const whereOverdue: any = {
      status: 'PENDING',
      dueDate: { lt: now },
    };

    if (req.user?.role !== 'ADMINISTRATOR' && req.user?.role !== 'SUPERVISOR') {
      wherePending.userId = req.user?.id;
      whereOverdue.userId = req.user?.id;
    }

    const [pendingTasks, overdueTasks] = await Promise.all([
      prisma.task.count({ where: wherePending }),
      prisma.task.count({ where: whereOverdue }),
    ]);

    // Reminders: tasks due today or tomorrow
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 59, 999);

    const whereReminders: any = {
      status: 'PENDING',
      dueDate: { gte: now, lte: tomorrow },
    };
    if (req.user?.role !== 'ADMINISTRATOR' && req.user?.role !== 'SUPERVISOR') {
      whereReminders.userId = req.user?.id;
    }

    const reminders = await prisma.task.count({ where: whereReminders });

    res.json({
      pendingTasks,
      overdueTasks,
      reminders,
    });
  } catch (error) {
    console.error('Get CRM summary error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error fetching CRM summary',
      },
    });
  }
};

export const getReminders = async (req: AuthRequest, res: Response) => {
  try {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 59, 999);

    const where: any = {
      status: 'PENDING',
      dueDate: { gte: now, lte: tomorrow },
    };

    if (req.user?.role !== 'ADMINISTRATOR' && req.user?.role !== 'SUPERVISOR') {
      where.userId = req.user?.id;
    }

    const reminders = await prisma.task.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
        user: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { dueDate: 'asc' },
      take: 10,
    });

    res.json({
      data: reminders.map((reminder) => ({
        id: reminder.id,
        title: reminder.title,
        description: reminder.description,
        dueDate: reminder.dueDate,
        client: reminder.client,
        user: reminder.user,
      })),
    });
  } catch (error) {
    console.error('Get reminders error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error fetching reminders',
      },
    });
  }
};

export const getLateCollections = async (req: AuthRequest, res: Response) => {
  try {
    const now = new Date();
    
    const invoices = await prisma.invoice.findMany({
      where: {
        status: { in: ['ISSUED', 'OVERDUE'] },
        dueDate: { lt: now },
        balance: { gt: 0 },
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
      orderBy: { dueDate: 'asc' },
      take: 10,
    });

    const data = invoices.map((invoice) => {
      const daysOverdue = invoice.dueDate
        ? Math.floor((now.getTime() - invoice.dueDate.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      return {
        id: invoice.id,
        number: invoice.number,
        client: invoice.client,
        balance: Number(invoice.balance),
        daysOverdue,
      };
    });

    res.json({ data });
  } catch (error) {
    console.error('Get late collections error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error fetching late collections',
      },
    });
  }
};

