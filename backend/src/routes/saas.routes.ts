import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { masterPrisma } from '../middleware/tenant.middleware';
import { saasAdminMiddleware } from '../middleware/tenant.middleware';
import TenantProvisioningService from '../services/tenantProvisioning.service';
import BillingService from '../services/billing.service';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

// Instanciar servicios
const provisioningService = new TenantProvisioningService(masterPrisma);
const billingService = new BillingService(masterPrisma);

// POST /saas/login - Login para Super Admin
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('[SaaS Login] Intento de login:', { email, passwordProvided: !!password });

    if (!email || !password) {
      console.log('[SaaS Login] Error: Email o password faltantes');
      return res.status(400).json({
        error: { code: 'INVALID_CREDENTIALS', message: 'Email y contraseña requeridos' }
      });
    }

    // Buscar usuario en Master DB
    const user = await masterPrisma.masterUser.findUnique({
      where: { email },
    });
    
    console.log('[SaaS Login] Usuario encontrado:', !!user);

    if (!user) {
      console.log('[SaaS Login] Error: Usuario no existe:', email);
      return res.status(401).json({
        error: { code: 'INVALID_CREDENTIALS', message: 'Credenciales inválidas (usuario no existe)' }
      });
    }

    console.log('[SaaS Login] Usuario:', { id: user.id, email: user.email, role: user.role });

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, user.password);
    console.log('[SaaS Login] Password válido:', isValidPassword);
    
    if (!isValidPassword) {
      console.log('[SaaS Login] Error: Password inválido');
      return res.status(401).json({
        error: { code: 'INVALID_CREDENTIALS', message: 'Credenciales inválidas (password incorrecto)' }
      });
    }

    // Verificar que sea SUPER_ADMIN
    if (user.role !== 'SUPER_ADMIN') {
      console.log('[SaaS Login] Error: Rol no es SUPER_ADMIN:', user.role);
      return res.status(403).json({
        error: { code: 'FORBIDDEN', message: 'Acceso solo para Super Admin' }
      });
    }

    // Generar token JWT
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    console.log('[SaaS Login] Login exitoso:', user.email);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      }
    });
  } catch (error) {
    console.error('[SaaS Login] Error interno:', error);
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Error al iniciar sesión' }
    });
  }
});

// GET /saas/tenants - Listar todos los tenants (protegido)
router.get('/tenants', saasAdminMiddleware, async (req, res) => {
  try {
    const tenants = await masterPrisma.tenant.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            users: true,
            subscriptions: true,
          }
        }
      }
    });

    res.json({
      success: true,
      data: tenants,
    });
  } catch (error) {
    console.error('Get tenants error:', error);
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Error al obtener tenants' }
    });
  }
});

// GET /saas/tenants/:id - Obtener detalle de un tenant
router.get('/tenants/:id', saasAdminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const tenant = await masterPrisma.tenant.findUnique({
      where: { id },
    });

    if (!tenant) {
      return res.status(404).json({
        error: { code: 'TENANT_NOT_FOUND', message: 'Tenant no encontrado' }
      });
    }

    res.json({
      success: true,
      data: tenant,
    });
  } catch (error) {
    console.error('Get tenant error:', error);
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Error al obtener tenant' }
    });
  }
});

