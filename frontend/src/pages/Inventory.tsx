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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Inventario</h1>
        {alerts.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2">
            <span className="text-sm font-medium text-red-800">
              <HiExclamationCircle className="inline w-4 h-4 mr-1" />
              {alerts.length} producto{alerts.length !== 1 ? 's' : ''} con stock bajo
            </span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm transition-colors relative
                ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <span className="inline-flex items-center">
                <tab.icon className="w-5 h-5 mr-2" />
                <span>{tab.label}</span>
                {tab.badge && tab.badge > 0 && (
                  <span className="ml-2 bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5 min-w-[20px] text-center">
                    {tab.badge}
                  </span>
                )}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'products' && <ProductsTab />}
        {activeTab === 'categories' && <CategoriesTab />}
        {activeTab === 'stock' && <StockTab />}
        {activeTab === 'movements' && <MovementsTab />}
        {activeTab === 'adjustments' && <AdjustmentsTab onAdjustmentCreated={fetchAlerts} />}
        {activeTab === 'alerts' && <AlertsTab />}
      </div>
    </div>
  );
};

export default Inventory;
