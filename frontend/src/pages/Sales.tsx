import { useState, useEffect } from 'react';
import InvoicesTab from '../components/sales/InvoicesTab';
import QuotesTab from '../components/sales/QuotesTab';
import POSTab from '../components/sales/POSTab';
import CreditNotesTab from '../components/sales/CreditNotesTab';
import CancelledTab from '../components/sales/CancelledTab';
import { salesApi } from '../services/api';
import {
  HiDocumentText,
  HiPencil,
  HiReceiptTax,
  HiRefresh,
  HiFolder,
} from 'react-icons/hi';

type TabType = 'pos' | 'invoices' | 'quotes' | 'credit-notes' | 'cancelled';

const Sales = () => {
  const [activeTab, setActiveTab] = useState<TabType>('pos');
  const [cancelledCount, setCancelledCount] = useState(0);

  useEffect(() => {
    const fetchCancelledCount = async () => {
      try {
        const response = await salesApi.getCancelledInvoicesCount();
        setCancelledCount(response.count || 0);
      } catch (error) {
        console.error('Error fetching cancelled invoices count:', error);
      }
    };

    fetchCancelledCount();
    // Refresh count every 30 seconds
    const interval = setInterval(fetchCancelledCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const tabs = [
    { id: 'pos' as TabType, label: 'Punto de Venta', icon: HiReceiptTax },
    { id: 'invoices' as TabType, label: 'Facturas', icon: HiDocumentText },
    { id: 'quotes' as TabType, label: 'Cotizaciones', icon: HiPencil },
    { id: 'credit-notes' as TabType, label: 'Notas de Crédito', icon: HiRefresh },
    { 
      id: 'cancelled' as TabType, 
      label: 'Anulados', 
      icon: HiFolder,
      badge: cancelledCount > 0 ? cancelledCount : undefined,
    },
  ];

  return (
    <div className="p-4 md:p-6 space-y-4 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ventas</h1>
          <p className="text-sm text-gray-500 mt-1">Gestión de ventas y facturación</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Módulo activo</p>
          <p className="text-sm font-medium text-gray-900">Ventas</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <nav className="flex space-x-4 sm:space-x-8 px-3 sm:px-6 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
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
        <div className="p-3 sm:p-6">
          {activeTab === 'invoices' && <InvoicesTab />}
          {activeTab === 'quotes' && <QuotesTab />}
          {activeTab === 'pos' && <POSTab />}
          {activeTab === 'credit-notes' && <CreditNotesTab />}
          {activeTab === 'cancelled' && <CancelledTab />}
        </div>
      </div>
    </div>
  );
};

export default Sales;
