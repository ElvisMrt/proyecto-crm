import { useState, useEffect } from 'react';
import { receivablesApi, branchesApi } from '../services/api';
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

interface NavigationState {
  targetTab: TabType;
  clientId?: string;
  invoiceId?: string;
  invoiceIds?: string[];
}

const Receivables = () => {
  const [activeTab, setActiveTab] = useState<TabType>('overdue');
  const [summary, setSummary] = useState<any>(null);
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [navigationState, setNavigationState] = useState<NavigationState | null>(null);

  useEffect(() => {
    fetchBranches();
    fetchSummary();
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [selectedBranchId]);

  // Handle navigation between tabs
  useEffect(() => {
    if (navigationState) {
      setActiveTab(navigationState.targetTab);
      setNavigationState(null); // Clear after navigation
    }
  }, [navigationState]);

  const fetchBranches = async () => {
    try {
      const response = await branchesApi.getBranches();
      const branchesData = response?.data || response || [];
      setBranches(branchesData);
      if (branchesData.length > 0) {
        setSelectedBranchId(branchesData[0].id);
      }
    } catch (error: any) {
      // Si falla por permisos, intentar con el endpoint directo
      if (error.response?.status === 403 || error.response?.status === 401) {
        try {
          const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
          const token = localStorage.getItem('token');
          const directResponse = await fetch(`${API_BASE_URL}/branches`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          
          if (directResponse.ok) {
            const data = await directResponse.json();
            const branchesData = data?.data || data || [];
            setBranches(branchesData);
            if (branchesData.length > 0) {
              setSelectedBranchId(branchesData[0].id);
            }
          }
        } catch (err) {
          console.error('Error fetching branches:', err);
        }
      } else {
        console.error('Error fetching branches:', error);
      }
    }
  };

  const fetchSummary = async () => {
    try {
      const params: any = {};
      if (selectedBranchId) {
        params.branchId = selectedBranchId;
      }
      const data = await receivablesApi.getSummary(params);
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
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">Sucursal:</label>
          <select
            value={selectedBranchId}
            onChange={(e) => setSelectedBranchId(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Todas</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
        </div>
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
              <HiCurrencyDollar className="w-10 h-10 text-green-500" />
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
              <HiClock className="w-10 h-10 text-red-500" />
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
              <HiQuestionMarkCircle className="w-10 h-10 text-purple-500" />
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
              <HiChartBar className="w-10 h-10 text-gray-500" />
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
              <span className="inline-flex items-center">
                <tab.icon className="w-5 h-5 mr-2" />
                <span>{tab.label}</span>
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'status' && (
          <AccountStatusTab 
            branchId={selectedBranchId} 
            initialClientId={navigationState?.clientId}
            onNavigateToInvoice={(invoiceId) => {
              // Navigate to Sales module to view invoice
              window.location.href = `/sales/invoices/${invoiceId}`;
            }}
          />
        )}
        {activeTab === 'payments' && (
          <PaymentRegisterTab 
            branchId={selectedBranchId} 
            initialClientId={navigationState?.clientId}
            initialInvoiceIds={navigationState?.invoiceIds}
            onPaymentCreated={fetchSummary}
            onNavigateToStatus={(clientId) => {
              setNavigationState({ targetTab: 'status', clientId });
            }}
          />
        )}
        {activeTab === 'overdue' && (
          <OverdueInvoicesTab 
            branchId={selectedBranchId}
            onNavigateToPayment={(clientId, invoiceIds) => {
              setNavigationState({ targetTab: 'payments', clientId, invoiceIds });
            }}
            onNavigateToStatus={(clientId) => {
              setNavigationState({ targetTab: 'status', clientId });
            }}
          />
        )}
        {activeTab === 'history' && <PaymentHistoryTab branchId={selectedBranchId} />}
        {activeTab === 'summary' && <SummaryTab summary={summary} branchId={selectedBranchId} />}
      </div>
    </div>
  );
};

export default Receivables;
