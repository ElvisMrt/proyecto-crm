import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  HiArrowLeft,
  HiExclamationCircle,
  HiExternalLink,
  HiOfficeBuilding,
  HiRefresh,
  HiShieldCheck,
} from 'react-icons/hi';
import { saasApi } from '../services/api';

const CRM_DOMAIN = 'neypier.com';

interface TenantUser {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  lastLogin: string | null;
  createdAt: string;
}

interface Subscription {
  id: string;
  plan: string;
  status: string;
  startDate: string;
  endDate: string | null;
  billingCycle: string;
  createdAt: string;
}

interface TenantInvoice {
  id: string;
  amount: number;
  currency: string;
  status: string;
  description: string | null;
  periodStart: string;
  periodEnd: string;
  createdAt: string;
  paidAt: string | null;
  paymentMethod: string | null;
}

interface TenantActivity {
  id: string;
  action: string;
  description: string;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

interface BackupEntry {
  filename: string;
  size: number;
  createdAt: string;
}

interface NewUserForm {
  name: string;
  email: string;
  role: string;
  password: string;
  isActive: boolean;
}

interface Tenant {
  id: string;
  name: string;
  slug: string;
  subdomain: string;
  customDomain: string | null;
  email: string;
  phone: string | null;
  address: string | null;
  rnc: string | null;
  status: 'ACTIVE' | 'SUSPENDED' | 'CANCELLED' | 'PENDING';
  plan: string;
  databaseName: string;
  databaseUrl: string;
  billingEmail: string;
  settings: Record<string, any>;
  limits: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  lastActiveAt: string | null;
  trialEndsAt?: string | null;
  tenantUsers: TenantUser[];
  subscriptions: Subscription[];
  invoices: TenantInvoice[];
  activities: TenantActivity[];
  _count?: {
    invoices: number;
    activities: number;
    subscriptions: number;
  };
}

type TabId = 'overview' | 'subscription' | 'users' | 'backups' | 'audit' | 'technical';

const ROLE_LABELS: Record<string, string> = {
  ADMINISTRATOR: 'Administrador',
  SUPERVISOR: 'Supervisor',
  OPERATOR: 'Operador',
  CASHIER: 'Cajero',
};

const formatDate = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString('es-DO') : 'Sin actividad';

const formatDateTime = (value?: string | null) =>
  value ? new Date(value).toLocaleString('es-DO') : 'Sin registro';

const formatCurrency = (amount?: number | null, currency = 'DOP') =>
  new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(Number(amount || 0));

const formatBytes = (size?: number | null) => {
  const bytes = Number(size || 0);
  if (!bytes) return '0 B';
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
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

const getStatusMeta = (tenant: Tenant) => {
  if (tenant.status === 'PENDING') return { label: 'Provisioning', className: 'bg-amber-50 text-amber-700' };
  if (tenant.status === 'SUSPENDED') return { label: 'Suspendido', className: 'bg-rose-50 text-rose-700' };
  if (tenant.status === 'CANCELLED') return { label: 'Cancelado', className: 'bg-slate-100 text-slate-500' };
  if (tenant.settings?.maintenanceMode) return { label: 'Mantenimiento', className: 'bg-sky-50 text-sky-700' };
  if (tenant.trialEndsAt && new Date(tenant.trialEndsAt) > new Date()) return { label: 'Trial', className: 'bg-indigo-50 text-indigo-700' };
  return { label: 'Activo', className: 'bg-emerald-50 text-emerald-700' };
};

const getInvoiceStatusClass = (status: string) => {
  switch (status) {
    case 'PAID':
      return 'bg-emerald-50 text-emerald-700';
    case 'OVERDUE':
      return 'bg-rose-50 text-rose-700';
    case 'CANCELLED':
      return 'bg-slate-100 text-slate-500';
    case 'ISSUED':
      return 'bg-sky-50 text-sky-700';
    default:
      return 'bg-amber-50 text-amber-700';
  }
};

const getActivityLabel = (action: string) => {
  const labels: Record<string, string> = {
    INVOICE_GENERATED: 'Factura generada',
    INVOICE_PAID: 'Factura pagada',
    TENANT_SUSPENDED: 'Tenant suspendido',
  };
  return labels[action] || action.replace(/_/g, ' ');
};

const maskConnectionString = (value?: string | null) => {
  if (!value) return 'No disponible';
  return value.replace(/:[^:@]*@/, ':****@');
};

const SaaSTenantDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [backups, setBackups] = useState<BackupEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [editingUser, setEditingUser] = useState<TenantUser | null>(null);
  const [userEditForm, setUserEditForm] = useState<any>({});
  const [resetPasswordUserId, setResetPasswordUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [newUserForm, setNewUserForm] = useState<NewUserForm>({
    name: '',
    email: '',
    role: 'OPERATOR',
    password: '',
    isActive: true,
  });
  const [showReprovisionModal, setShowReprovisionModal] = useState(false);
  const [reprovisionPassword, setReprovisionPassword] = useState('');
  const [generatedProvisionPassword, setGeneratedProvisionPassword] = useState('');
  const [restoreTarget, setRestoreTarget] = useState<BackupEntry | null>(null);
  const [saving, setSaving] = useState(false);
  const [togglingMaintenance, setTogglingMaintenance] = useState(false);
  const [loadingBackups, setLoadingBackups] = useState(false);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (id) {
      fetchTenant();
    }
  }, [id]);

