import { useState, useEffect } from 'react';
import { receivablesApi } from '../services/api';
import AccountStatusTab from '../components/receivables/AccountStatusTab';
import PaymentRegisterTab from '../components/receivables/PaymentRegisterTab';
import OverdueInvoicesTab from '../components/receivables/OverdueInvoicesTab';
import PaymentHistoryTab from '../components/receivables/PaymentHistoryTab';
import SummaryTab from '../components/receivables/SummaryTab';
import {
  HiDocumentText,
  HiCash,
  HiClock,
  HiReceiptTax,
  HiChartBar,
  HiCurrencyDollar,
  HiExclamationCircle,
  HiQuestionMarkCircle,
} from 'react-icons/hi';

type TabType = 'status' | 'payments' | 'overdue' | 'history' | 'summary';

const Receivables = () => {
  const [activeTab, setActiveTab] = useState<TabType>('overdue');
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      const data = await receivablesApi.getSummary();
      setSummary(data);
    } catch (error) {
      console.error('Error fetching summary:', error);
    }
  };

  const tabs = [
    { id: 'status' as TabType, label: 'Estado de Cuenta', icon: HiDocumentText },
    { id: 'payments' as TabType, label: 'Registro de Pagos', icon: HiCash },
    { id: 'overdue' as TabType, label: 'Facturas Vencidas', icon: HiClock },
    { id: 'history' as TabType, label: 'Historial de Pagos', icon: HiReceiptTax },
    { id: 'summary' as TabType, label: 'Resumen de CxC', icon: HiChartBar },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Cuentas por Cobrar</h1>
      </div>

      {/* KPI Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total por Cobrar</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(summary.totalReceivable || 0)}
                </p>
              </div>
              <HiCurrencyDollar className="w-10 h-10 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Vencido</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(summary.totalOverdue || 0)}
                </p>
              </div>
              <HiClock className="w-10 h-10 text-red-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Clientes Morosos</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {summary.delinquentClients || 0}
                </p>
              </div>
              <HiQuestionMarkCircle className="w-10 h-10 text-purple-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-gray-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Vencidas 0-30 Días</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(summary.byAge?.['0-30'] || 0)}
                </p>
              </div>
              <HiChartBar className="w-10 h-10 text-gray-600" />
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'status' && <AccountStatusTab />}
        {activeTab === 'payments' && <PaymentRegisterTab onPaymentCreated={fetchSummary} />}
        {activeTab === 'overdue' && <OverdueInvoicesTab />}
        {activeTab === 'history' && <PaymentHistoryTab />}
        {activeTab === 'summary' && <SummaryTab summary={summary} />}
      </div>
    </div>
  );
};

export default Receivables;
