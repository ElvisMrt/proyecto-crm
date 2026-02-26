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
} from 'react-icons/hi';
import { MinimalStatCard } from '../components/MinimalStatCard';

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
  const [topDebtors, setTopDebtors] = useState<any[]>([]);

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
          const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';
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
      
      // Extract top debtors from summary
      if (data?.topDebtors) {
        setTopDebtors(data.topDebtors);
      }
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
    <div className="p-4 md:p-6 space-y-4 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cuentas por Cobrar</h1>
          <p className="text-sm text-gray-500 mt-1">Gestión de cobros y deudores</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Sucursal activa</p>
          <p className="text-sm font-medium text-gray-900">
            {branches.find(b => b.id === selectedBranchId)?.name || 'Todas'}
          </p>
        </div>
      </div>

      {/* Selector de Sucursal */}
      <div className="mb-6">
        <select
          value={selectedBranchId}
          onChange={(e) => setSelectedBranchId(e.target.value)}
          className="text-sm px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
        >
          <option value="">Todas las sucursales</option>
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branch.name}
            </option>
          ))}
        </select>
      </div>

      {/* Dashboard Grid con KPIs y Deudores */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-blue-100 rounded-lg p-2">
                <HiCurrencyDollar className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-xs font-medium text-gray-500">Por Cobrar</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.totalReceivable || 0)}</p>
          </div>
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-red-100 rounded-lg p-2">
                <HiExclamationCircle className="w-6 h-6 text-red-600" />
              </div>
              <span className="text-xs font-medium text-gray-500">Vencido</span>
            </div>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(summary.totalOverdue || 0)}</p>
          </div>
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-orange-100 rounded-lg p-2">
                <HiClock className="w-6 h-6 text-orange-600" />
              </div>
              <span className="text-xs font-medium text-gray-500">Morosos</span>
            </div>
            <p className="text-2xl font-bold text-orange-600">{summary.delinquentClients || 0}</p>
            <p className="text-sm text-gray-500">clientes</p>
          </div>
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-purple-100 rounded-lg p-2">
                <HiChartBar className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-xs font-medium text-gray-500">0-30 Días</span>
            </div>
            <p className="text-2xl font-bold text-purple-600">{formatCurrency(summary.byAge?.['0-30'] || 0)}</p>
          </div>
        </div>
      )}

      {/* Top Deudores */}
      {topDebtors && topDebtors.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <HiExclamationCircle className="w-5 h-5 text-red-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Top Deudores</h3>
            </div>
          </div>
          <div className="overflow-y-auto max-h-96">
            {topDebtors.slice(0, 10).map((debtor: any, index: number) => {
              const overduePercentage = debtor.totalBalance > 0 
                ? (debtor.overdueBalance / debtor.totalBalance) * 100 
                : 0;
              const getRankColor = (pos: number) => {
                if (pos === 0) return 'bg-red-500';
                if (pos === 1) return 'bg-orange-500';
                if (pos === 2) return 'bg-yellow-500';
                return 'bg-gray-400';
              };
              
              return (
                <div 
                  key={debtor.clientId} 
                  className="px-4 py-3 border-b border-gray-100 hover:bg-blue-50 transition-colors cursor-pointer"
                  onClick={() => {
                    setNavigationState({ targetTab: 'status', clientId: debtor.clientId });
                  }}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`w-6 h-6 rounded-full ${getRankColor(index)} flex items-center justify-center flex-shrink-0`}>
                      <span className="text-white text-sm font-bold">{index + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{debtor.clientName}</p>
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Total:</span>
                          <span className="font-semibold text-gray-900">{formatCurrency(debtor.totalBalance)}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Vencido:</span>
                          <span className="font-semibold text-red-600">{formatCurrency(debtor.overdueBalance)}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div 
                            className="h-full bg-red-500 rounded-full"
                            style={{ width: `${overduePercentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {topDebtors.length > 10 && (
            <div className="px-6 py-3 bg-gray-50 text-center border-t border-gray-200">
              <button
                onClick={() => setActiveTab('overdue')}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Ver todos ({topDebtors.length}) →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <nav className="flex space-x-8 px-6 overflow-x-auto">
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
              </span>
            </button>
          ))}
        </nav>

        {/* Tab Content */}
        <div className="p-6">
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
    </div>
  );
};

export default Receivables;
