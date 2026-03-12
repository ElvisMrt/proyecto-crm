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
import { branchesApi, inventoryApi } from '../services/api';
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

interface PurchaseFormItem {
  productId: string;
  description: string;
  quantity: number;
  unitPrice: number;
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
  const [branches, setBranches] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [supplierSearchTerm, setSupplierSearchTerm] = useState('');
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    supplierId: '',
    branchId: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    total: '' as any,
    notes: '',
    status: 'PENDING',
    items: [] as PurchaseFormItem[],
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
    fetchBranches();
    fetchProducts();
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

  const fetchBranches = async () => {
    try {
      const response = await branchesApi.getBranches();
      const branchesData = response?.data || response || [];
      setBranches(branchesData);
      if (branchesData.length > 0) {
        setFormData((prev) => ({
          ...prev,
          branchId: prev.branchId || branchesData[0].id,
        }));
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await inventoryApi.getProducts({ isActive: 'true', limit: 100 });
      setProducts(response.data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleCreate = () => {
    setEditingPurchase(null);
    setFormData({
      supplierId: '',
      branchId: branches[0]?.id || '',
      purchaseDate: new Date().toISOString().split('T')[0],
      total: '' as any,
      notes: '',
      status: 'PENDING',
      items: [],
    });
    setSupplierSearchTerm('');
    setShowSupplierDropdown(false);
    setHighlightedIndex(-1);
    setShowModal(true);
  };

  const handleEdit = async (purchase: Purchase) => {
    try {
      const response = await api.get(`/purchases/${purchase.id}`);
      const purchaseDetail = response.data?.data || purchase;

      setEditingPurchase(purchase);
      setFormData({
        supplierId: purchaseDetail.supplierId,
        branchId: purchaseDetail.branchId || '',
        purchaseDate: new Date(purchaseDetail.purchaseDate).toISOString().split('T')[0],
        total: Number(purchaseDetail.total || 0),
        notes: purchaseDetail.notes || '',
        status: purchaseDetail.status,
        items: (purchaseDetail.items || []).map((item: any) => ({
          productId: item.productId || '',
          description: item.description,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
        })),
      });
      setSupplierSearchTerm(purchaseDetail.supplier?.name || purchase.supplier?.name || '');
      setShowSupplierDropdown(false);
      setHighlightedIndex(-1);
      setShowModal(true);
    } catch (error) {
      console.error('Error fetching purchase detail:', error);
      showToast('No se pudo cargar el detalle de la compra', 'error');
    }
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

    if (formData.items.length > 0 && !formData.branchId) {
      showToast('Seleccione una sucursal para compras con items', 'error');
      return;
    }

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

  const handleAddItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          productId: '',
          description: '',
          quantity: 1,
          unitPrice: 0,
        },
      ],
    }));
  };

  const handleRemoveItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const handleItemChange = (index: number, field: keyof PurchaseFormItem, value: string | number) => {
    setFormData((prev) => {
      const nextItems = [...prev.items];
      const currentItem = nextItems[index];
      nextItems[index] = {
        ...currentItem,
        [field]: value,
      };

      if (field === 'productId') {
        const selectedProduct = products.find((product) => product.id === value);
        nextItems[index] = {
          ...nextItems[index],
          description: selectedProduct?.name || currentItem.description,
          unitPrice: selectedProduct ? Number(selectedProduct.cost || selectedProduct.salePrice || 0) : currentItem.unitPrice,
        };
      }

      const computedTotal = nextItems.reduce((sum, item) => sum + ((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)), 0);

      return {
        ...prev,
        items: nextItems,
        total: nextItems.length > 0 ? computedTotal : prev.total,
      };
    });
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
      PENDING: { label: 'Pendiente', color: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300' },
      RECEIVED: { label: 'Recibida', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' },
      CANCELLED: { label: 'Cancelada', color: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300' },
    };

    const badge = badges[status] || { label: status, color: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200' };

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
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-slate-900" />
      </div>
    );
  }

  // Definir tabs según estándar
  const tabs = [
    { id: 'list' as TabType, label: 'Lista de Compras', icon: HiShoppingCart },
    { id: 'stats' as TabType, label: 'Estadísticas', icon: HiChartBar },
  ];

  return (
    <div className="space-y-5 p-4 md:p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between rounded-[28px] border border-slate-200 bg-white/85 px-5 py-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] backdrop-blur dark:border-slate-800 dark:bg-slate-950/70">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Abastecimiento</p>
          <h1 className="text-2xl font-bold text-slate-950 dark:text-slate-100">Compras</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Gestión de compras y proveedores</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500 dark:text-slate-400">Módulo activo</p>
          <p className="text-sm font-medium text-slate-950 dark:text-slate-100">Compras</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="rounded-[28px] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950/70">
        <nav className="flex space-x-4 overflow-x-auto px-3 sm:space-x-8 sm:px-6 scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`
                py-4 border-b-2 font-medium text-sm whitespace-nowrap transition-colors
                ${
                  activeTab === tab.id
                    ? 'border-slate-950 text-slate-950'
                    : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:text-slate-200'
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
                  <HiSearch className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-slate-400 dark:text-slate-500" />
                  <input
                  type="text"
                  placeholder="Buscar compra..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-slate-500 dark:focus:ring-slate-800"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditingPurchase(null);
                  setFormData({
                    supplierId: '',
                    branchId: branches[0]?.id || '',
                    purchaseDate: new Date().toISOString().split('T')[0],
                    total: '',
                    notes: '',
                    status: 'PENDING',
                    items: [],
                  });
                  setShowModal(true);
                }}
                className="flex items-center gap-2 whitespace-nowrap rounded-2xl bg-slate-900 px-4 py-2.5 text-white transition hover:bg-slate-800"
              >
                <HiPlus className="w-5 h-5" />
                Nueva Compra
              </button>
            </div>

            {/* Resto del contenido de list tab */}
            <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950/70">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                  <thead className="bg-slate-100/70 dark:bg-slate-900/80">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
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
                  <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-800 dark:bg-slate-950/50">
                    {visiblePurchases.length > 0 ? (
                      visiblePurchases.map((purchase) => (
                        <tr key={purchase.id} className="hover:bg-slate-100/70 dark:hover:bg-slate-900/70">
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-950 dark:text-slate-100">
                            {purchase.code}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                            {purchase.supplier?.name || 'N/A'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                            {formatDate(purchase.purchaseDate)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {getStatusBadge(purchase.status)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-slate-950 dark:text-slate-100">
                            {formatCurrency(purchase.total)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-center">
                            <div className="relative inline-block">
                              <button
                                type="button"
                                onClick={() => setOpenMenuId(openMenuId === purchase.id ? null : purchase.id)}
                                className="rounded-xl p-1 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                              >
                                <HiDotsVertical className="h-5 w-5" />
                              </button>
                              {openMenuId === purchase.id && (
                                <div className="absolute right-0 z-10 mt-2 w-48 rounded-2xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
                                  <div className="py-1">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        handleEdit(purchase);
                                        setOpenMenuId(null);
                                      }}
                                      className="flex w-full items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                                    >
                                      Editar
                                    </button>
                                    {purchase.status !== 'RECEIVED' && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          handleReceive(purchase.id);
                                          setOpenMenuId(null);
                                        }}
                                        className="flex w-full items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                                      >
                                        Marcar Recibida
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        handleGenerateInvoice(purchase.id);
                                        setOpenMenuId(null);
                                      }}
                                      className="flex w-full items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                                    >
                                      Generar Factura
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        handleDelete(purchase.id);
                                        setOpenMenuId(null);
                                      }}
                                      className="flex w-full items-center px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-500/10"
                                    >
                                      Eliminar
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center">
                          <div className="text-center">
                            <HiShoppingCart className="mx-auto h-12 w-12 text-slate-400 dark:text-slate-500" />
                            <h3 className="mt-2 text-sm font-medium text-slate-950 dark:text-slate-100">No hay compras</h3>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                              Comienza agregando tu primera compra
                            </p>
                            <div className="mt-6">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingPurchase(null);
                                  setFormData({
                                    supplierId: '',
                                    branchId: branches[0]?.id || '',
                                    purchaseDate: new Date().toISOString().split('T')[0],
                                    total: '',
                                    notes: '',
                                    status: 'PENDING',
                                    items: [],
                                  });
                                  setShowModal(true);
                                }}
                                className="inline-flex items-center rounded-2xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
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
              <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-950/70">
                <div className="flex items-center justify-between mb-3">
                  <div className="rounded-2xl bg-slate-100 p-2 dark:bg-slate-900">
                    <HiShoppingCart className="h-6 w-6 text-slate-700 dark:text-slate-300" />
                  </div>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Compras</span>
                </div>
                <p className="text-2xl font-bold text-slate-950 dark:text-slate-100">{stats.total}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Total compras</p>
              </div>

              <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-950/70">
                <div className="flex items-center justify-between mb-3">
                  <div className="rounded-2xl bg-amber-100 p-2 dark:bg-amber-500/10">
                    <HiClock className="h-6 w-6 text-amber-700 dark:text-amber-300" />
                  </div>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Pendientes</span>
                </div>
                <p className="text-2xl font-bold text-slate-950 dark:text-slate-100">{stats.pending}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Por recibir</p>
              </div>

              <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-950/70">
                <div className="flex items-center justify-between mb-3">
                  <div className="rounded-2xl bg-emerald-100 p-2 dark:bg-emerald-500/10">
                    <HiTruck className="h-6 w-6 text-emerald-700 dark:text-emerald-300" />
                  </div>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Recibidas</span>
                </div>
                <p className="text-2xl font-bold text-slate-950 dark:text-slate-100">{stats.received}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Recibidas</p>
              </div>

              <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-950/70">
                <div className="flex items-center justify-between mb-3">
                  <div className="rounded-2xl bg-sky-100 p-2 dark:bg-sky-500/10">
                    <HiCurrencyDollar className="h-6 w-6 text-sky-700 dark:text-sky-300" />
                  </div>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Monto Total</span>
                </div>
                <p className="text-2xl font-bold text-slate-950 dark:text-slate-100">
                  ${stats.totalAmount.toLocaleString('es-DO', { minimumFractionDigits: 0 })}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Comprado</p>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-950">
            <div className="p-3 sm:p-6">
              <h2 className="mb-4 text-xl font-semibold text-slate-950 dark:text-slate-100">
                {editingPurchase ? 'Editar Compra' : 'Nueva Compra'}
              </h2>

              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Proveedor *</label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={supplierSearchTerm}
                        onChange={(e) => setSupplierSearchTerm(e.target.value)}
                        onFocus={() => setShowSupplierDropdown(true)}
                        onKeyDown={handleSupplierKeyDown}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-slate-500 dark:focus:ring-slate-800"
                        placeholder="Buscar proveedor..."
                      />
                      {showSupplierDropdown && filteredSuppliers.length > 0 && (
                        <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-2xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
                          {filteredSuppliers.map((supplier, index) => (
                            <div
                              key={supplier.id}
                              className={`cursor-pointer px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 ${
                                index === highlightedIndex ? 'bg-slate-100 dark:bg-slate-800' : ''
                              }`}
                              onClick={() => handleSelectSupplier(supplier)}
                            >
                              <div className="font-medium text-slate-900 dark:text-slate-100">{supplier.name}</div>
                              {supplier.code && (
                                <div className="text-sm text-slate-500 dark:text-slate-400">Código: {supplier.code}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Sucursal</label>
                    <select
                      value={formData.branchId}
                      onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-slate-500 dark:focus:ring-slate-800"
                    >
                      <option value="">Sin sucursal</option>
                      {branches.map((branch) => (
                        <option key={branch.id} value={branch.id}>
                          {branch.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Fecha *</label>
                    <input
                      type="date"
                      required
                      value={formData.purchaseDate}
                      onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-slate-500 dark:focus:ring-slate-800"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Items</label>
                      <button
                        type="button"
                        onClick={handleAddItem}
                        className="text-sm text-slate-700 hover:text-slate-950"
                      >
                        Agregar item
                      </button>
                    </div>
                    {formData.items.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-300 p-3 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                        Puedes dejar la compra como monto manual o agregar productos para luego recibir inventario.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {formData.items.map((item, index) => (
                          <div key={index} className="space-y-2 rounded-2xl border border-slate-200 p-3 dark:border-slate-800 dark:bg-slate-900/60">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Item {index + 1}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(index)}
                                className="text-sm text-rose-600 hover:text-rose-700 dark:text-rose-300 dark:hover:text-rose-200"
                              >
                                Quitar
                              </button>
                            </div>
                            <select
                              value={item.productId}
                              onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-slate-500 dark:focus:ring-slate-800"
                            >
                              <option value="">Seleccionar producto</option>
                              {products.map((product) => (
                                <option key={product.id} value={product.id}>
                                  {product.code} - {product.name}
                                </option>
                              ))}
                            </select>
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-slate-500 dark:focus:ring-slate-800"
                              placeholder="Descripcion"
                            />
                            <div className="grid grid-cols-2 gap-3">
                              <input
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={item.quantity}
                                onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-slate-500 dark:focus:ring-slate-800"
                                placeholder="Cantidad"
                              />
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.unitPrice}
                                onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-slate-500 dark:focus:ring-slate-800"
                                placeholder="Costo"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Total *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.total}
                      onChange={(e) => setFormData({ ...formData, total: e.target.value })}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-slate-500 dark:focus:ring-slate-800"
                      placeholder="0.00"
                      readOnly={formData.items.length > 0}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Estado *</label>
                    <select
                      required
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-slate-500 dark:focus:ring-slate-800"
                    >
                      <option value="PENDING">Pendiente</option>
                      <option value="RECEIVED">Recibida</option>
                      <option value="CANCELLED">Cancelada</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Notas</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-slate-500 dark:focus:ring-slate-800"
                      rows={3}
                    />
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="flex-1 rounded-2xl border border-slate-200 px-4 py-2 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      Cancelar
                    </button>

                    <button type="submit" className="flex-1 rounded-2xl bg-slate-900 px-4 py-2 text-white transition hover:bg-slate-800">
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
