import { useState, useEffect } from 'react';
import { 
  HiTruck, 
  HiShoppingCart, 
  HiCash,
  HiExclamationCircle,
  HiChartBar
} from 'react-icons/hi';
import api from '../services/api';
import SuppliersWithPurchases from './SuppliersWithPurchases';

type TabType = 'dashboard' | 'suppliers';

interface Stats {
  suppliers: {
    total: number;
    active: number;
  };
  purchases: {
    total: number;
    pending: number;
  };
  invoices: { 
    total: number, 
    pending: number, 
    overdue: number, 
    totalDebt: number, 
    overdueDebt: number,
    upcomingDue: number
  };
  payments: {
    total: number;
    thisMonth: number;
    amountThisMonth: number;
  };
}

export default function SuppliersDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [stats, setStats] = useState<Stats>({
    suppliers: { total: 0, active: 0 },
    purchases: { total: 0, pending: 0 },
    invoices: { 
      total: 0, 
      pending: 0, 
      overdue: 0, 
      totalDebt: 0, 
      overdueDebt: 0,
      upcomingDue: 0
    },
    payments: { total: 0, thisMonth: 0, amountThisMonth: 0 }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      console.log('Fetching supplier stats...');
      const [suppliersRes, invoicesRes, paymentsRes] = await Promise.all([
        api.get('/suppliers/stats'),
        api.get('/supplier-invoices/stats'),
        api.get('/supplier-payments/stats')
      ]);

      console.log('Suppliers response:', suppliersRes.data);
      console.log('Invoices response:', invoicesRes.data);
      console.log('Payments response:', paymentsRes.data);

      const newStats = {
        suppliers: {
          total: suppliersRes.data.data?.totalSuppliers || 0,
          active: suppliersRes.data.data?.activeSuppliers || 0
        },
        purchases: {
          total: 0,
          pending: 0
        },
        invoices: {
          total: invoicesRes.data.data?.totalInvoices || 0,
          pending: invoicesRes.data.data?.pendingInvoices || 0,
          overdue: invoicesRes.data.data?.overdueInvoices || 0,
          totalDebt: invoicesRes.data.data?.totalDebt || 0,
          overdueDebt: invoicesRes.data.data?.overdueDebt || 0,
          upcomingDue: invoicesRes.data.data?.upcomingDue || 0
        },
        payments: {
          total: paymentsRes.data.data?.totalPayments || 0,
          thisMonth: paymentsRes.data.data?.paymentsThisMonth || 0,
          amountThisMonth: paymentsRes.data.data?.amountThisMonth || 0
        }
      };

      console.log('Setting stats:', newStats);
      setStats(newStats);
    } catch (error: any) {
      console.error('Error fetching stats:', error);
      console.error('Error details:', error.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'dashboard' as TabType, label: 'Dashboard', icon: HiChartBar },
    { id: 'suppliers' as TabType, label: 'Proveedores', icon: HiTruck },
  ];

  if (loading && activeTab === 'dashboard') {
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
          <h1 className="text-2xl font-bold text-gray-900">Proveedores y Compras</h1>
          <p className="text-sm text-gray-500 mt-1">Gestión de proveedores y cuentas por pagar</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Módulo activo</p>
          <p className="text-sm font-medium text-gray-900">Proveedores</p>
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
          {activeTab === 'dashboard' && (
            <div className="space-y-4">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <div className="bg-blue-100 rounded-lg p-2">
                      <HiTruck className="w-6 h-6 text-blue-600" />
                    </div>
                    <span className="text-xs font-medium text-gray-500">Proveedores</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{stats.suppliers.total}</p>
                  <p className="text-sm text-gray-500">Total registrados</p>
                </div>

                <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <div className="bg-green-100 rounded-lg p-2">
                      <HiShoppingCart className="w-6 h-6 text-green-600" />
                    </div>
                    <span className="text-xs font-medium text-gray-500">Compras</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{stats.purchases.total}</p>
                  <p className="text-sm text-gray-500">Total compras</p>
                </div>

                <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <div className="bg-yellow-100 rounded-lg p-2">
                      <HiExclamationCircle className="w-6 h-6 text-yellow-600" />
                    </div>
                    <span className="text-xs font-medium text-gray-500">Pendientes</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{stats.purchases.pending}</p>
                  <p className="text-sm text-gray-500">Por recibir</p>
                </div>

                <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <div className="bg-purple-100 rounded-lg p-2">
                      <HiCash className="w-6 h-6 text-purple-600" />
                    </div>
                    <span className="text-xs font-medium text-gray-500">Deuda Total</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">${stats.invoices.totalDebt.toLocaleString()}</p>
                  <p className="text-sm text-gray-500">Por pagar</p>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'suppliers' && <SuppliersWithPurchases />}
        </div>
      </div>
    </div>
  );
};
