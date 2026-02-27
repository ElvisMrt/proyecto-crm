import { useState, useEffect, useRef } from 'react';
import {
  HiPlus,
  HiShoppingCart,
  HiDotsVertical,
  HiCurrencyDollar,
  HiTruck,
  HiSearch,
  HiClock,
  HiChartBar,
} from 'react-icons/hi';
import api from '../services/api';
import { useToast } from '../hooks/useToast';


interface Purchase {
  id: string;
  code: string;
  supplierId: string;
  supplier?: {
    name: string;
  };
  purchaseDate: string;
  status: string;
  total: number;
  paid?: number;
  balance?: number;
}

type TabType = 'list' | 'stats';

const Purchases = () => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>('list');

  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);

  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [supplierSearchTerm, setSupplierSearchTerm] = useState('');
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    supplierId: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    total: '' as any,
    notes: '',
    status: 'PENDING',
  });

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const [search, setSearch] = useState('');

  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    received: 0,
    totalAmount: 0,
    totalPaid: 0,
    totalBalance: 0,
  });

  useEffect(() => {
    fetchPurchases();
    fetchSuppliers();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSupplierDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchPurchases = async () => {
    try {
      const response = await api.get('/purchases');
      const data = response.data?.data || response.data || [];
      setPurchases(data);

      const totalPurchases = data.length;
      const pending = data.filter((p: Purchase) => p.status === 'PENDING').length;
      const received = data.filter((p: Purchase) => p.status === 'RECEIVED').length;
      const totalAmount = data.reduce((sum: number, p: Purchase) => sum + (p.total || 0), 0);
      const totalPaid = data.reduce((sum: number, p: Purchase) => sum + (p.paid || 0), 0);
      const totalBalance = data.reduce((sum: number, p: Purchase) => sum + (p.balance || 0), 0);

      setStats({
        total: totalPurchases,
        pending,
        received,
        totalAmount,
        totalPaid,
        totalBalance,
      });
    } catch (error: any) {
      console.error('Error fetching purchases:', error);
      setPurchases([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await api.get('/suppliers');
      setSuppliers(response.data.data || []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  const handleCreate = () => {
    setEditingPurchase(null);
    setFormData({
      supplierId: '',
      purchaseDate: new Date().toISOString().split('T')[0],
      total: '' as any,
      notes: '',
      status: 'PENDING',
    });
    setSupplierSearchTerm('');
    setShowSupplierDropdown(false);
    setHighlightedIndex(-1);
    setShowModal(true);
  };

  const handleEdit = (purchase: Purchase) => {
    setEditingPurchase(purchase);
    setFormData({
      supplierId: purchase.supplierId,
      purchaseDate: new Date(purchase.purchaseDate).toISOString().split('T')[0],
      total: purchase.total,
      notes: '',
      status: purchase.status,
    });
    setSupplierSearchTerm(purchase.supplier?.name || '');
    setShowSupplierDropdown(false);
    setHighlightedIndex(-1);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta compra?')) return;
    try {
      await api.delete(`/purchases/${id}`);
      showToast('Compra eliminada exitosamente', 'success');
      fetchPurchases();
    } catch (error: any) {
      console.error('Error deleting purchase:', error);
      const errorMessage = error.response?.data?.error?.message || 'Error al eliminar compra';
      showToast(errorMessage, 'error');
    }
  };

  const handleReceive = async (id: string) => {
    if (!confirm('¿Marcar esta compra como recibida?')) return;
    try {
      await api.post(`/purchases/${id}/receive`);
      showToast('Compra marcada como recibida exitosamente', 'success');
      fetchPurchases();
    } catch (error: any) {
      console.error('Error receiving purchase:', error);
      const errorMessage = error.response?.data?.error?.message || 'Error al recibir compra';
      showToast(errorMessage, 'error');
    }
  };

  const handleGenerateInvoice = async (id: string) => {
    if (!confirm('¿Generar factura para esta compra?')) return;
    try {
      const response = await api.post(`/purchases/${id}/create-invoice`);
      showToast('Factura generada exitosamente', 'success');
      fetchPurchases();
      console.log('Invoice created:', response.data);
    } catch (error: any) {
      console.error('Error generating invoice:', error);
      const errorMessage = error.response?.data?.error?.message || 'Error al generar factura';
      showToast(errorMessage, 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPurchase) {
        await api.put(`/purchases/${editingPurchase.id}`, formData);
        showToast('Compra actualizada exitosamente', 'success');
      } else {
        await api.post('/purchases', formData);
        showToast('Compra creada exitosamente', 'success');
      }
      setShowModal(false);
      fetchPurchases();
    } catch (error: any) {
      console.error('Error saving purchase:', error);
      const errorMessage = error.response?.data?.error?.message || 'Error al guardar compra';
      showToast(errorMessage, 'error');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-DO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const filteredSuppliers =
    supplierSearchTerm.trim() === ''
      ? suppliers.filter((s) => s.isActive !== false)
      : suppliers.filter(
          (s) =>
            s.isActive !== false &&
            (s.name?.toLowerCase().includes(supplierSearchTerm.toLowerCase()) ||
              s.code?.toLowerCase().includes(supplierSearchTerm.toLowerCase()))
        );

  const handleSelectSupplier = (supplier: any) => {
    setFormData({ ...formData, supplierId: supplier.id });
    setSupplierSearchTerm(supplier.name);
    setShowSupplierDropdown(false);
  };

  const handleSupplierKeyDown = (e: React.KeyboardEvent) => {
    if (!showSupplierDropdown) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < filteredSuppliers.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < filteredSuppliers.length) {
        handleSelectSupplier(filteredSuppliers[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setShowSupplierDropdown(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; color: string }> = {
      PENDING: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
      RECEIVED: { label: 'Recibida', color: 'bg-green-100 text-green-800' },
      CANCELLED: { label: 'Cancelada', color: 'bg-red-100 text-red-800' },
    };

    const badge = badges[status] || { label: status, color: 'bg-gray-100 text-gray-800' };

    return <span className={`px-2 py-1 text-xs font-medium rounded ${badge.color}`}>{badge.label}</span>;
  };

  // Opcional: filtro básico por search en frontend (código/proveedor)
  const visiblePurchases = purchases.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (p.code || '').toLowerCase().includes(q) ||
      (p.supplier?.name || '').toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  // Definir tabs según estándar
  const tabs = [
    { id: 'list' as TabType, label: 'Lista de Compras', icon: HiShoppingCart },
    { id: 'stats' as TabType, label: 'Estadísticas', icon: HiChartBar },
  ];

  return (
    <div className="p-4 md:p-6 space-y-4 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Compras</h1>
          <p className="text-sm text-gray-500 mt-1">Gestión de compras y proveedores</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Módulo activo</p>
          <p className="text-sm font-medium text-gray-900">Compras</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <nav className="flex space-x-4 sm:space-x-8 px-3 sm:px-6 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`
                py-4 border-b-2 font-medium text-sm whitespace-nowrap transition-colors
                ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <span className="inline-flex items-center gap-2">
                <tab.icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </span>
            </button>
          ))}
        </nav>

        {/* Tab Content */}
        <div className="p-3 sm:p-6">
          {activeTab === 'list' && (
            <div className="space-y-4">
              {/* Search and Actions */}
              <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                  <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                  type="text"
                  placeholder="Buscar compra..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditingPurchase(null);
                  setFormData({
                    supplierId: '',
                    purchaseDate: new Date().toISOString().split('T')[0],
                    total: '',
                    notes: '',
                    status: 'PENDING',
                  });
                  setShowModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
              >
                <HiPlus className="w-5 h-5" />
                Nueva Compra
              </button>
            </div>

            {/* Resto del contenido de list tab */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Número
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Proveedor
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {visiblePurchases.length > 0 ? (
                      visiblePurchases.map((purchase) => (
                        <tr key={purchase.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                            {purchase.code}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {purchase.supplier?.name || 'N/A'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(purchase.purchaseDate)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {getStatusBadge(purchase.status)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right">
                            {formatCurrency(purchase.total)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-center">
                            <div className="relative inline-block">
                              <button
                                type="button"
                                onClick={() => setOpenMenuId(openMenuId === purchase.id ? null : purchase.id)}
                                className="p-1 hover:bg-gray-100 rounded"
                              >
                                <HiDotsVertical className="w-5 h-5 text-gray-500" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center">
                          <div className="text-center">
                            <HiShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay compras</h3>
                            <p className="mt-1 text-sm text-gray-500">
                              Comienza agregando tu primera compra
                            </p>
                            <div className="mt-6">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingPurchase(null);
                                  setFormData({
                                    supplierId: '',
                                    purchaseDate: new Date().toISOString().split('T')[0],
                                    total: '',
                                    notes: '',
                                    status: 'PENDING',
                                  });
                                  setShowModal(true);
                                }}
                                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                              >
                                <HiPlus className="w-4 h-4 mr-2" />
                                Nueva Compra
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="space-y-4">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="bg-blue-100 rounded-lg p-2">
                    <HiShoppingCart className="w-6 h-6 text-blue-600" />
                  </div>
                  <span className="text-xs font-medium text-gray-500">Total Compras</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-sm text-gray-500">Total compras</p>
              </div>

              <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="bg-yellow-100 rounded-lg p-2">
                    <HiClock className="w-6 h-6 text-yellow-600" />
                  </div>
                  <span className="text-xs font-medium text-gray-500">Pendientes</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                <p className="text-sm text-gray-500">Por recibir</p>
              </div>

              <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="bg-green-100 rounded-lg p-2">
                    <HiTruck className="w-6 h-6 text-green-600" />
                  </div>
                  <span className="text-xs font-medium text-gray-500">Recibidas</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{stats.received}</p>
                <p className="text-sm text-gray-500">Recibidas</p>
              </div>

              <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="bg-purple-100 rounded-lg p-2">
                    <HiCurrencyDollar className="w-6 h-6 text-purple-600" />
                  </div>
                  <span className="text-xs font-medium text-gray-500">Monto Total</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  ${stats.totalAmount.toLocaleString('es-DO', { minimumFractionDigits: 0 })}
                </p>
                <p className="text-sm text-gray-500">Comprado</p>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-3 sm:p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {editingPurchase ? 'Editar Compra' : 'Nueva Compra'}
              </h2>

              <form onSubmit={handleCreate}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor *</label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={supplierSearchTerm}
                        onChange={(e) => setSupplierSearchTerm(e.target.value)}
                        onFocus={() => setShowSupplierDropdown(true)}
                        onKeyDown={handleSupplierKeyDown}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                        placeholder="Buscar proveedor..."
                      />
                      {showSupplierDropdown && filteredSuppliers.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                          {filteredSuppliers.map((supplier, index) => (
                            <div
                              key={supplier.id}
                              className={`px-3 py-2 cursor-pointer hover:bg-gray-50 ${
                                index === highlightedIndex ? 'bg-blue-50' : ''
                              }`}
                              onClick={() => handleSelectSupplier(supplier)}
                            >
                              <div className="font-medium">{supplier.name}</div>
                              {supplier.code && (
                                <div className="text-sm text-gray-500">Código: {supplier.code}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha *</label>
                    <input
                      type="date"
                      required
                      value={formData.purchaseDate}
                      onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.total}
                      onChange={(e) => setFormData({ ...formData, total: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estado *</label>
                    <select
                      required
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="PENDING">Pendiente</option>
                      <option value="RECEIVED">Recibida</option>
                      <option value="CANCELLED">Cancelada</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                      rows={3}
                    />
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancelar
                    </button>

                    <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      {editingPurchase ? 'Actualizar' : 'Crear'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Purchases;