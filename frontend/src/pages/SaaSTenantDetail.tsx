import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

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
  plan: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
  databaseName: string;
  databaseUrl: string;
  billingEmail: string;
  settings: any;
  limits: any;
  createdAt: string;
  updatedAt: string;
  lastActiveAt: string | null;
  users: Array<{
    id: string;
    email: string;
    name: string;
    role: string;
    isActive: boolean;
    createdAt: string;
  }>;
  invoices: Array<{
    id: string;
    amount: number;
    currency: string;
    status: string;
    periodStart: string;
    periodEnd: string;
    paidAt: string | null;
  }>;
  activities: Array<{
    id: string;
    action: string;
    description: string;
    createdAt: string;
    metadata: any;
  }>;
}

const SaaSTenantDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'invoices' | 'activity'>('overview');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editForm, setEditForm] = useState<any>({});

  const getToken = () => localStorage.getItem('saasToken');

  useEffect(() => {
    fetchTenant();
  }, [id]);

  const fetchTenant = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/saas/tenants/${id}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      setTenant(response.data.data);
      setEditForm(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Error cargando tenant');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.put(`${API_BASE_URL}/saas/tenants/${id}`, editForm, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      setShowEditModal(false);
      fetchTenant();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Error actualizando');
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API_BASE_URL}/saas/tenants/${id}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      navigate('/tenants');
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Error eliminando');
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

  const getPlanLabel = (plan: string) => {
    switch (plan) {
      case 'STARTER': return 'Inicial';
      case 'PROFESSIONAL': return 'Profesional';
      case 'ENTERPRISE': return 'Empresarial';
      default: return plan;
    }
  };

  if (loading) return <div className="p-8">Cargando...</div>;
  if (!tenant) return <div className="p-8">Tenant no encontrado</div>;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold">{tenant.name}</h1>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(tenant.status)}`}>
              {tenant.status}
            </span>
          </div>
          <p className="text-gray-500">{tenant.slug} • {tenant.subdomain}.tudominio.com</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowEditModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Editar
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Eliminar
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-8">
          {[
            { id: 'overview', label: 'General' },
            { id: 'users', label: `Usuarios (${tenant.users?.length || 0})` },
            { id: 'invoices', label: `Facturas (${tenant.invoices?.length || 0})` },
            { id: 'activity', label: 'Actividad' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-2 gap-6">
          {/* Información General */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Información General</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">Email:</span>
                <span>{tenant.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Teléfono:</span>
                <span>{tenant.phone || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Dirección:</span>
                <span>{tenant.address || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">RNC:</span>
                <span>{tenant.rnc || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Plan:</span>
                <span className="font-medium">{getPlanLabel(tenant.plan)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Creado:</span>
                <span>{new Date(tenant.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Última actividad:</span>
                <span>{tenant.lastActiveAt ? new Date(tenant.lastActiveAt).toLocaleDateString() : 'Nunca'}</span>
              </div>
            </div>
          </div>

          {/* Configuración */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Configuración</h3>
            {tenant.settings && (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">Tema:</span>
                  <span>{tenant.settings.theme || 'light'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Moneda:</span>
                  <span>{tenant.settings.currency || 'DOP'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Idioma:</span>
                  <span>{tenant.settings.language || 'es'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Zona horaria:</span>
                  <span>{tenant.settings.timezone || 'America/Santo_Domingo'}</span>
                </div>
              </div>
            )}
            <hr className="my-4" />
            {tenant.limits && (
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-gray-700">Límites</h4>
                <div className="flex justify-between">
                  <span className="text-gray-500">Máx. usuarios:</span>
                  <span>{tenant.limits.maxUsers || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Almacenamiento:</span>
                  <span>{tenant.limits.maxStorage || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Máx. sucursales:</span>
                  <span>{tenant.limits.maxBranches || 'N/A'}</span>
                </div>
              </div>
            )}
          </div>

          {/* Base de Datos */}
          <div className="bg-white rounded-lg shadow p-6 col-span-2">
            <h3 className="text-lg font-semibold mb-4">Base de Datos</h3>
            <div className="space-y-3">
              <div>
                <span className="text-gray-500">Nombre:</span>
                <code className="ml-2 bg-gray-100 px-2 py-1 rounded text-sm">{tenant.databaseName}</code>
              </div>
              <div>
                <span className="text-gray-500">URL:</span>
                <code className="ml-2 bg-gray-100 px-2 py-1 rounded text-sm block mt-1 overflow-x-auto">
                  {tenant.databaseUrl?.replace(/:[^:]*@/, ':****@')}
                </code>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rol</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Creado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {tenant.users?.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 font-medium">{user.name}</td>
                  <td className="px-6 py-4 text-sm">{user.email}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {user.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!tenant.users?.length && (
            <div className="text-center py-8 text-gray-500">No hay usuarios</div>
          )}
        </div>
      )}

      {activeTab === 'invoices' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Periodo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pagado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {tenant.invoices?.map((invoice) => (
                <tr key={invoice.id}>
                  <td className="px-6 py-4">
                    {new Date(invoice.periodStart).toLocaleDateString()} - {new Date(invoice.periodEnd).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 font-medium">
                    ${invoice.amount.toFixed(2)} {invoice.currency}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs ${
                      invoice.status === 'PAID' ? 'bg-green-100 text-green-800' :
                      invoice.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {invoice.paidAt ? new Date(invoice.paidAt).toLocaleDateString() : 'Pendiente'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!tenant.invoices?.length && (
            <div className="text-center py-8 text-gray-500">No hay facturas</div>
          )}
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="divide-y divide-gray-200">
            {tenant.activities?.map((activity) => (
              <div key={activity.id} className="px-6 py-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{activity.action}</p>
                    <p className="text-sm text-gray-500">{activity.description}</p>
                    {activity.metadata && (
                      <pre className="mt-2 text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                        {JSON.stringify(activity.metadata, null, 2)}
                      </pre>
                    )}
                  </div>
                  <span className="text-sm text-gray-400">
                    {new Date(activity.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
          {!tenant.activities?.length && (
            <div className="text-center py-8 text-gray-500">No hay actividad</div>
          )}
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Editar Tenant</h2>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg"
                  value={editForm.name || ''}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border rounded-lg"
                  value={editForm.email || ''}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg"
                  value={editForm.phone || ''}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg"
                  value={editForm.address || ''}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">RNC</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg"
                  value={editForm.rnc || ''}
                  onChange={(e) => setEditForm({ ...editForm, rnc: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
                <select
                  className="w-full px-3 py-2 border rounded-lg"
                  value={editForm.plan || 'STARTER'}
                  onChange={(e) => setEditForm({ ...editForm, plan: e.target.value })}
                >
                  <option value="STARTER">Inicial</option>
                  <option value="PROFESSIONAL">Profesional</option>
                  <option value="ENTERPRISE">Empresarial</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                <select
                  className="w-full px-3 py-2 border rounded-lg"
                  value={editForm.status || 'ACTIVE'}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                >
                  <option value="ACTIVE">Activo</option>
                  <option value="SUSPENDED">Suspendido</option>
                  <option value="PENDING">Pendiente</option>
                  <option value="CANCELLED">Cancelado</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-red-600">Eliminar Tenant</h2>
            <p className="text-gray-600 mb-6">
              ¿Estás seguro de que deseas eliminar <strong>{tenant.name}</strong>? Esta acción:
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 mb-6 space-y-1">
              <li>Eliminará el tenant de la base de datos maestra</li>
              <li>La base de datos del tenant permanecerá intacta (para recuperación)</li>
              <li>Todos los usuarios perderán acceso</li>
              <li>Esta acción no se puede deshacer</li>
            </ul>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
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
