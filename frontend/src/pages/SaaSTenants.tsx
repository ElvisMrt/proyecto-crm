import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { HiArrowRight, HiOfficeBuilding, HiPlus, HiSearch } from 'react-icons/hi';
import { saasApi } from '../services/api';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  subdomain: string;
  email: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'CANCELLED' | 'PENDING';
  plan: 'BASIC' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
  createdAt: string;
  updatedAt?: string;
  trialEndsAt?: string | null;
  lastActiveAt?: string | null;
  databaseName: string;
}

const emptyForm = {
  name: '',
  slug: '',
  email: '',
  adminEmail: '',
  adminPassword: '',
  plan: 'BASIC',
};

const formatDate = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString('es-DO') : 'Sin actividad';

const getOperationalStatus = (tenant: Tenant) => {
  if (tenant.status === 'SUSPENDED') return { label: 'Suspendido', className: 'bg-rose-50 text-rose-700' };
  if (tenant.status === 'CANCELLED') return { label: 'Cancelado', className: 'bg-slate-100 text-slate-500' };
  if (tenant.status === 'PENDING') return { label: 'Provisioning', className: 'bg-amber-50 text-amber-700' };
  if (tenant.trialEndsAt && new Date(tenant.trialEndsAt) > new Date()) return { label: 'Trial', className: 'bg-sky-50 text-sky-700' };
  return { label: 'Activo', className: 'bg-emerald-50 text-emerald-700' };
};

const getPlanLabel = (plan: string) => {
  const labels: Record<string, string> = {
    BASIC: 'Basico',
    STARTER: 'Starter',
    PROFESSIONAL: 'Profesional',
    ENTERPRISE: 'Enterprise',
  };
  return labels[plan] || plan;
};

const SaaSTenants: React.FC = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'CANCELLED'>('ALL');
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const response = await saasApi.get('/saas/tenants');
      setTenants(response.data.data || []);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Error cargando tenants');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await saasApi.post('/saas/tenants', formData);
      setShowModal(false);
      setFormData(emptyForm);
      fetchTenants();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Error creando tenant');
    } finally {
      setSaving(false);
    }
  };

  const filteredTenants = useMemo(() => {
    return tenants.filter((tenant) => {
      const matchesSearch =
        tenant.name.toLowerCase().includes(search.toLowerCase()) ||
        tenant.email.toLowerCase().includes(search.toLowerCase()) ||
        tenant.subdomain.toLowerCase().includes(search.toLowerCase());

      const matchesStatus = statusFilter === 'ALL' || tenant.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [tenants, search, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: tenants.length,
      active: tenants.filter((tenant) => tenant.status === 'ACTIVE').length,
      pending: tenants.filter((tenant) => tenant.status === 'PENDING').length,
      suspended: tenants.filter((tenant) => tenant.status === 'SUSPENDED').length,
    };
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
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Tenants</p>
          <h1 className="text-2xl font-bold text-slate-950">Gestion operativa</h1>
          <p className="mt-1 text-sm text-slate-500">Provisioning, estado, actividad y acceso de cada empresa.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          <HiPlus className="h-4 w-4" />
          Nuevo tenant
        </button>
      </section>

      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {[
          { label: 'Totales', value: stats.total },
          { label: 'Activos', value: stats.active },
          { label: 'Provisioning', value: stats.pending },
          { label: 'Suspendidos', value: stats.suspended },
        ].map((item) => (
          <div key={item.label} className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{item.label}</p>
            <p className="mt-3 text-3xl font-bold text-slate-950">{item.value}</p>
          </div>
        ))}
      </section>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      <section className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Bandeja de tenants</h2>
              <p className="text-sm text-slate-500">Usa esta vista para detectar tenants pendientes, suspendidos o sin actividad.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative min-w-[240px]">
                <HiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por empresa, correo o subdominio"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              >
                <option value="ALL">Todos los estados</option>
                <option value="ACTIVE">Activos</option>
                <option value="PENDING">Provisioning</option>
                <option value="SUSPENDED">Suspendidos</option>
                <option value="CANCELLED">Cancelados</option>
              </select>
            </div>
          </div>
        </div>

        {filteredTenants.length === 0 ? (
          <div className="px-6 py-16 text-center text-slate-500">
            No hay tenants que coincidan con el filtro actual.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Empresa</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Plan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Provisioning</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Ultima actividad</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Creado</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredTenants.map((tenant) => {
                  const status = getOperationalStatus(tenant);
                  return (
                    <tr key={tenant.id} className="transition hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                            <HiOfficeBuilding className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-950">{tenant.name}</p>
                            <p className="text-sm text-slate-500">{tenant.subdomain}.neypier.com</p>
                            <p className="text-xs text-slate-400">{tenant.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                          {getPlanLabel(tenant.plan)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${status.className}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {tenant.status === 'PENDING' ? 'Pendiente' : 'Listo'}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {formatDate(tenant.lastActiveAt)}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {formatDate(tenant.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          to={`/tenants/${tenant.id}`}
                          className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 transition hover:text-slate-950"
                        >
                          Ver detalle
                          <HiArrowRight className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-lg rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.2)]">
            <div className="border-b border-slate-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-950">Crear tenant</h2>
              <p className="mt-1 text-sm text-slate-500">Provisiona empresa, subdominio y admin inicial.</p>
            </div>
            <form onSubmit={handleCreateTenant} className="space-y-4 px-6 py-6">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Nombre de la empresa</label>
                <input
                  type="text"
                  required
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Slug</label>
                <input
                  type="text"
                  required
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  placeholder="mi-empresa"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Email empresa</label>
                  <input
                    type="email"
                    required
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Plan</label>
                  <select
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                    value={formData.plan}
                    onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                  >
                    <option value="BASIC">Basico</option>
                    <option value="STARTER">Starter</option>
                    <option value="PROFESSIONAL">Profesional</option>
                    <option value="ENTERPRISE">Enterprise</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Admin email</label>
                  <input
                    type="email"
                    required
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                    value={formData.adminEmail}
                    onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Admin password</label>
                  <input
                    type="password"
                    required
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                    value={formData.adminPassword}
                    onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"
                >
                  {saving ? 'Creando...' : 'Crear tenant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SaaSTenants;
