import { useState, useEffect } from 'react';
import { HiPlus, HiSearch, HiPencil, HiTrash, HiDotsVertical, HiOfficeBuilding, HiCurrencyDollar, HiExclamationCircle, HiCheckCircle, HiShoppingCart, HiChevronDown, HiChevronUp } from 'react-icons/hi';
import api from '../services/api';
import { useToast } from '../hooks/useToast';

interface Supplier {
  id: string;
  code: string;
  name: string;
  email: string;
  phone: string;
  taxId: string;
  isActive: boolean;
  financials: {
    totalPurchased: number;
    totalPaid: number;
    totalBalance: number;
    overdueInvoices: number;
  };
}

interface SuppliersProps {
  onSelectSupplier?: (id: string, name: string) => void;
}

export default function Suppliers({ onSelectSupplier }: SuppliersProps = {}) {
  const { showToast } = useToast();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    taxId: '',
    email: '',
    phone: '',
    address: '',
    isActive: true,
  });
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [expandedSupplierId, setExpandedSupplierId] = useState<string | null>(null);
  const [supplierPurchases, setSupplierPurchases] = useState<any[]>([]);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [selectedSupplierForPurchase, setSelectedSupplierForPurchase] = useState<string>('');
  const [purchaseFormData, setPurchaseFormData] = useState({
    supplierId: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    deliveryDate: '',
    subtotal: 0,
    tax: 0,
    discount: 0,
    notes: '',
  });
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    totalPurchased: 0,
    totalBalance: 0,
  });

  useEffect(() => {
    fetchSuppliers();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [suppliers]);

  const calculateStats = () => {
    const total = suppliers.length;
    const active = suppliers.filter(s => s.isActive).length;
    const totalPurchased = suppliers.reduce((sum, s) => sum + (s.financials?.totalPurchased || 0), 0);
    const totalBalance = suppliers.reduce((sum, s) => sum + (s.financials?.totalBalance || 0), 0);
    setStats({ total, active, totalPurchased, totalBalance });
  };

  const fetchSuppliers = async () => {
    try {
      console.log('Fetching suppliers...');
      const response = await api.get('/suppliers');
      console.log('Suppliers response:', response.data);
      const suppliersData = response.data.data || [];
      console.log('Suppliers data:', suppliersData);
      setSuppliers(suppliersData);
    } catch (error: any) {
      console.error('Error fetching suppliers:', error);
      console.error('Error details:', error.response?.data);
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingSupplier(null);
    setFormData({ code: '', name: '', taxId: '', email: '', phone: '', address: '', isActive: true });
    setShowModal(true);
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      code: supplier.code,
      name: supplier.name,
      taxId: supplier.taxId || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: '',
      isActive: supplier.isActive,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    const supplier = suppliers.find(s => s.id === id);
    if (!confirm('¿Estás seguro de eliminar este proveedor?')) return;
    try {
      await api.delete(`/suppliers/${id}`);
      showToast('Proveedor eliminado exitosamente', 'success');
      fetchSuppliers();
    } catch (error: any) {
      console.error('Error deleting supplier:', error);
      const errorMessage = error.response?.data?.error?.message || 'Error al eliminar proveedor';
      if (errorMessage.includes('facturas pendientes') || errorMessage.includes('invoices')) {
        showToast('No se puede eliminar: El proveedor tiene facturas pendientes', 'error');
      } else {
        showToast(errorMessage, 'error');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSupplier) {
        await api.put(`/suppliers/${editingSupplier.id}`, formData);
        showToast('Proveedor actualizado exitosamente', 'success');
      } else {
        await api.post('/suppliers', formData);
        showToast('Proveedor creado exitosamente', 'success');
      }
      setShowModal(false);
      fetchSuppliers();
    } catch (error: any) {
      console.error('Error saving supplier:', error);
      const errorMessage = error.response?.data?.error?.message || 'Error al guardar proveedor';
      showToast(errorMessage, 'error');
    }
  };

  const filteredSuppliers = suppliers.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.code.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Proveedores</h1>
          <p className="text-sm text-gray-500 mt-1">Gestiona tus proveedores y controla tus compras</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Total de proveedores</p>
          <p className="text-sm font-medium text-gray-900">{stats.total}</p>
        </div>
      </div>

      {/* Search and Actions */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 relative">
          <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar proveedor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
        >
          <HiPlus className="w-5 h-5" />
          Nuevo Proveedor
        </button>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-blue-100 rounded-lg p-2">
              <HiOfficeBuilding className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-xs font-medium text-gray-500">Total</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
          <p className="text-sm text-gray-500">{stats.active} activos</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-green-100 rounded-lg p-2">
              <HiCheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-xs font-medium text-gray-500">Activos</span>
          </div>
          <p className="text-3xl font-bold text-green-600">{stats.active}</p>
          <p className="text-sm text-gray-500">{((stats.active / stats.total) * 100 || 0).toFixed(0)}% del total</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-purple-100 rounded-lg p-2">
              <HiCurrencyDollar className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-xs font-medium text-gray-500">Comprado</span>
          </div>
          <p className="text-3xl font-bold text-purple-600">
            ${stats.totalPurchased.toLocaleString('es-DO', { minimumFractionDigits: 0 })}
          </p>
          <p className="text-sm text-gray-500">Histórico</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-red-100 rounded-lg p-2">
              <HiExclamationCircle className="w-6 h-6 text-red-600" />
            </div>
            <span className="text-xs font-medium text-gray-500">Saldo</span>
          </div>
          <p className="text-3xl font-bold text-red-600">
            ${stats.totalBalance.toLocaleString('es-DO', { minimumFractionDigits: 0 })}
          </p>
          <p className="text-sm text-gray-500">Por pagar</p>
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Código
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Proveedor
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contacto
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Comprado
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Saldo
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredSuppliers.map((supplier) => (
                <tr key={supplier.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">{supplier.code}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{supplier.name}</div>
                        <div className="text-xs text-gray-400">{supplier.taxId}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <div className="text-xs text-gray-900">{supplier.email}</div>
                        <div className="text-xs text-gray-400">{supplier.phone}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <span className="text-sm font-medium text-gray-900">
                        ${supplier.financials.totalPurchased.toLocaleString('es-DO', { minimumFractionDigits: 0 })}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <div>
                        <span className={`text-sm font-semibold ${
                          supplier.financials.totalBalance > 0 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          ${supplier.financials.totalBalance.toLocaleString('es-DO', { minimumFractionDigits: 0 })}
                        </span>
                        {supplier.financials.overdueInvoices > 0 && (
                          <div className="text-xs text-red-500">
                            {supplier.financials.overdueInvoices} vencida(s)
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        supplier.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {supplier.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <div className="relative inline-block">
                        <button
                          onClick={() => setOpenMenuId(openMenuId === supplier.id ? null : supplier.id)}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          <HiDotsVertical className="h-5 w-5 text-gray-600" />
                        </button>
                        {openMenuId === supplier.id && (
                          <div className="absolute right-0 mt-1 w-40 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                            <button
                              onClick={() => {
                                handleEdit(supplier);
                                setOpenMenuId(null);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                            >
                              <HiPencil className="h-4 w-4" />
                              Editar
                            </button>
                            <button
                              onClick={() => {
                                handleDelete(supplier.id);
                                setOpenMenuId(null);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center gap-2"
                            >
                              <HiTrash className="h-4 w-4" />
                              Eliminar
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredSuppliers.length === 0 && (
            <div className="text-center py-16">
              <div className="flex flex-col items-center">
                <div className="bg-gray-100 p-4 rounded-full mb-4">
                  <HiOfficeBuilding className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {search ? 'No se encontraron resultados' : 'No hay proveedores registrados'}
                </h3>
                <p className="text-sm text-gray-500 mb-6 max-w-sm">
                  {search 
                    ? 'Intenta con otros términos de búsqueda'
                    : 'Comienza agregando tu primer proveedor para gestionar tus compras'}
                </p>
                {!search && (
                  <button
                    onClick={handleCreate}
                    className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg text-sm font-semibold transition-all shadow-sm hover:shadow"
                  >
                    <HiPlus className="w-5 h-5" />
                    <span>Crear Primer Proveedor</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">
              {editingSupplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Código <span className="text-gray-500 text-xs">(Opcional - se genera automáticamente)</span></label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="Dejar vacío para generar automáticamente"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Nombre *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">RNC/Cédula</label>
                <input
                  type="text"
                  value={formData.taxId}
                  onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Proveedor Activo</span>
                </label>
                <p className="text-xs text-gray-500 mt-1">Los proveedores inactivos no aparecerán en las listas de selección</p>
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingSupplier ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
