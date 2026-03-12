import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { inventoryApi } from '../services/api';
import ProductsTab from '../components/inventory/ProductsTab';
import CategoriesTab from '../components/inventory/CategoriesTab';
import StockTab from '../components/inventory/StockTab';
import MovementsTab from '../components/inventory/MovementsTab';
import AdjustmentsTab from '../components/inventory/AdjustmentsTab';
import AlertsTab from '../components/inventory/AlertsTab';
import {
  HiCube,
  HiFolder,
  HiChartBar,
  HiRefresh,
  HiExclamation,
  HiExclamationCircle,
} from 'react-icons/hi';

type TabType = 'products' | 'categories' | 'stock' | 'movements' | 'adjustments' | 'alerts';

const Inventory = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>('stock');
  const [alerts, setAlerts] = useState<any[]>([]);
  const focusedProductId = searchParams.get('productId') || '';

  useEffect(() => {
    fetchAlerts();
  }, []);

  useEffect(() => {
    const requestedTab = searchParams.get('tab');
    if (requestedTab && ['products', 'categories', 'stock', 'movements', 'adjustments', 'alerts'].includes(requestedTab)) {
      setActiveTab(requestedTab as TabType);
    }
  }, [searchParams]);

  const fetchAlerts = async () => {
    try {
      const response = await inventoryApi.getLowStockAlerts();
      setAlerts(response.data || []);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  };

  const handleTabChange = (tab: TabType) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('tab', tab);
    if (tab !== 'products' && tab !== 'stock') {
      nextParams.delete('productId');
    }
    setSearchParams(nextParams, { replace: true });
    setActiveTab(tab);
  };

  const tabs = [
    { id: 'products' as TabType, label: 'Productos', icon: HiCube },
    { id: 'categories' as TabType, label: 'Categorías', icon: HiFolder },
    { id: 'stock' as TabType, label: 'Stock / Existencias', icon: HiChartBar },
    { id: 'movements' as TabType, label: 'Movimientos (Kardex)', icon: HiRefresh },
    { id: 'adjustments' as TabType, label: 'Ajustes', icon: HiExclamation },
    { id: 'alerts' as TabType, label: 'Alertas de Stock', icon: HiExclamationCircle, badge: alerts.length },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between rounded-[28px] border border-slate-200 bg-white/85 px-5 py-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] backdrop-blur">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Existencias</p>
          <h1 className="text-xl font-bold text-slate-950 sm:text-2xl">Inventario</h1>
          <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">Gestión de productos y existencias</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
        <nav className="flex overflow-x-auto border-b border-slate-200 px-2 sm:px-6 scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              className={`
                flex-shrink-0 py-3 sm:py-4 px-2 sm:px-0 sm:mr-8 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap transition-colors
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
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden text-[11px]">{tab.label.split(' ')[0]}</span>
                {tab.badge && tab.badge > 0 && (
                  <span className="rounded-full bg-slate-100 py-0.5 px-1.5 text-[10px] font-medium text-slate-700 sm:text-xs">
                    {tab.badge}
                  </span>
                )}
              </span>
            </button>
          ))}
        </nav>

        {/* Tab Content */}
        <div className="p-3 sm:p-6">
          {activeTab === 'products' && <ProductsTab focusedProductId={focusedProductId} />}
          {activeTab === 'categories' && <CategoriesTab />}
          {activeTab === 'stock' && <StockTab focusedProductId={focusedProductId} />}
          {activeTab === 'movements' && <MovementsTab />}
          {activeTab === 'adjustments' && <AdjustmentsTab onAdjustmentCreated={fetchAlerts} />}
          {activeTab === 'alerts' && <AlertsTab />}
        </div>
      </div>
    </div>
  );
};

export default Inventory;