// POST /saas/tenants - Crear nuevo tenant
router.post('/tenants', saasAdminMiddleware, async (req, res) => {
  try {
    const {
      name,
      slug,
      email,
      phone,
      address,
      rnc,
      plan,
      adminEmail,
      adminName,
      adminPassword,
    } = req.body;

    // Validaciones
    if (!name || !slug || !email || !adminEmail || !adminPassword) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Campos requeridos faltantes' }
      });
    }

    // Verificar que el slug no exista
    const existingSlug = await masterPrisma.tenant.findUnique({
      where: { slug },
    });

    if (existingSlug) {
      return res.status(400).json({
        error: { code: 'SLUG_EXISTS', message: 'El slug ya está en uso' }
      });
    }

    // En arquitectura de BD compartida, todos los tenants usan la misma URL
    const databaseName = `crm_tenant_${slug}`; // Solo para referencia
    const databaseUrl = process.env.DATABASE_URL || ''; // Usar la misma BD para todos

    // Crear tenant
    const tenant = await masterPrisma.tenant.create({
      data: {
        slug,
        name,
        subdomain: slug,
        email,
        phone,
        address,
        rnc,
        status: 'ACTIVE',
        plan: plan || 'BASIC',
        databaseName,
        databaseUrl,
        billingEmail: email,
        settings: JSON.stringify({
          theme: 'light',
          currency: 'DOP',
          timezone: 'America/Santo_Domingo',
          language: 'es',
        }),
        limits: JSON.stringify({
          maxUsers: plan === 'BASIC' ? 5 : plan === 'PROFESSIONAL' ? 20 : 100,
          maxStorage: plan === 'BASIC' ? '1GB' : plan === 'PROFESSIONAL' ? '10GB' : '100GB',
          maxBranches: plan === 'BASIC' ? 1 : plan === 'PROFESSIONAL' ? 3 : 10,
        }),
      },
    });

    // Crear admin del tenant (como MasterUser con rol SUPPORT para ese tenant)
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    await masterPrisma.masterUser.create({
      data: {
        email: adminEmail,
        name: adminName || 'Administrador',
        password: hashedPassword,
        role: 'SUPPORT',
        tenantId: tenant.id,
      },
    });

    // Provisioning: Crear DB física, aplicar schema y seed
    const provisioningResult = await provisioningService.provisionTenant(
      tenant.id,
      {
        name: adminName || 'Administrador',
        email: adminEmail,
        password: adminPassword,
        companyName: name,
      }
    );

    if (!provisioningResult.success) {
      // Si falla el provisioning, marcar tenant como PENDING para reintentar después
      await masterPrisma.tenant.update({
        where: { id: tenant.id },
        data: { status: 'PENDING' },
      });

      return res.status(500).json({
        error: { 
          code: 'PROVISIONING_ERROR', 
          message: `Tenant creado pero falló el provisioning: ${provisioningResult.message}. Requiere provisioning manual.` 
        }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Tenant creado y provisionado exitosamente',
      data: tenant,
    });
  } catch (error) {
    console.error('Create tenant error:', error);
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Error al crear tenant' }
    });
  }
});

// PUT /saas/tenants/:id - Actualizar tenant
router.put('/tenants/:id', saasAdminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // No permitir actualizar ciertos campos críticos
    delete updateData.id;
    delete updateData.databaseName;
    delete updateData.databaseUrl;

    const tenant = await masterPrisma.tenant.update({
      where: { id },
      data: updateData,
    });

    res.json({
      success: true,
      message: 'Tenant actualizado',
      data: tenant,
    });
  } catch (error) {
    console.error('Update tenant error:', error);
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Error al actualizar tenant' }
    });
  }
});

// DELETE /saas/tenants/:id - Eliminar tenant
router.delete('/tenants/:id', saasAdminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que el tenant existe
    const tenant = await masterPrisma.tenant.findUnique({
      where: { id },
    });

    if (!tenant) {
      return res.status(404).json({
        error: { code: 'TENANT_NOT_FOUND', message: 'Tenant no encontrado' }
      });
    }

    // Eliminar la base de datos física del tenant
    if (tenant.databaseName) {
      await provisioningService.deleteTenantDatabase(tenant.databaseName);
    }

    // Eliminar el tenant de la base de datos maestra
    await masterPrisma.tenant.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Tenant eliminado exitosamente',
    });
  } catch (error) {
    console.error('Delete tenant error:', error);
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Error al eliminar tenant' }
    });
  }
});

// GET /saas/stats - Estadísticas del SaaS
router.get('/stats', saasAdminMiddleware, async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const totalTenants = await masterPrisma.tenant.count();
    const activeTenants = await masterPrisma.tenant.count({ where: { status: 'ACTIVE' } });
    const newThisMonth = await masterPrisma.tenant.count({
      where: { createdAt: { gte: startOfMonth } }
    });

    res.json({
      success: true,
      data: {
        totalTenants,
        activeTenants,
        newThisMonth,
        totalRevenue: 0,
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Error al obtener estadísticas' }
    });
  }
});

// GET /saas/invoices - Listar facturas de todos los tenants
router.get('/invoices', saasAdminMiddleware, async (req, res) => {
  try {
    // Por ahora devolver array vacío hasta que se configure correctamente el schema
    res.json({
      success: true,
      data: [],
    });
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Error al obtener facturas' }
    });
  }
});

