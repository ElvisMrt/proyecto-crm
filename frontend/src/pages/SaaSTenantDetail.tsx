import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.host}/api/v1`
    : 'http://localhost:3001/api/v1');

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
  settings: any;
  limits: any;
  createdAt: string;
  updatedAt: string;
  lastActiveAt: string | null;
  tenantUsers: TenantUser[];
}

const ROLE_LABELS: Record<string, string> = {
  ADMINISTRATOR: 'Administrador',
  MANAGER: 'Gerente',
  OPERATOR: 'Operador',
  CASHIER: 'Cajero',
};

const SaaSTenantDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'database'>('overview');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [editingUser, setEditingUser] = useState<TenantUser | null>(null);
  const [userEditForm, setUserEditForm] = useState<any>({});
  const [resetPasswordUserId, setResetPasswordUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const getToken = () => localStorage.getItem('saasToken');

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => { fetchTenant(); }, [id]);

  const fetchTenant = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/saas/tenants/${id}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
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
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Error cargando tenant');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.put(`${API_BASE_URL}/saas/tenants/${id}`, editForm, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      setShowEditModal(false);
      fetchTenant();
      showToast('Información actualizada correctamente');
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'Error al actualizar', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API_BASE_URL}/saas/tenants/${id}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      navigate('/tenants');
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'Error al eliminar', 'error');
    }
  };

  const handleEditUser = (user: TenantUser) => {
    setEditingUser(user);
    setUserEditForm({ name: user.name, email: user.email, role: user.role, isActive: user.isActive });
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setSaving(true);
    try {
      await axios.put(`${API_BASE_URL}/saas/tenants/${id}/users/${editingUser.id}`, userEditForm, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      setEditingUser(null);
      fetchTenant();
      showToast('Usuario actualizado correctamente');
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'Error al actualizar usuario', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetPasswordUserId || !newPassword) return;
    if (newPassword.length < 6) { showToast('La contraseña debe tener al menos 6 caracteres', 'error'); return; }
    setSaving(true);
    try {
      await axios.post(
        `${API_BASE_URL}/saas/tenants/${id}/users/${resetPasswordUserId}/reset-password`,
        { newPassword },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      setResetPasswordUserId(null);
      setNewPassword('');
      showToast('Contraseña actualizada correctamente');
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'Error al resetear contraseña', 'error');
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'SUSPENDED': return 'bg-orange-100 text-orange-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = { ACTIVE: 'Activo', PENDING: 'Pendiente', SUSPENDED: 'Suspendido', CANCELLED: 'Cancelado' };
    return labels[status] || status;
  };

  const getPlanLabel = (plan: string) => {
    const labels: Record<string, string> = { BASIC: 'Básico', STARTER: 'Inicial', PROFESSIONAL: 'Profesional', ENTERPRISE: 'Empresarial' };
    return labels[plan] || plan;
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
    </div>
  );
  if (error) return <div className="p-8 text-red-600 bg-red-50 rounded-lg m-6">{error}</div>;
  if (!tenant) return <div className="p-8">Tenant no encontrado</div>;

  const crmUrl = `http://${tenant.subdomain}.${CRM_DOMAIN}`;

  return (
    <div className="p-6 max-w-6xl mx-auto">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-lg shadow-lg text-white text-sm font-medium transition-all
          ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <button onClick={() => navigate('/tenants')} className="text-sm text-gray-500 hover:text-gray-700 mb-2 flex items-center gap-1">
            ← Volver a tenants
          </button>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
              {tenant.name.charAt(0).toUpperCase()}
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{tenant.name}</h1>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(tenant.status)}`}>
              {getStatusLabel(tenant.status)}
            </span>
          </div>
          <div className="flex items-center gap-3 ml-13 mt-1">
            <a href={crmUrl} target="_blank" rel="noopener noreferrer"
              className="text-blue-600 hover:underline text-sm font-medium flex items-center gap-1">
              🔗 {crmUrl}
            </a>
            <span className="text-gray-400">•</span>
            <span className="text-gray-500 text-sm">{tenant.tenantUsers?.length || 0} usuarios</span>
            <span className="text-gray-400">•</span>
            <span className="text-sm font-medium text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
              {getPlanLabel(tenant.plan)}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowEditModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
            ✏️ Editar
          </button>
          <button onClick={() => setShowDeleteModal(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium">
            🗑️ Eliminar
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-6">
          {[
            { id: 'overview', label: '📋 Información General' },
            { id: 'users', label: `👥 Usuarios (${tenant.tenantUsers?.length || 0})` },
            { id: 'database', label: '🗄️ Base de Datos' },
          ].map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
              className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* ─── TAB: GENERAL ─── */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Info empresa */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Información de la Empresa</h3>
            <dl className="space-y-3">
              {[
                { label: 'Email', value: tenant.email },
                { label: 'Teléfono', value: tenant.phone || '—' },
                { label: 'Dirección', value: tenant.address || '—' },
                { label: 'RNC', value: tenant.rnc || '—' },
                { label: 'Email facturación', value: tenant.billingEmail || '—' },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-start">
                  <dt className="text-sm text-gray-500 w-36 flex-shrink-0">{label}</dt>
                  <dd className="text-sm text-gray-900 text-right">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Acceso y plan */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Acceso y Plan</h3>
            <dl className="space-y-3">
              {[
                { label: 'Subdominio', value: tenant.subdomain },
                { label: 'URL CRM', value: crmUrl, link: true },
                { label: 'Plan', value: getPlanLabel(tenant.plan) },
                { label: 'Estado', value: getStatusLabel(tenant.status) },
                { label: 'Creado', value: new Date(tenant.createdAt).toLocaleDateString('es-DO') },
                { label: 'Última actividad', value: tenant.lastActiveAt ? new Date(tenant.lastActiveAt).toLocaleDateString('es-DO') : 'Sin actividad' },
              ].map(({ label, value, link }) => (
                <div key={label} className="flex justify-between items-start">
                  <dt className="text-sm text-gray-500 w-36 flex-shrink-0">{label}</dt>
                  <dd className="text-sm text-gray-900 text-right">
                    {link ? <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{value}</a> : value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Límites y configuración */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 col-span-full">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Límites del Plan</h3>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Usuarios máx.', value: tenant.limits?.maxUsers ?? '—' },
                { label: 'Sucursales máx.', value: tenant.limits?.maxBranches ?? '—' },
                { label: 'Almacenamiento', value: tenant.limits?.maxStorage ?? '—' },
              ].map(({ label, value }) => (
                <div key={label} className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-gray-900">{value}</p>
                  <p className="text-xs text-gray-500 mt-1">{label}</p>
                </div>
              ))}
            </div>
            {tenant.settings && (
              <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-3 text-sm">
                {[
                  { label: 'Moneda', value: tenant.settings.currency || 'DOP' },
                  { label: 'Idioma', value: tenant.settings.language || 'es' },
                  { label: 'Zona horaria', value: tenant.settings.timezone || 'America/Santo_Domingo' },
                  { label: 'Tema', value: tenant.settings.theme || 'light' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-gray-500">{label}:</span>
                    <span className="font-medium">{value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB: USUARIOS ─── */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
            <h3 className="font-semibold text-gray-900">Usuarios del CRM</h3>
            <span className="text-sm text-gray-500">{tenant.tenantUsers?.length || 0} usuarios registrados</span>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Último acceso</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {tenant.tenantUsers?.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-semibold text-sm">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-900">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                      {ROLE_LABELS[user.role] || user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {user.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('es-DO') : 'Nunca'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button onClick={() => handleEditUser(user)}
                        className="px-3 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                        Editar
                      </button>
                      <button onClick={() => { setResetPasswordUserId(user.id); setNewPassword(''); }}
                        className="px-3 py-1 text-xs bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium">
                        Reset Clave
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!tenant.tenantUsers?.length && (
            <div className="text-center py-12 text-gray-500">
              <p className="text-4xl mb-3">👥</p>
              <p>No hay usuarios registrados en este tenant</p>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB: BASE DE DATOS ─── */}
      {activeTab === 'database' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Información de Base de Datos</h3>
          <dl className="space-y-4">
            <div>
              <dt className="text-sm text-gray-500 mb-1">Nombre de la base de datos</dt>
              <dd><code className="bg-gray-100 px-3 py-2 rounded-lg text-sm block">{tenant.databaseName}</code></dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500 mb-1">URL de conexión (contraseña oculta)</dt>
              <dd><code className="bg-gray-100 px-3 py-2 rounded-lg text-sm block break-all">
                {tenant.databaseUrl?.replace(/:[^:@]*@/, ':****@')}
              </code></dd>
            </div>
            <div className="pt-4 border-t border-gray-100">
              <dt className="text-sm text-gray-500 mb-1">URL del CRM</dt>
              <dd>
                <a href={crmUrl} target="_blank" rel="noopener noreferrer"
                  className="text-blue-600 hover:underline font-medium">{crmUrl}</a>
              </dd>
            </div>
          </dl>
        </div>
      )}

      {/* ─── MODAL: Editar Tenant ─── */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-lg font-bold">Editar Tenant</h2>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              {[
                { label: 'Nombre de la empresa', key: 'name', type: 'text', required: true },
                { label: 'Email', key: 'email', type: 'email', required: true },
                { label: 'Email de facturación', key: 'billingEmail', type: 'email' },
                { label: 'Teléfono', key: 'phone', type: 'text' },
                { label: 'Dirección', key: 'address', type: 'text' },
                { label: 'RNC', key: 'rnc', type: 'text' },
              ].map(({ label, key, type, required }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <input type={type} required={required}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    value={editForm[key] || ''}
                    onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value })}
                  />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  value={editForm.plan || 'BASIC'}
                  onChange={(e) => setEditForm({ ...editForm, plan: e.target.value })}>
                  <option value="BASIC">Básico</option>
                  <option value="STARTER">Inicial</option>
                  <option value="PROFESSIONAL">Profesional</option>
                  <option value="ENTERPRISE">Empresarial</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  value={editForm.status || 'ACTIVE'}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
                  <option value="ACTIVE">Activo</option>
                  <option value="SUSPENDED">Suspendido</option>
                  <option value="PENDING">Pendiente</option>
                  <option value="CANCELLED">Cancelado</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">Cancelar</button>
                <button type="submit" disabled={saving}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50">
                  {saving ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: Editar Usuario ─── */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-lg font-bold">Editar Usuario</h2>
              <button onClick={() => setEditingUser(null)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <form onSubmit={handleSaveUser} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input type="text" required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  value={userEditForm.name || ''}
                  onChange={(e) => setUserEditForm({ ...userEditForm, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  value={userEditForm.email || ''}
                  onChange={(e) => setUserEditForm({ ...userEditForm, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  value={userEditForm.role || 'OPERATOR'}
                  onChange={(e) => setUserEditForm({ ...userEditForm, role: e.target.value })}>
                  <option value="ADMINISTRATOR">Administrador</option>
                  <option value="MANAGER">Gerente</option>
                  <option value="OPERATOR">Operador</option>
                  <option value="CASHIER">Cajero</option>
                </select>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="isActive" checked={userEditForm.isActive ?? true}
                  onChange={(e) => setUserEditForm({ ...userEditForm, isActive: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Usuario activo</label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditingUser(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">Cancelar</button>
                <button type="submit" disabled={saving}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50">
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: Reset Contraseña ─── */}
      {resetPasswordUserId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-sm">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-lg font-bold">Resetear Contraseña</h2>
              <button onClick={() => { setResetPasswordUserId(null); setNewPassword(''); }}
                className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">
                Ingresa la nueva contraseña para el usuario. El cambio será inmediato.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nueva contraseña</label>
                <input type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                  placeholder="Mínimo 6 caracteres"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setResetPasswordUserId(null); setNewPassword(''); }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">Cancelar</button>
                <button onClick={handleResetPassword} disabled={saving || newPassword.length < 6}
                  className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm font-medium disabled:opacity-50">
                  {saving ? 'Guardando...' : 'Actualizar contraseña'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: Eliminar Tenant ─── */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4 text-red-600">🗑️ Eliminar Tenant</h2>
            <p className="text-gray-600 mb-4">
              ¿Estás seguro de que deseas eliminar <strong>{tenant.name}</strong>?
            </p>
            <ul className="text-sm text-gray-600 mb-6 space-y-1 bg-red-50 p-4 rounded-lg">
              <li>• Se eliminará el tenant de la base de datos maestra</li>
              <li>• Todos los usuarios perderán acceso inmediatamente</li>
              <li>• La base de datos del tenant se conserva para recuperación</li>
              <li className="font-semibold text-red-700">• Esta acción no se puede deshacer</li>
            </ul>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancelar</button>
              <button onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium">
                Eliminar Definitivamente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SaaSTenantDetail;
