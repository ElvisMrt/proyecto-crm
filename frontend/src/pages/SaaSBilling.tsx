import React, { useEffect, useMemo, useState } from 'react';
import { HiCheckCircle, HiExclamationCircle, HiRefresh } from 'react-icons/hi';
import { saasApi } from '../services/api';

interface Invoice {
  id: string;
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  tenantPlan: string;
  tenantStatus: string;
  amount: number;
  currency: string;
  status: 'DRAFT' | 'ISSUED' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  periodStart: string;
  periodEnd: string;
  paidAt: string | null;
  paymentMethod: string | null;
  paymentReference: string | null;
  createdAt: string;
}

interface BillingStats {
  totalInvoices: number;
  paidThisMonth: number;
  pendingInvoices: number;
  overdueInvoices: number;
  revenueThisMonth: number;
}

const emptyStats: BillingStats = {
  totalInvoices: 0,
  paidThisMonth: 0,
  pendingInvoices: 0,
  overdueInvoices: 0,
  revenueThisMonth: 0,
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: 'DOP',
    minimumFractionDigits: 0,
  }).format(Number(amount || 0));

const formatDate = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString('es-DO') : '—';

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    PAID: 'Pagada',
    ISSUED: 'Emitida',
    OVERDUE: 'Vencida',
    DRAFT: 'Borrador',
    CANCELLED: 'Cancelada',
  };
  return labels[status] || status;
};

const getStatusClass = (status: string) => {
  switch (status) {
    case 'PAID':
      return 'bg-emerald-50 text-emerald-700';
    case 'ISSUED':
      return 'bg-sky-50 text-sky-700';
    case 'OVERDUE':
      return 'bg-rose-50 text-rose-700';
    case 'CANCELLED':
      return 'bg-slate-100 text-slate-500';
    default:
      return 'bg-amber-50 text-amber-700';
  }
};

