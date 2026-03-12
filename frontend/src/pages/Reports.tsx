import { useState, useEffect } from 'react';
import GeneralSummaryTab from '../components/reports/GeneralSummaryTab';
import SalesReportTab from '../components/reports/SalesReportTab';
import ReceivablesReportTab from '../components/reports/ReceivablesReportTab';
import CashReportTab from '../components/reports/CashReportTab';
import InventoryReportTab from '../components/reports/InventoryReportTab';
import DailyProfitTab from '../components/reports/DailyProfitTab';
import SuppliersReportTab from '../components/reports/SuppliersReportTab';
import PurchasesReportTab from '../components/reports/PurchasesReportTab';
import PayablesReportTab from '../components/reports/PayablesReportTab';
import LoansReportTab from '../components/reports/LoansReportTab';
import { dashboardApi } from '../services/api';
import {
  HiChartBar,
  HiCurrencyDollar,
  HiReceiptTax,
  HiCash,
  HiCube,
  HiStar,
  HiDocumentText,
  HiTruck,
  HiShoppingCart,
  HiExclamationCircle,
  HiClock,
  HiCreditCard,
} from 'react-icons/hi';
import { MinimalStatCard } from '../components/MinimalStatCard';

type TabType = 'summary' | 'sales' | 'receivables' | 'cash' | 'inventory' | 'profit' | 'suppliers' | 'purchases' | 'payables' | 'loans';

const Reports = () => {
  const [activeTab, setActiveTab] = useState<TabType>('summary');
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      const data = await dashboardApi.getSummary();
      setSummary(data);
    } catch (error) {
      console.error('Error fetching summary:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const tabs = [
    { id: 'summary' as TabType, label: 'Resumen General', icon: HiChartBar },
    { id: 'sales' as TabType, label: 'Ventas', icon: HiCurrencyDollar },
    { id: 'receivables' as TabType, label: 'Ctas. por Cobrar', icon: HiReceiptTax },
    { id: 'payables' as TabType, label: 'Ctas. por Pagar', icon: HiExclamationCircle },
    { id: 'loans' as TabType, label: 'Préstamos', icon: HiCreditCard },
    { id: 'suppliers' as TabType, label: 'Proveedores', icon: HiTruck },
    { id: 'purchases' as TabType, label: 'Compras', icon: HiShoppingCart },
    { id: 'cash' as TabType, label: 'Caja', icon: HiCash },
    { id: 'inventory' as TabType, label: 'Inventario', icon: HiCube },
    { id: 'profit' as TabType, label: '¿Cuánto gané hoy?', icon: HiStar },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between rounded-[28px] border border-slate-200 bg-white/85 px-5 py-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] backdrop-blur">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Analítica</p>
          <h1 className="text-xl font-bold text-slate-950 sm:text-2xl">Reportes</h1>
          <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">Análisis y reportes del negocio</p>
        </div>
      </div>

      {/* KPI Cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <MinimalStatCard
            title="Ventas del Mes"
            value={formatCurrency(summary.salesMonth?.amount || 0)}
            icon={<HiCurrencyDollar className="w-full h-full" />}
            color="blue"
          />
          <MinimalStatCard
            title="Total Facturas"
            value={summary.invoicesCount || 0}
            subtitle="Este mes"
            icon={<HiDocumentText className="w-full h-full" />}
            color="green"
          />
          <MinimalStatCard
            title="Por Cobrar"
            value={formatCurrency(summary.receivables?.total || 0)}
            icon={<HiReceiptTax className="w-full h-full" />}
            color="orange"
          />
          <MinimalStatCard
            title="Por Pagar"
            value={formatCurrency(summary.payables?.total || 0)}
            icon={<HiExclamationCircle className="w-full h-full" />}
            color="red"
          />
          <MinimalStatCard
            title="Proveedores"
            value={summary.suppliersCount || 0}
            subtitle="Activos"
            icon={<HiTruck className="w-full h-full" />}
            color="blue"
          />
          <MinimalStatCard
            title="Compras del Mes"
            value={formatCurrency(summary.purchasesMonth?.amount || 0)}
            icon={<HiShoppingCart className="w-full h-full" />}
            color="green"
          />
          <MinimalStatCard
            title="Productos"
            value={summary.productsCount || 0}
            subtitle="En inventario"
            icon={<HiCube className="w-full h-full" />}
            color="purple"
          />
          <MinimalStatCard
            title="Compras Pendientes"
            value={summary.pendingPurchases || 0}
            subtitle="Por recibir"
            icon={<HiClock className="w-full h-full" />}
            color="orange"
          />
        </div>
      )}

      {/* Tabs */}
      <div className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
        <nav className="flex overflow-x-auto border-b border-slate-200 px-2 sm:px-6 scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex-shrink-0 py-3 sm:py-4 px-2 sm:px-0 sm:mr-6 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap transition-colors
                ${
                  activeTab === tab.id
                    ? 'border-slate-950 text-slate-950'
                    : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800'
                }
              `}
              title={tab.label}
            >
              <span className="inline-flex items-center gap-1">
                <tab.icon className="w-4 h-4 flex-shrink-0" />
                <span className="hidden sm:inline text-xs">{tab.label}</span>
              </span>
            </button>
          ))}
        </nav>

        {/* Tab Content */}
        <div className="p-3 sm:p-6">
          {activeTab === 'summary' && <GeneralSummaryTab />}
          {activeTab === 'sales' && <SalesReportTab />}
          {activeTab === 'receivables' && <ReceivablesReportTab />}
          {activeTab === 'payables' && <PayablesReportTab />}
          {activeTab === 'loans' && <LoansReportTab />}
          {activeTab === 'suppliers' && <SuppliersReportTab />}
          {activeTab === 'purchases' && <PurchasesReportTab />}
          {activeTab === 'cash' && <CashReportTab />}
          {activeTab === 'inventory' && <InventoryReportTab />}
          {activeTab === 'profit' && <DailyProfitTab />}
        </div>
      </div>
    </div>
  );
};

export default Reports;
