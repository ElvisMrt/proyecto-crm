import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiArrowRight, HiClock, HiCurrencyDollar, HiExclamationCircle, HiOfficeBuilding } from 'react-icons/hi';
import { saasApi } from '../services/api';

interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  email: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING' | 'CANCELLED';
  plan: 'BASIC' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
  createdAt: string;
  trialEndsAt?: string | null;
  lastActiveAt?: string | null;
}

interface Stats {
  totalTenants: number;
  activeTenants: number;
  totalRevenue: number;
  newThisMonth: number;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: 'DOP',
    minimumFractionDigits: 0,
  }).format(amount || 0);

const formatDate = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString('es-DO') : 'Sin actividad';

const getOperationalStatus = (tenant: Tenant) => {
  if (tenant.status === 'SUSPENDED') return 'Suspendido';
  if (tenant.status === 'CANCELLED') return 'Cancelado';
  if (tenant.status === 'PENDING') return 'Provisioning';
  if (tenant.trialEndsAt && new Date(tenant.trialEndsAt) > new Date()) return 'Trial';
  return 'Activo';
};

export default function SaaSDashboard() {
  const navigate = useNavigate();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [stats, setStats] = useState<Stats>({ totalTenants: 0, activeTenants: 0, totalRevenue: 0, newThisMonth: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tenantsRes, statsRes] = await Promise.allSettled([
          saasApi.get('/saas/tenants'),
          saasApi.get('/saas/stats'),
        ]);

        if (tenantsRes.status === 'fulfilled') {
          setTenants(tenantsRes.value.data.data || []);
        }

        if (statsRes.status === 'fulfilled') {
          setStats(statsRes.value.data.data || { totalTenants: 0, activeTenants: 0, totalRevenue: 0, newThisMonth: 0 });
        }
      } catch (error) {
        console.error('Error fetching SaaS dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const derived = useMemo(() => {
    const pendingProvisioning = tenants.filter((tenant) => tenant.status === 'PENDING').length;
    const suspended = tenants.filter((tenant) => tenant.status === 'SUSPENDED').length;
    const trial = tenants.filter((tenant) => tenant.trialEndsAt && new Date(tenant.trialEndsAt) > new Date()).length;
    const inactive = tenants.filter((tenant) => !tenant.lastActiveAt).length;
    const recent = [...tenants]
      .sort((a, b) => {
        const left = a.lastActiveAt ? new Date(a.lastActiveAt).getTime() : 0;
        const right = b.lastActiveAt ? new Date(b.lastActiveAt).getTime() : 0;
        return right - left;
      })
      .slice(0, 6);

    return { pendingProvisioning, suspended, trial, inactive, recent };
  }, [tenants]);

  if (loading) {
    return (
      <div className="flex min-h-[360px] items-center justify-center rounded-[28px] border border-slate-200 bg-white shadow-sm">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-slate-700" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-[28px] border border-slate-200 bg-white px-6 py-6 shadow-sm lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Vista general</p>
          <h1 className="text-2xl font-bold text-slate-950">Panel SaaS</h1>
          <p className="mt-1 text-sm text-slate-500">Estado operativo de tenants, provisioning y facturación.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => navigate('/tenants')}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Ver tenants
          </button>
          <button
            type="button"
            onClick={() => navigate('/billing')}
            className="rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Revisar facturación
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Tenants totales', value: stats.totalTenants, note: `${stats.newThisMonth} nuevos este mes`, icon: HiOfficeBuilding },
          { label: 'Activos', value: stats.activeTenants, note: `${derived.trial} en trial`, icon: HiCurrencyDollar },
          { label: 'Provisioning', value: derived.pendingProvisioning, note: 'Pendientes de completar', icon: HiClock },
          { label: 'Suspendidos', value: derived.suspended, note: `${derived.inactive} sin actividad registrada`, icon: HiExclamationCircle },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div className="rounded-2xl bg-slate-100 p-2 text-slate-700">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-medium text-slate-500">{item.label}</span>
              </div>
              <p className="text-3xl font-bold text-slate-950">{item.value}</p>
              <p className="mt-1 text-sm text-slate-500">{item.note}</p>
            </div>
          );
        })}
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.1fr)_360px]">
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Actividad reciente</h2>
              <p className="text-sm text-slate-500">Tenants con movimiento más reciente.</p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/tenants')}
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 transition hover:text-slate-950"
            >
              Ver todos
              <HiArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="divide-y divide-slate-200">
            {derived.recent.length === 0 ? (
              <div className="px-6 py-12 text-center text-slate-500">Todavía no hay actividad registrada.</div>
            ) : (
              derived.recent.map((tenant) => (
                <button
                  key={tenant.id}
                  type="button"
                  onClick={() => navigate(`/tenants/${tenant.id}`)}
                  className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left transition hover:bg-slate-50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-950">{tenant.name}</p>
                    <p className="truncate text-sm text-slate-500">{tenant.subdomain}.neypier.com</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-700">{getOperationalStatus(tenant)}</p>
                    <p className="text-xs text-slate-500">{formatDate(tenant.lastActiveAt)}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">Cobranza SaaS</h2>
            <p className="mt-1 text-sm text-slate-500">El backend solo expone métricas básicas. La facturación detallada aún requiere cierre funcional.</p>
            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Ingresos reportados</span>
                <span className="font-semibold text-slate-950">{formatCurrency(stats.totalRevenue)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Nuevos tenants</span>
                <span className="font-semibold text-slate-950">{stats.newThisMonth}</span>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">Alertas operativas</h2>
            <div className="mt-4 space-y-3 text-sm text-slate-700">
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <p className="font-medium text-slate-950">{derived.pendingProvisioning} tenant(s) en provisioning</p>
                <p className="mt-1 text-slate-500">Conviene priorizar reprovisión y validación de acceso.</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <p className="font-medium text-slate-950">{derived.suspended} tenant(s) suspendidos</p>
                <p className="mt-1 text-slate-500">Falta una operación de reactivación y trazabilidad más robusta.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