  useEffect(() => {
    if (activeTab === 'backups' && id) {
      fetchBackups();
    }
  }, [activeTab, id]);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    window.setTimeout(() => setToast(null), 3500);
  };

  const fetchTenant = async () => {
    try {
      setLoading(true);
      const response = await saasApi.get(`/saas/tenants/${id}`);
      const data = response.data.data;
      setTenant(data);
      setEditForm({
        name: data.name,
        email: data.email,
        phone: data.phone || '',
        address: data.address || '',
        rnc: data.rnc || '',
        plan: data.plan,
        status: data.status,
        billingEmail: data.billingEmail || '',
      });
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Error cargando tenant');
    } finally {
      setLoading(false);
    }
  };

  const fetchBackups = async () => {
    try {
      setLoadingBackups(true);
      const response = await saasApi.get(`/saas/tenants/${id}/backups`);
      setBackups(response.data.data || []);
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'No fue posible cargar backups', 'error');
    } finally {
      setLoadingBackups(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await saasApi.put(`/saas/tenants/${id}`, editForm);
      setShowEditModal(false);
      await fetchTenant();
      showToast('Tenant actualizado correctamente');
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'Error al actualizar tenant', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleMaintenance = async () => {
    if (!tenant) return;
    try {
      setTogglingMaintenance(true);
      await saasApi.put(`/saas/tenants/${id}`, {
        maintenanceMode: !tenant.settings?.maintenanceMode,
      });
      await fetchTenant();
      showToast(tenant.settings?.maintenanceMode ? 'Mantenimiento desactivado' : 'Mantenimiento activado');
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'Error al cambiar mantenimiento', 'error');
    } finally {
      setTogglingMaintenance(false);
    }
  };

  const handleStatusChange = async (status: Tenant['status']) => {
    try {
      setSaving(true);
      await saasApi.put(`/saas/tenants/${id}`, { status });
      await fetchTenant();
      showToast(status === 'SUSPENDED' ? 'Tenant suspendido' : 'Tenant reactivado');
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'No fue posible actualizar el estado', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateBackup = async () => {
    try {
      setCreatingBackup(true);
      const response = await saasApi.post(`/saas/tenants/${id}/backup`);
      await fetchBackups();
      showToast(response.data.message || 'Backup creado exitosamente');
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'No fue posible crear backup', 'error');
    } finally {
      setCreatingBackup(false);
    }
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      setSaving(true);
      await saasApi.put(`/saas/tenants/${id}/users/${editingUser.id}`, userEditForm);
      setEditingUser(null);
      await fetchTenant();
      showToast('Usuario actualizado correctamente');
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'Error actualizando usuario', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await saasApi.post(`/saas/tenants/${id}/users`, newUserForm);
      setShowCreateUserModal(false);
      setNewUserForm({
        name: '',
        email: '',
        role: 'OPERATOR',
        password: '',
        isActive: true,
      });
      await fetchTenant();
      showToast('Usuario creado correctamente');
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'Error creando usuario', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetPasswordUserId || newPassword.length < 6) return;
    try {
      setSaving(true);
      await saasApi.post(`/saas/tenants/${id}/users/${resetPasswordUserId}/reset-password`, { newPassword });
      setResetPasswordUserId(null);
      setNewPassword('');
      showToast('Contrasena actualizada correctamente');
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'Error reseteando contrasena', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await saasApi.delete(`/saas/tenants/${id}`);
      navigate('/tenants');
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'Error al eliminar tenant', 'error');
    }
  };

  const handleReprovision = async () => {
    try {
      setSaving(true);
      const response = await saasApi.post(`/saas/tenants/${id}/reprovision`, {
        adminPassword: reprovisionPassword || undefined,
      });
      setShowReprovisionModal(false);
      setGeneratedProvisionPassword(response.data?.data?.temporaryPassword || '');
      setReprovisionPassword('');
      await fetchTenant();
      showToast(response.data?.message || 'Provisioning ejecutado');
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'Error reprovisionando tenant', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleRestoreBackup = async () => {
    if (!restoreTarget) return;
    try {
      setSaving(true);
      const response = await saasApi.post(`/saas/tenants/${id}/backups/restore`, {
        filename: restoreTarget.filename,
      });
      setRestoreTarget(null);
      showToast(response.data?.message || 'Backup restaurado');
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'Error restaurando backup', 'error');
    } finally {
      setSaving(false);
    }
  };

  const tenantMeta = useMemo(() => (tenant ? getStatusMeta(tenant) : null), [tenant]);
  const crmUrl = tenant ? `https://${tenant.subdomain}.${CRM_DOMAIN}` : '';
  const latestSubscription = tenant?.subscriptions?.[0] || null;
  const backupSummary = backups[0] || null;

  if (loading) {
    return (
      <div className="flex min-h-[360px] items-center justify-center rounded-[28px] border border-slate-200 bg-white shadow-sm">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-slate-700" />
      </div>
    );
  }

  if (error) {
    return <div className="rounded-[24px] border border-rose-200 bg-rose-50 p-6 text-rose-700">{error}</div>;
  }

  if (!tenant || !tenantMeta) {
    return <div className="rounded-[24px] border border-slate-200 bg-white p-6 text-slate-600">Tenant no encontrado.</div>;
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

      <section className="rounded-[28px] border border-slate-200 bg-white px-6 py-6 shadow-sm">
        <button
          type="button"
          onClick={() => navigate('/tenants')}
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-950"
        >
          <HiArrowLeft className="h-4 w-4" />
          Volver a tenants
        </button>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                <HiOfficeBuilding className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-950">{tenant.name}</h1>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                  <span>{tenant.subdomain}.neypier.com</span>
                  <span>•</span>
                  <span>{tenant.tenantUsers?.length || 0} usuarios</span>
                  <span>•</span>
                  <span>{getPlanLabel(tenant.plan)}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${tenantMeta.className}`}>
                {tenantMeta.label}
              </span>
              <a
                href={crmUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 transition hover:text-slate-950"
              >
                Abrir CRM
                <HiExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleToggleMaintenance}
              disabled={togglingMaintenance}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              {togglingMaintenance ? 'Procesando...' : tenant.settings?.maintenanceMode ? 'Desactivar mantenimiento' : 'Activar mantenimiento'}
            </button>
            <button
              type="button"
              onClick={() => handleStatusChange(tenant.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED')}
              disabled={saving}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              {tenant.status === 'SUSPENDED' ? 'Reactivar tenant' : 'Suspender tenant'}
            </button>
            <button
              type="button"
              onClick={() => setShowEditModal(true)}
              className="rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Editar tenant
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {[
          { label: 'Facturas', value: tenant._count?.invoices ?? tenant.invoices.length, note: 'Historial SaaS' },
          { label: 'Suscripciones', value: tenant._count?.subscriptions ?? tenant.subscriptions.length, note: latestSubscription ? latestSubscription.status : 'Sin registro' },
          { label: 'Actividad', value: tenant._count?.activities ?? tenant.activities.length, note: formatDate(tenant.lastActiveAt) },
          { label: 'Backups', value: backups.length, note: backupSummary ? formatDate(backupSummary.createdAt) : 'Sin backup listado' },
        ].map((item) => (
          <div key={item.label} className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{item.label}</p>
            <p className="mt-3 text-3xl font-bold text-slate-950">{item.value}</p>
            <p className="mt-1 text-sm text-slate-500">{item.note}</p>
          </div>
        ))}
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
        <nav className="flex overflow-x-auto border-b border-slate-200 px-6">
          {[
            { id: 'overview' as TabId, label: 'Resumen' },
            { id: 'subscription' as TabId, label: 'Suscripcion' },
            { id: 'users' as TabId, label: `Usuarios (${tenant.tenantUsers?.length || 0})` },
            { id: 'backups' as TabId, label: 'Backups' },
            { id: 'audit' as TabId, label: 'Auditoria' },
            { id: 'technical' as TabId, label: 'Avanzado' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`mr-8 border-b-2 py-4 text-sm font-medium transition ${
                activeTab === tab.id
                  ? 'border-slate-950 text-slate-950'
                  : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <div className="rounded-[24px] border border-slate-200 bg-white p-6">
                <h3 className="mb-4 text-base font-semibold text-slate-950">Perfil del tenant</h3>
                <dl className="space-y-3">
                  {[
                    ['Email', tenant.email],
                    ['Telefono', tenant.phone || '—'],
                    ['Direccion', tenant.address || '—'],
                    ['RNC', tenant.rnc || '—'],
                    ['Email facturacion', tenant.billingEmail || '—'],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between gap-4">
                      <dt className="text-sm text-slate-500">{label}</dt>
                      <dd className="text-right text-sm font-medium text-slate-900">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div className="rounded-[24px] border border-slate-200 bg-white p-6">
                <h3 className="mb-4 text-base font-semibold text-slate-950">Operacion</h3>
                <dl className="space-y-3">
                  {[
                    ['Estado', tenantMeta.label],
                    ['Plan', getPlanLabel(tenant.plan)],
                    ['Creado', formatDate(tenant.createdAt)],
                    ['Ultima actividad', formatDate(tenant.lastActiveAt)],
                    ['Subdominio', tenant.subdomain],
                    ['Dominio personalizado', tenant.customDomain || 'No configurado'],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between gap-4">
                      <dt className="text-sm text-slate-500">{label}</dt>
                      <dd className="text-right text-sm font-medium text-slate-900">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-6 lg:col-span-2">
                <h3 className="mb-4 text-base font-semibold text-slate-950">Limites del plan</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {[
                    { label: 'Usuarios max.', value: tenant.limits?.maxUsers ?? '—' },
                    { label: 'Sucursales max.', value: tenant.limits?.maxBranches ?? '—' },
                    { label: 'Almacenamiento', value: tenant.limits?.maxStorage ?? '—' },
                  ].map((item) => (
                    <div key={item.label} className="rounded-[22px] border border-slate-200 bg-white p-4 text-center">
                      <p className="text-2xl font-bold text-slate-950">{item.value}</p>
                      <p className="mt-1 text-xs text-slate-500">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'subscription' && (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="rounded-[24px] border border-slate-200 bg-white p-6">
                <h3 className="mb-4 text-base font-semibold text-slate-950">Suscripcion y cobros</h3>
                {latestSubscription ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {[
                        ['Plan', getPlanLabel(latestSubscription.plan)],
                        ['Estado', latestSubscription.status],
                        ['Ciclo', latestSubscription.billingCycle],
                        ['Inicio', formatDate(latestSubscription.startDate)],
                        ['Fin', formatDate(latestSubscription.endDate)],
                        ['Trial', formatDate(tenant.trialEndsAt)],
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
                          <p className="mt-2 text-sm font-semibold text-slate-950">{value}</p>
                        </div>
                      ))}
                    </div>

                    <div className="overflow-hidden rounded-[24px] border border-slate-200">
                      <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
                        Facturas recientes
                      </div>
                      {!tenant.invoices.length ? (
                        <div className="px-4 py-10 text-sm text-slate-500">No hay facturas registradas para este tenant.</div>
                      ) : (
                        <div className="divide-y divide-slate-200">
                          {tenant.invoices.slice(0, 6).map((invoice) => (
                            <div key={invoice.id} className="flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <p className="text-sm font-medium text-slate-950">{invoice.description || 'Factura SaaS'}</p>
                                <p className="text-xs text-slate-500">
                                  {formatDate(invoice.periodStart)} - {formatDate(invoice.periodEnd)}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-semibold text-slate-950">{formatCurrency(invoice.amount, invoice.currency)}</p>
                                <span className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs font-medium ${getInvoiceStatusClass(invoice.status)}`}>
                                  {invoice.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
                    Todavia no hay suscripcion formal registrada para este tenant. El panel ya permite ver plan, trial e historial de facturas cuando existan.
                  </div>
                )}
              </div>

              <div className="rounded-[24px] border border-slate-200 bg-white p-6">
                <h3 className="text-base font-semibold text-slate-950">Lectura rapida</h3>
                <div className="mt-4 space-y-3 text-sm text-slate-600">
                  <div className="flex items-center justify-between">
                    <span>Facturas emitidas</span>
                    <span className="font-semibold text-slate-950">{tenant.invoices.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Facturas pagadas</span>
                    <span className="font-semibold text-slate-950">
                      {tenant.invoices.filter((invoice) => invoice.status === 'PAID').length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Facturas vencidas</span>
                    <span className="font-semibold text-slate-950">
                      {tenant.invoices.filter((invoice) => invoice.status === 'OVERDUE').length}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowReprovisionModal(true)}
                  className="mt-5 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Reprovisionar tenant
                </button>
                {generatedProvisionPassword ? (
                  <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    Password temporal generado: <span className="font-mono font-semibold">{generatedProvisionPassword}</span>
                  </div>
                ) : null}
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white">
              <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
                <h3 className="font-semibold text-slate-950">Usuarios del CRM</h3>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-500">{tenant.tenantUsers?.length || 0} registrados</span>
                  <button
                    type="button"
                    onClick={() => setShowCreateUserModal(true)}
                    className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-medium text-white transition hover:bg-slate-800"
                  >
                    Crear usuario
                  </button>
                </div>
              </div>

              {!tenant.tenantUsers?.length ? (
                <div className="px-6 py-14 text-center text-slate-500">No hay usuarios registrados en este tenant.</div>
              ) : (
                <table className="min-w-full">
                  <thead className="bg-white">
                    <tr className="border-b border-slate-200">
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Usuario</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Rol</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Estado</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Ultimo acceso</th>
                      <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {tenant.tenantUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-slate-950">{user.name}</p>
                              <p className="text-sm text-slate-500">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                            {ROLE_LABELS[user.role] || user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`rounded-full px-3 py-1 text-xs font-medium ${user.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                            {user.isActive ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">{formatDate(user.lastLogin)}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingUser(user);
                                setUserEditForm({ name: user.name, email: user.email, role: user.role, isActive: user.isActive });
                              }}
                              className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setResetPasswordUserId(user.id);
                                setNewPassword('');
                              }}
                              className="rounded-xl bg-slate-950 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-800"
                            >
                              Reset clave
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab === 'backups' && (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white">
                <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
                  <div>
                    <h3 className="font-semibold text-slate-950">Backups disponibles</h3>
                    <p className="text-sm text-slate-500">Respaldo operativo de la base de este tenant.</p>
                  </div>
                  <button
                    type="button"
                    onClick={fetchBackups}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    <HiRefresh className="h-4 w-4" />
                    Actualizar
                  </button>
                </div>

                {loadingBackups ? (
                  <div className="px-6 py-16 text-center text-slate-500">Cargando backups...</div>
                ) : backups.length === 0 ? (
                  <div className="px-6 py-16 text-center text-slate-500">No hay backups listados todavia para este tenant.</div>
                ) : (
                  <div className="divide-y divide-slate-200">
                    {backups.map((backup) => (
                      <div key={backup.filename} className="flex flex-col gap-2 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-950">{backup.filename}</p>
                          <p className="text-xs text-slate-500">{formatDateTime(backup.createdAt)}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-slate-700">{formatBytes(backup.size)}</span>
                          <button
                            type="button"
                            onClick={() => setRestoreTarget(backup)}
                            className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                          >
                            Restaurar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-[24px] border border-slate-200 bg-white p-6">
                <h3 className="text-base font-semibold text-slate-950">Operacion de backup</h3>
                <p className="mt-2 text-sm text-slate-500">Crea un respaldo manual antes de cambios delicados o eliminaciones.</p>
                <button
                  type="button"
                  onClick={handleCreateBackup}
                  disabled={creatingBackup}
                  className="mt-5 w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"
                >
                  {creatingBackup ? 'Creando backup...' : 'Crear backup ahora'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white">
              <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
                <h3 className="font-semibold text-slate-950">Actividad reciente</h3>
                <p className="text-sm text-slate-500">Timeline administrativo y de facturacion del tenant.</p>
              </div>
              {!tenant.activities.length ? (
                <div className="px-6 py-16 text-center text-slate-500">Todavia no hay actividad registrada para este tenant.</div>
              ) : (
                <div className="divide-y divide-slate-200">
                  {tenant.activities.map((activity) => (
                    <div key={activity.id} className="px-6 py-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-950">{getActivityLabel(activity.action)}</p>
                          <p className="mt-1 text-sm text-slate-600">{activity.description}</p>
                        </div>
                        <p className="text-xs text-slate-500">{formatDateTime(activity.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'technical' && (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
              <div className="rounded-[24px] border border-slate-200 bg-white p-6">
                <div className="flex items-center gap-2">
                  <HiShieldCheck className="h-5 w-5 text-slate-500" />
                  <h3 className="text-base font-semibold text-slate-950">Informacion tecnica</h3>
                </div>
                <dl className="mt-5 space-y-4">
                  <div>
                    <dt className="mb-1 text-sm text-slate-500">Base de datos</dt>
                    <dd>
                      <code className="block rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-800">{tenant.databaseName}</code>
                    </dd>
                  </div>
                  <div>
                    <dt className="mb-1 text-sm text-slate-500">Conexion</dt>
                    <dd>
                      <code className="block break-all rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-800">
                        {maskConnectionString(tenant.databaseUrl)}
                      </code>
                    </dd>
                  </div>
                  <div>
                    <dt className="mb-1 text-sm text-slate-500">Tema / moneda / idioma</dt>
                    <dd className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                      {tenant.settings?.theme || 'light'} • {tenant.settings?.currency || 'DOP'} • {tenant.settings?.language || 'es'}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="rounded-[24px] border border-rose-200 bg-rose-50 p-6">
                <div className="flex items-center gap-2 text-rose-700">
                  <HiExclamationCircle className="h-5 w-5" />
                  <h3 className="text-base font-semibold">Zona sensible</h3>
                </div>
                <p className="mt-3 text-sm text-rose-700/90">
                  Eliminar un tenant borra la empresa de la base maestra y puede desencadenar operaciones destructivas. Usa esta accion solo cuando ya exista respaldo y validacion previa.
                </p>
                <ul className="mt-4 space-y-2 text-sm text-rose-700/90">
                  <li>• Confirma backups antes de borrar</li>
                  <li>• Prefiere suspender antes que eliminar</li>
                  <li>• Esta accion no debe ser la ruta habitual</li>
                </ul>
                <button
                  type="button"
                  onClick={() => setShowReprovisionModal(true)}
                  className="mt-5 w-full rounded-2xl border border-rose-200 bg-white px-4 py-3 text-sm font-medium text-rose-700 transition hover:bg-rose-100"
                >
                  Reprovisionar infraestructura
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(true)}
                  className="mt-5 w-full rounded-2xl bg-rose-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-rose-700"
                >
                  Abrir zona de eliminacion
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.2)]">
            <div className="border-b border-slate-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-950">Editar tenant</h2>
            </div>
            <form onSubmit={handleUpdate} className="space-y-4 px-6 py-6">
              {[
                { label: 'Nombre empresa', key: 'name', type: 'text', required: true },
                { label: 'Email', key: 'email', type: 'email', required: true },
                { label: 'Email facturacion', key: 'billingEmail', type: 'email' },
                { label: 'Telefono', key: 'phone', type: 'text' },
                { label: 'Direccion', key: 'address', type: 'text' },
                { label: 'RNC', key: 'rnc', type: 'text' },
              ].map(({ label, key, type, required }) => (
                <div key={key}>
                  <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
                  <input
                    type={type}
                    required={required}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                    value={editForm[key] || ''}
                    onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value })}
                  />
                </div>
              ))}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Plan</label>
                  <select
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                    value={editForm.plan || 'BASIC'}
                    onChange={(e) => setEditForm({ ...editForm, plan: e.target.value })}
                  >
                    <option value="BASIC">Basico</option>
                    <option value="STARTER">Starter</option>
                    <option value="PROFESSIONAL">Profesional</option>
                    <option value="ENTERPRISE">Enterprise</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Estado</label>
                  <select
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                    value={editForm.status || 'ACTIVE'}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  >
                    <option value="ACTIVE">Activo</option>
                    <option value="SUSPENDED">Suspendido</option>
                    <option value="PENDING">Pendiente</option>
                    <option value="CANCELLED">Cancelado</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"
                >
                  {saving ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.2)]">
            <div className="border-b border-slate-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-950">Editar usuario</h2>
            </div>
            <form onSubmit={handleSaveUser} className="space-y-4 px-6 py-6">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Nombre</label>
                <input
                  type="text"
                  required
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  value={userEditForm.name || ''}
                  onChange={(e) => setUserEditForm({ ...userEditForm, name: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
                <input
                  type="email"
                  required
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  value={userEditForm.email || ''}
                  onChange={(e) => setUserEditForm({ ...userEditForm, email: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Rol</label>
                <select
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  value={userEditForm.role || 'OPERATOR'}
                  onChange={(e) => setUserEditForm({ ...userEditForm, role: e.target.value })}
                >
                  <option value="ADMINISTRATOR">Administrador</option>
                  <option value="SUPERVISOR">Supervisor</option>
                  <option value="OPERATOR">Operador</option>
                  <option value="CASHIER">Cajero</option>
                </select>
              </div>
              <label className="flex items-center gap-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={userEditForm.isActive ?? true}
                  onChange={(e) => setUserEditForm({ ...userEditForm, isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-slate-900"
                />
                Usuario activo
              </label>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"
                >
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCreateUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.2)]">
            <div className="border-b border-slate-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-950">Crear usuario del tenant</h2>
            </div>
            <form onSubmit={handleCreateUser} className="space-y-4 px-6 py-6">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Nombre</label>
                <input
                  type="text"
                  required
                  value={newUserForm.name}
                  onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
                <input
                  type="email"
                  required
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Rol</label>
                <select
                  value={newUserForm.role}
                  onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                >
                  <option value="ADMINISTRATOR">Administrador</option>
                  <option value="SUPERVISOR">Supervisor</option>
                  <option value="OPERATOR">Operador</option>
                  <option value="CASHIER">Cajero</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Contrasena temporal</label>
                <input
                  type="text"
                  required
                  value={newUserForm.password}
                  onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-mono text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                />
              </div>
              <label className="flex items-center gap-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={newUserForm.isActive}
                  onChange={(e) => setNewUserForm({ ...newUserForm, isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-slate-900"
                />
                Usuario activo
              </label>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateUserModal(false)}
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"
                >
                  {saving ? 'Creando...' : 'Crear usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {resetPasswordUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-sm rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.2)]">
            <div className="border-b border-slate-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-950">Resetear contrasena</h2>
            </div>
            <div className="space-y-4 px-6 py-6">
              <p className="text-sm text-slate-500">Ingresa una nueva contrasena para el usuario seleccionado.</p>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Nueva contrasena</label>
                <input
                  type="text"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-mono text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  placeholder="Minimo 6 caracteres"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setResetPasswordUserId(null);
                    setNewPassword('');
                  }}
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleResetPassword}
                  disabled={saving || newPassword.length < 6}
                  className="flex-1 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"
                >
                  {saving ? 'Guardando...' : 'Actualizar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showReprovisionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.2)]">
            <div className="border-b border-slate-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-950">Reprovisionar tenant</h2>
            </div>
            <div className="space-y-4 px-6 py-6">
              <p className="text-sm text-slate-500">
                Reintenta migraciones, datos iniciales y activacion. Si no indicas contrasena, el sistema generara una temporal.
              </p>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Contrasena admin opcional</label>
                <input
                  type="text"
                  value={reprovisionPassword}
                  onChange={(e) => setReprovisionPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-mono text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  placeholder="Dejar vacio para temporal"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowReprovisionModal(false)}
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleReprovision}
                  disabled={saving}
                  className="flex-1 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"
                >
                  {saving ? 'Ejecutando...' : 'Reprovisionar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {restoreTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-md rounded-[28px] border border-amber-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.2)]">
            <h2 className="text-lg font-semibold text-slate-950">Restaurar backup</h2>
            <p className="mt-3 text-sm text-slate-600">
              Esta accion sobrescribe la base actual del tenant con el respaldo seleccionado.
            </p>
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <p className="font-medium text-slate-950">{restoreTarget.filename}</p>
              <p className="mt-1">{formatDateTime(restoreTarget.createdAt)} • {formatBytes(restoreTarget.size)}</p>
            </div>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setRestoreTarget(null)}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleRestoreBackup}
                disabled={saving}
                className="flex-1 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-amber-700 disabled:opacity-50"
              >
                {saving ? 'Restaurando...' : 'Confirmar restore'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-md rounded-[28px] border border-rose-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.2)]">
            <h2 className="text-xl font-bold text-rose-700">Eliminar tenant</h2>
            <p className="mt-3 text-sm text-slate-600">
              Esta accion es destructiva. Antes de continuar, confirma respaldo y valida que no sea suficiente con suspender el tenant.
            </p>
            <ul className="mt-4 space-y-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700">
              <li>• El tenant se elimina de la base maestra</li>
              <li>• Los usuarios pierden acceso inmediatamente</li>
              <li>• Puede desencadenar borrado de la base del tenant</li>
            </ul>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="flex-1 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-rose-700"
              >
                Eliminar definitivamente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SaaSTenantDetail;
