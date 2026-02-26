import { useState, useEffect } from 'react';
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
  const [activeTab, setActiveTab] = useState<TabType>('stock');
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await inventoryApi.getLowStockAlerts();
      setAlerts(response.data || []);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
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
    <div className="p-4 md:p-6 space-y-4 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventario</h1>
          <p className="text-sm text-gray-500 mt-1">Gestión de productos y existencias</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Módulo activo</p>
          <p className="text-sm font-medium text-gray-900">Inventario</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <nav className="flex space-x-8 px-6 overflow-x-auto">
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
                {tab.badge && tab.badge > 0 && (
                  <span className="bg-red-100 text-red-600 py-1 px-2 rounded-full text-xs font-medium">
                    {tab.badge}
                  </span>
                )}
              </span>
            </button>
          ))}
        </nav>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'products' && <ProductsTab />}
          {activeTab === 'categories' && <CategoriesTab />}
          {activeTab === 'stock' && <StockTab />}
          {activeTab === 'movements' && <MovementsTab />}
          {activeTab === 'adjustments' && <AdjustmentsTab onAdjustmentCreated={fetchAlerts} />}
          {activeTab === 'alerts' && <AlertsTab />}
        </div>
      </div>
    </div>
  );
};

export default Inventory;
