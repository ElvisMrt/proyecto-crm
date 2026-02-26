import { PrismaClient } from '@prisma/client';

/**
 * Servicio de facturación automática para tenants SaaS
 * Genera invoices mensuales según el plan del tenant
 */
export class BillingService {
  private masterPrisma: PrismaClient;

  constructor(masterPrisma: PrismaClient) {
    this.masterPrisma = masterPrisma;
  }

  /**
   * Precios por plan (en DOP - Pesos Dominicanos)
   */
  private planPrices: { [key: string]: number } = {
    'BASIC': 2900,        // ~$50 USD
    'PROFESSIONAL': 7900, // ~$135 USD
    'ENTERPRISE': 19900,  // ~$340 USD
  };

  /**
   * Genera facturas mensuales para todos los tenants activos
   * Debe ejecutarse una vez al mes (vía cron o manual)
   */
  async generateMonthlyInvoices(): Promise<{
    generated: number;
    errors: number;
    details: Array<{ tenantId: string; invoiceId?: string; error?: string }>;
  }> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const result = {
      generated: 0,
      errors: 0,
      details: [] as Array<{ tenantId: string; invoiceId?: string; error?: string }>,
    };

    try {
      // Obtener todos los tenants activos
      const tenants = await this.masterPrisma.tenant.findMany({
        where: {
          status: 'ACTIVE',
          OR: [
            { trialEndsAt: null },
            { trialEndsAt: { lt: now } },
          ],
        },
      });

      console.log(`[Billing] Generando facturas para ${tenants.length} tenants activos`);

      for (const tenant of tenants) {
        try {
          // Verificar si ya existe una factura para este período
          const existingInvoice = await this.masterPrisma.tenantInvoice.findFirst({
            where: {
              tenantId: tenant.id,
              periodStart: startOfMonth,
              periodEnd: endOfMonth,
            },
          });

          if (existingInvoice) {
            console.log(`[Billing] Tenant ${tenant.slug} ya tiene factura para este período`);
            result.details.push({
              tenantId: tenant.id,
              error: 'Factura ya existe para este período',
            });
            continue;
          }

          // Calcular monto según plan
          const baseAmount = this.planPrices[tenant.plan] || this.planPrices['BASIC'];

          // Crear la factura
          const invoice = await this.masterPrisma.tenantInvoice.create({
            data: {
              tenantId: tenant.id,
              amount: baseAmount,
              currency: 'DOP',
              status: 'DRAFT',
              description: `Suscripción ${tenant.plan} - ${now.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}`,
              periodStart: startOfMonth,
              periodEnd: endOfMonth,
              metadata: JSON.stringify({
                plan: tenant.plan,
                tenantSlug: tenant.slug,
                generatedAt: new Date().toISOString(),
              }),
            },
          });

          // Registrar actividad
          await this.masterPrisma.tenantActivity.create({
            data: {
              tenantId: tenant.id,
              action: 'INVOICE_GENERATED',
              description: `Factura #${invoice.id.slice(0, 8)} generada por $${baseAmount} DOP`,
              metadata: { invoiceId: invoice.id, amount: baseAmount },
            },
          });

          result.generated++;
          result.details.push({ tenantId: tenant.id, invoiceId: invoice.id });
          console.log(`[Billing] ✅ Factura generada para ${tenant.slug}: $${baseAmount}`);
        } catch (error: any) {
          result.errors++;
          result.details.push({
            tenantId: tenant.id,
            error: error.message || 'Error desconocido',
          });
          console.error(`[Billing] ❌ Error generando factura para ${tenant.slug}:`, error);
        }
      }

      console.log(`[Billing] Resumen: ${result.generated} facturas generadas, ${result.errors} errores`);
      return result;
    } catch (error) {
      console.error('[Billing] Error general:', error);
      throw error;
    }
  }

  /**
   * Marca una factura como pagada
   */
  async markInvoiceAsPaid(
    invoiceId: string,
    paymentMethod: string,
    paymentReference: string
  ): Promise<boolean> {
    try {
      const invoice = await this.masterPrisma.tenantInvoice.update({
        where: { id: invoiceId },
        data: {
          status: 'PAID',
          paidAt: new Date(),
          paymentMethod,
          paymentReference,
        },
      });

      // Registrar actividad
      await this.masterPrisma.tenantActivity.create({
        data: {
          tenantId: invoice.tenantId,
          action: 'INVOICE_PAID',
          description: `Factura #${invoiceId.slice(0, 8)} pagada por $${invoice.amount} DOP`,
          metadata: {
            invoiceId: invoice.id,
            amount: invoice.amount,
            paymentMethod,
          },
        },
      });

      console.log(`[Billing] ✅ Factura ${invoiceId} marcada como pagada`);
      return true;
    } catch (error) {
      console.error(`[Billing] ❌ Error marcando factura como pagada:`, error);
      return false;
    }
  }

  /**
   * Suspende tenants con facturas vencidas
   * Debe ejecutarse diariamente
   */
  async suspendOverdueTenants(): Promise<{
    suspended: number;
    details: Array<{ tenantId: string; tenantSlug: string; reason: string }>;
  }> {
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const result = {
      suspended: 0,
      details: [] as Array<{ tenantId: string; tenantSlug: string; reason: string }>,
    };

    try {
      // Buscar facturas vencidas (no pagadas después de 7 días del período)
      const overdueInvoices = await this.masterPrisma.tenantInvoice.findMany({
        where: {
          status: { not: 'PAID' },
          periodEnd: { lt: sevenDaysAgo },
        },
        include: { tenant: true },
      });

      for (const invoice of overdueInvoices) {
        // Verificar si el tenant ya está suspendido
        if (invoice.tenant.status === 'SUSPENDED') continue;

        // Suspender tenant
        await this.masterPrisma.tenant.update({
          where: { id: invoice.tenantId },
          data: { status: 'SUSPENDED' },
        });

        // Registrar actividad
        await this.masterPrisma.tenantActivity.create({
          data: {
            tenantId: invoice.tenantId,
            action: 'TENANT_SUSPENDED',
            description: `Tenant suspendido por factura vencida #${invoice.id.slice(0, 8)}`,
            metadata: { invoiceId: invoice.id, amount: invoice.amount },
          },
        });

        result.suspended++;
        result.details.push({
          tenantId: invoice.tenantId,
          tenantSlug: invoice.tenant.slug,
          reason: `Factura vencida de $${invoice.amount} DOP`,
        });

        console.log(`[Billing] ⛔ Tenant ${invoice.tenant.slug} suspendido por factura vencida`);
      }

      return result;
    } catch (error) {
      console.error('[Billing] Error suspendiendo tenants:', error);
      throw error;
    }
  }

  /**
   * Obtiene estadísticas de facturación
   */
  async getBillingStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalInvoices,
      paidThisMonth,
      pendingInvoices,
      overdueInvoices,
      revenueThisMonth,
    ] = await Promise.all([
      this.masterPrisma.tenantInvoice.count(),
      this.masterPrisma.tenantInvoice.count({
        where: { status: 'PAID', createdAt: { gte: startOfMonth } },
      }),
      this.masterPrisma.tenantInvoice.count({
        where: { status: 'DRAFT' },
      }),
      this.masterPrisma.tenantInvoice.count({
        where: {
          status: { not: 'PAID' },
          periodEnd: { lt: now },
        },
      }),
      this.masterPrisma.tenantInvoice.aggregate({
        where: { status: 'PAID', createdAt: { gte: startOfMonth } },
        _sum: { amount: true },
      }),
    ]);

    return {
      totalInvoices,
      paidThisMonth,
      pendingInvoices,
      overdueInvoices,
      revenueThisMonth: revenueThisMonth._sum.amount || 0,
    };
  }
}

export default BillingService;