const SaaSBilling: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState<BillingStats>(emptyStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [markingInvoice, setMarkingInvoice] = useState<Invoice | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('TRANSFER');
  const [paymentReference, setPaymentReference] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    window.setTimeout(() => setToast(null), 3200);
  };

  const fetchBilling = async () => {
    try {
      setLoading(true);
      const [invoicesRes, statsRes] = await Promise.all([
        saasApi.get('/saas/invoices'),
        saasApi.get('/saas/billing/stats'),
      ]);
      setInvoices(invoicesRes.data.data || []);
      setStats(statsRes.data.data || emptyStats);
      setError('');
    } catch (err: any) {
      setInvoices([]);
      setStats(emptyStats);
      setError(err.response?.data?.error?.message || 'No fue posible cargar facturacion SaaS');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBilling();
  }, []);

  const summary = useMemo(() => {
    const paidAmount = invoices
      .filter((invoice) => invoice.status === 'PAID')
      .reduce((sum, invoice) => sum + Number(invoice.amount), 0);
    const overdueAmount = invoices
      .filter((invoice) => invoice.status === 'OVERDUE')
      .reduce((sum, invoice) => sum + Number(invoice.amount), 0);

    return {
      paidAmount,
      overdueAmount,
      collectibleCount: invoices.filter((invoice) => invoice.status !== 'PAID' && invoice.status !== 'CANCELLED').length,
    };
  }, [invoices]);

  const handleGenerateInvoices = async () => {
    try {
      setProcessing(true);
      const response = await saasApi.post('/saas/billing/generate-invoices');
      await fetchBilling();
      showToast(response.data.message || 'Facturas generadas');
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'No fue posible generar facturas', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleSuspendOverdue = async () => {
    try {
      setProcessing(true);
      const response = await saasApi.post('/saas/billing/suspend-overdue');
      await fetchBilling();
      showToast(response.data.message || 'Tenants vencidos suspendidos');
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'No fue posible suspender tenants vencidos', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleMarkPaid = async () => {
    if (!markingInvoice) return;

    try {
      setProcessing(true);
      await saasApi.post('/saas/billing/mark-paid', {
        invoiceId: markingInvoice.id,
        paymentMethod,
        paymentReference: paymentReference || 'manual',
      });
      setMarkingInvoice(null);
      setPaymentMethod('TRANSFER');
      setPaymentReference('');
      await fetchBilling();
      showToast('Factura marcada como pagada');
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'No fue posible registrar el pago', 'error');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[360px] items-center justify-center rounded-[28px] border border-slate-200 bg-white shadow-sm">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-slate-700" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {toast && (
        <div
          className={`fixed right-6 top-6 z-50 rounded-2xl px-5 py-3 text-sm font-medium text-white shadow-lg ${
            toast.type === 'success' ? 'bg-slate-950' : 'bg-rose-600'
          }`}
        >
          {toast.msg}
        </div>
      )}

      <section className="flex flex-col gap-4 rounded-[28px] border border-slate-200 bg-white px-6 py-6 shadow-sm lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Facturacion</p>
          <h1 className="text-2xl font-bold text-slate-950">Billing SaaS</h1>
          <p className="mt-1 text-sm text-slate-500">Control de facturas, cobros manuales y tenants con mora.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={fetchBilling}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <HiRefresh className="h-4 w-4" />
            Recargar
          </button>
          <button
            type="button"
            onClick={handleGenerateInvoices}
            disabled={processing}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            Generar facturas
          </button>
          <button
            type="button"
            onClick={handleSuspendOverdue}
            disabled={processing}
            className="rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"
          >
            Suspender vencidos
          </button>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {[
          { label: 'Facturas', value: stats.totalInvoices },
          { label: 'Pagadas este mes', value: stats.paidThisMonth },
          { label: 'Pendientes', value: stats.pendingInvoices },
          { label: 'Vencidas', value: stats.overdueInvoices },
        ].map((item) => (
          <div key={item.label} className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{item.label}</p>
            <p className="mt-3 text-2xl font-bold text-slate-950">{item.value}</p>
          </div>
        ))}
      </section>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>
      )}

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-950">Facturas emitidas</h2>
            <p className="text-sm text-slate-500">Lista real de facturas SaaS registradas en la base maestra.</p>
          </div>

          {invoices.length === 0 ? (
            <div className="px-6 py-16 text-center text-slate-500">
              No hay facturas SaaS registradas todavia. Puedes generarlas manualmente desde esta pantalla.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Tenant</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Periodo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Monto</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Estado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Pago</th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500">Accion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-950">{invoice.tenantName}</p>
                        <p className="text-sm text-slate-500">{invoice.tenantSlug}.neypier.com</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {formatDate(invoice.periodStart)} - {formatDate(invoice.periodEnd)}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-950">
                        {formatCurrency(invoice.amount)} {invoice.currency}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusClass(invoice.status)}`}>
                          {getStatusLabel(invoice.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {invoice.paidAt ? `${formatDate(invoice.paidAt)} • ${invoice.paymentMethod || 'manual'}` : 'Pendiente'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {invoice.status === 'PAID' ? (
                          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                            <HiCheckCircle className="h-4 w-4" />
                            Pagada
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setMarkingInvoice(invoice)}
                            className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                          >
                            Registrar pago
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-slate-950">Lectura operativa</h2>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <div className="flex items-center justify-between">
                <span>Cobrado historico</span>
                <span className="font-semibold text-slate-950">{formatCurrency(summary.paidAmount)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Vencido acumulado</span>
                <span className="font-semibold text-slate-950">{formatCurrency(summary.overdueAmount)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Facturas por cobrar</span>
                <span className="font-semibold text-slate-950">{summary.collectibleCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Ingresos del mes</span>
                <span className="font-semibold text-slate-950">{formatCurrency(stats.revenueThisMonth)}</span>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-amber-200 bg-amber-50 p-6">
            <div className="flex items-center gap-2 text-amber-800">
              <HiExclamationCircle className="h-5 w-5" />
              <h2 className="text-base font-semibold">Siguiente nivel</h2>
            </div>
            <ul className="mt-4 space-y-2 text-sm text-amber-800/90">
              <li>• Reactivar tenant automaticamente al marcar pago</li>
              <li>• Mostrar trial y renovacion dentro de billing</li>
              <li>• Agregar historial de suscripcion por tenant</li>
            </ul>
          </div>
        </div>
      </section>

      {markingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.2)]">
            <div className="border-b border-slate-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-950">Registrar pago SaaS</h2>
            </div>
            <div className="space-y-4 px-6 py-6">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                <p className="font-medium text-slate-950">{markingInvoice.tenantName}</p>
                <p className="mt-1">{formatCurrency(markingInvoice.amount)} {markingInvoice.currency}</p>
                <p className="mt-1 text-slate-500">
                  Periodo: {formatDate(markingInvoice.periodStart)} - {formatDate(markingInvoice.periodEnd)}
                </p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Metodo de pago</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                >
                  <option value="TRANSFER">Transferencia</option>
                  <option value="CASH">Efectivo</option>
                  <option value="CARD">Tarjeta</option>
                  <option value="ACH">ACH</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Referencia</label>
                <input
                  type="text"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="Transferencia, recibo o nota"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setMarkingInvoice(null);
                    setPaymentMethod('TRANSFER');
                    setPaymentReference('');
                  }}
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleMarkPaid}
                  disabled={processing}
                  className="flex-1 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"
                >
                  {processing ? 'Guardando...' : 'Marcar pagada'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SaaSBilling;
