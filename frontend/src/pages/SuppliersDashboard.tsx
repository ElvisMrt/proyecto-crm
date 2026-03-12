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
      <div className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-slate-900"></div>
      </div>
    );
  }

  
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between rounded-[28px] border border-slate-200 bg-white/85 px-5 py-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] backdrop-blur">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Abastecimiento</p>
          <h1 className="text-xl font-bold text-slate-950 sm:text-2xl">Proveedores y Compras</h1>
          <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">Gestión de proveedores y cuentas por pagar</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
        <nav className="flex overflow-x-auto border-b border-slate-200 px-2 sm:px-6 scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex-shrink-0 py-3 sm:py-4 px-3 sm:px-0 sm:mr-8 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap transition-colors
                ${
                  activeTab === tab.id
                    ? 'border-slate-950 text-slate-950'
                    : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800'
                }
              `}
              title={tab.label}
            >
              <span className="inline-flex items-center gap-1.5">
                <tab.icon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="text-[11px] sm:text-sm">{tab.label}</span>
              </span>
            </button>
          ))}
        </nav>

        {/* Tab Content */}
        <div className="p-3 sm:p-6">
          {activeTab === 'dashboard' && (
            <div className="space-y-4">
              {/* Stats Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="rounded-[24px] border border-slate-200 bg-white p-3 shadow-sm sm:p-5">
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <div className="rounded-2xl bg-slate-100 p-1.5 text-slate-700 sm:p-2">
                      <HiTruck className="w-4 h-4 sm:w-6 sm:h-6" />
                    </div>
                    <span className="text-[10px] font-medium text-slate-500 sm:text-xs">Proveedores</span>
                  </div>
                  <p className="text-xl font-bold text-slate-950 sm:text-2xl">{stats.suppliers.total}</p>
                  <p className="text-xs text-slate-500 sm:text-sm">Total registrados</p>
                </div>

                <div className="rounded-[24px] border border-slate-200 bg-white p-3 shadow-sm sm:p-5">
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <div className="rounded-2xl bg-emerald-50 p-1.5 text-emerald-700 sm:p-2">
                      <HiShoppingCart className="w-4 h-4 sm:w-6 sm:h-6" />
                    </div>
                    <span className="text-[10px] font-medium text-slate-500 sm:text-xs">Compras</span>
                  </div>
                  <p className="text-xl font-bold text-slate-950 sm:text-2xl">{stats.purchases.total}</p>
                  <p className="text-xs text-slate-500 sm:text-sm">Total compras</p>
                </div>

                <div className="rounded-[24px] border border-slate-200 bg-white p-3 shadow-sm sm:p-5">
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <div className="rounded-2xl bg-amber-50 p-1.5 text-amber-700 sm:p-2">
                      <HiExclamationCircle className="w-4 h-4 sm:w-6 sm:h-6" />
                    </div>
                    <span className="text-[10px] font-medium text-slate-500 sm:text-xs">Pendientes</span>
                  </div>
                  <p className="text-xl font-bold text-slate-950 sm:text-2xl">{stats.purchases.pending}</p>
                  <p className="text-xs text-slate-500 sm:text-sm">Por recibir</p>
                </div>

                <div className="rounded-[24px] border border-slate-200 bg-white p-3 shadow-sm sm:p-5">
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <div className="rounded-2xl bg-slate-100 p-1.5 text-slate-700 sm:p-2">
                      <HiCash className="w-4 h-4 sm:w-6 sm:h-6" />
                    </div>
                    <span className="text-[10px] font-medium text-slate-500 sm:text-xs">Deuda Total</span>
                  </div>
                  <p className="truncate text-base font-bold text-slate-950 sm:text-2xl">${stats.invoices.totalDebt.toLocaleString()}</p>
                  <p className="text-xs text-slate-500 sm:text-sm">Por pagar</p>
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
