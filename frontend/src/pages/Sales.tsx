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

type TabType = 'invoices' | 'quotes' | 'pos' | 'credit-notes' | 'cancelled';

const Sales = () => {
  const [activeTab, setActiveTab] = useState<TabType>('invoices');
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
    { id: 'invoices' as TabType, label: 'Facturas', icon: HiDocumentText },
    { id: 'quotes' as TabType, label: 'Cotizaciones', icon: HiPencil },
    { id: 'pos' as TabType, label: 'Punto de Venta', icon: HiReceiptTax },
    { id: 'credit-notes' as TabType, label: 'Notas de Crédito', icon: HiRefresh },
    { 
      id: 'cancelled' as TabType, 
      label: 'Anulados', 
      icon: HiFolder,
      badge: cancelledCount > 0 ? cancelledCount : undefined,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Ventas</h1>
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
              <div className="flex items-center">
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.label}
                {tab.badge && tab.badge > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                    {tab.badge}
                  </span>
                )}
              </div>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'invoices' && <InvoicesTab />}
        {activeTab === 'quotes' && <QuotesTab />}
        {activeTab === 'pos' && <POSTab />}
        {activeTab === 'credit-notes' && <CreditNotesTab />}
        {activeTab === 'cancelled' && <CancelledTab />}
      </div>
    </div>
  );
};

export default Sales;
