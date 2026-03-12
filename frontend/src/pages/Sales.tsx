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
    <div className="min-h-screen space-y-5 bg-[radial-gradient(circle_at_top_left,_rgba(226,232,240,0.55),_transparent_32%),linear-gradient(180deg,_#f8fafc_0%,_#f3f4f6_100%)] p-1 dark:bg-[radial-gradient(circle_at_top_left,_rgba(71,85,105,0.22),_transparent_28%),linear-gradient(180deg,_#020617_0%,_#0f172a_100%)]">
      <div className="rounded-[28px] border border-white/70 bg-white/80 shadow-[0_22px_70px_-36px_rgba(15,23,42,0.45)] backdrop-blur dark:border-slate-800 dark:bg-slate-950/85">
        <div className="flex flex-col gap-4 border-b border-slate-200/80 px-5 py-5 dark:border-slate-800 sm:px-8 sm:py-7 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
              Comercial
            </span>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-3xl">Ventas</h1>
              <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
                Punto de venta, facturación, cotizaciones y documentos anulados en una misma vista operativa.
              </p>
            </div>
          </div>
        </div>

        <div className="px-3 py-3 sm:px-6">
          <nav className="flex flex-wrap gap-2 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                inline-flex flex-shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-xs font-medium whitespace-nowrap transition-all sm:text-sm
                ${
                  activeTab === tab.id
                    ? 'border-slate-900 bg-slate-900 text-white shadow-sm dark:border-white dark:bg-white dark:text-slate-950'
                    : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:text-white'
                }
              `}
              title={tab.label}
            >
              <span className="inline-flex items-center gap-1.5">
                <tab.icon className="h-4 w-4 flex-shrink-0 sm:h-5 sm:w-5" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="text-[11px] sm:hidden">{tab.label.split(' ')[0]}</span>
                {tab.badge && tab.badge > 0 && (
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium sm:text-xs ${
                    activeTab === tab.id ? 'bg-white/15 text-white dark:bg-slate-200/20 dark:text-slate-950' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </span>
            </button>
          ))}
          </nav>
        </div>

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
