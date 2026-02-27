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
} from 'react-icons/hi';
import { MinimalStatCard } from '../components/MinimalStatCard';

type TabType = 'summary' | 'sales' | 'receivables' | 'cash' | 'inventory' | 'profit' | 'suppliers' | 'purchases' | 'payables';

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
    { id: 'suppliers' as TabType, label: 'Proveedores', icon: HiTruck },
    { id: 'purchases' as TabType, label: 'Compras', icon: HiShoppingCart },
    { id: 'cash' as TabType, label: 'Caja', icon: HiCash },
    { id: 'inventory' as TabType, label: 'Inventario', icon: HiCube },
    { id: 'profit' as TabType, label: '¿Cuánto gané hoy?', icon: HiStar },
  ];

  return (
    <div className="p-4 md:p-6 space-y-4 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
          <p className="text-sm text-gray-500 mt-1">Análisis y reportes del negocio</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Módulo activo</p>
          <p className="text-sm font-medium text-gray-900">Reportes</p>
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
          {activeTab === 'summary' && <GeneralSummaryTab />}
          {activeTab === 'sales' && <SalesReportTab />}
          {activeTab === 'receivables' && <ReceivablesReportTab />}
          {activeTab === 'payables' && <PayablesReportTab />}
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