// POST /saas/billing/generate-invoices - Generar facturas mensuales (manual)
router.post('/billing/generate-invoices', saasAdminMiddleware, async (req, res) => {
  try {
    const result = await billingService.generateMonthlyInvoices();
    res.json({
      success: true,
      message: `${result.generated} facturas generadas, ${result.errors} errores`,
      data: result,
    });
  } catch (error) {
    console.error('Generate invoices error:', error);
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Error al generar facturas' }
    });
  }
});

// POST /saas/billing/mark-paid - Marcar factura como pagada
router.post('/billing/mark-paid', saasAdminMiddleware, async (req, res) => {
  try {
    const { invoiceId, paymentMethod, paymentReference } = req.body;
    
    if (!invoiceId || !paymentMethod) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'invoiceId y paymentMethod son requeridos' }
      });
    }

    const success = await billingService.markInvoiceAsPaid(
      invoiceId,
      paymentMethod,
      paymentReference || 'manual'
    );

    if (success) {
      res.json({
        success: true,
        message: 'Factura marcada como pagada',
      });
    } else {
      res.status(500).json({
        error: { code: 'INTERNAL_ERROR', message: 'Error al marcar factura como pagada' }
      });
    }
  } catch (error) {
    console.error('Mark paid error:', error);
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Error al procesar pago' }
    });
  }
});

// POST /saas/billing/suspend-overdue - Suspender tenants con facturas vencidas
router.post('/billing/suspend-overdue', saasAdminMiddleware, async (req, res) => {
  try {
    const result = await billingService.suspendOverdueTenants();
    res.json({
      success: true,
      message: `${result.suspended} tenants suspendidos`,
      data: result,
    });
  } catch (error) {
    console.error('Suspend overdue error:', error);
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Error al suspender tenants' }
    });
  }
});

// GET /saas/billing/stats - Estadísticas de facturación
router.get('/billing/stats', saasAdminMiddleware, async (req, res) => {
  try {
    const stats = await billingService.getBillingStats();
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Billing stats error:', error);
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Error al obtener estadísticas de facturación' }
    });
  }
});

// Importar servicio de backup
import BackupService from '../services/backup.service';
const backupService = new BackupService();

// POST /saas/tenants/:id/backup - Crear backup de un tenant
router.post('/tenants/:id/backup', saasAdminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const tenant = await masterPrisma.tenant.findUnique({
      where: { id },
    });

    if (!tenant) {
      return res.status(404).json({
        error: { code: 'TENANT_NOT_FOUND', message: 'Tenant no encontrado' }
      });
    }

    const result = await backupService.createBackup(tenant.databaseName, tenant.id);

    if (result.success) {
      res.json({
        success: true,
        message: 'Backup creado exitosamente',
        data: {
          filename: result.filename,
          size: result.size,
        },
      });
    } else {
      res.status(500).json({
        error: { code: 'BACKUP_ERROR', message: result.error || 'Error al crear backup' }
      });
    }
  } catch (error) {
    console.error('Backup error:', error);
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Error al crear backup' }
    });
  }
});

// GET /saas/tenants/:id/backups - Listar backups de un tenant
router.get('/tenants/:id/backups', saasAdminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const tenant = await masterPrisma.tenant.findUnique({
      where: { id },
    });

    if (!tenant) {
      return res.status(404).json({
        error: { code: 'TENANT_NOT_FOUND', message: 'Tenant no encontrado' }
      });
    }

    const backups = await backupService.listBackups(tenant.databaseName);

    res.json({
      success: true,
      data: backups,
    });
  } catch (error) {
    console.error('List backups error:', error);
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Error al listar backups' }
    });
  }
});

// POST /saas/backup-all - Crear backup de todos los tenants
router.post('/backup-all', saasAdminMiddleware, async (req, res) => {
  try {
    const result = await backupService.backupAllTenants(masterPrisma);

    res.json({
      success: true,
      message: `${result.success}/${result.total} backups completados`,
      data: result,
    });
  } catch (error) {
    console.error('Backup all error:', error);
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Error al crear backups' }
    });
  }
});

export default router;
