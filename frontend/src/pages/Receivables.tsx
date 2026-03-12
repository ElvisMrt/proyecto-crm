import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  const [searchParams, setSearchParams] = useSearchParams();
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
    const tab = searchParams.get('tab') as TabType | null;
    const clientId = searchParams.get('clientId') || undefined;
    const invoiceIdsParam = searchParams.get('invoiceIds');
    const singleInvoiceId = searchParams.get('invoiceId');
    const invoiceIds = invoiceIdsParam
      ? invoiceIdsParam.split(',').filter(Boolean)
      : singleInvoiceId
        ? [singleInvoiceId]
        : undefined;

    if (tab) {
      setActiveTab(tab);
    }

    if (tab || clientId || invoiceIds?.length) {
      setNavigationState({
        targetTab: tab || 'payments',
        clientId,
        invoiceIds,
        invoiceId: singleInvoiceId || undefined,
      });
    }
  }, [searchParams]);

  useEffect(() => {
    fetchSummary();
  }, [selectedBranchId]);

  // Handle navigation between tabs
  useEffect(() => {
    if (navigationState) {
      setActiveTab(navigationState.targetTab);
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
          const API_BASE_URL = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.host}/api/v1`;
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
    <div className="space-y-5">
      <div className="flex flex-col gap-4 rounded-[28px] border border-slate-200 bg-white/85 px-5 py-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] backdrop-blur dark:border-slate-800 dark:bg-slate-950/80 dark:shadow-[0_18px_50px_rgba(2,6,23,0.45)] sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">Cartera</p>
          <h1 className="text-xl font-bold text-slate-950 dark:text-white sm:text-2xl">Cuentas por Cobrar</h1>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 sm:text-sm">Cobros, estados de cuenta y seguimiento de vencidos</p>
        </div>
        <div className="flex flex-col gap-1 sm:items-end">
          <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
            Sucursal
          </label>
          <select
            value={selectedBranchId}
            onChange={(e) => setSelectedBranchId(e.target.value)}
            className="text-sm w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-slate-500 dark:focus:ring-slate-800 sm:min-w-[220px]"
          >
            <option value="">Todas las sucursales</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Dashboard Grid con KPIs */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="rounded-[24px] border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:p-5">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="rounded-2xl bg-slate-100 p-1.5 text-slate-700 dark:bg-slate-900 dark:text-slate-200 sm:p-2">
                <HiCurrencyDollar className="w-4 h-4 sm:w-6 sm:h-6" />
              </div>
              <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 sm:text-xs">Por cobrar</span>
            </div>
            <p className="truncate text-base font-bold text-slate-950 dark:text-white sm:text-2xl">{formatCurrency(summary.totalReceivable || 0)}</p>
          </div>
          <div className="rounded-[24px] border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:p-5">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="rounded-2xl bg-rose-50 p-1.5 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 sm:p-2">
                <HiExclamationCircle className="w-4 h-4 sm:w-6 sm:h-6" />
              </div>
              <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 sm:text-xs">Vencido</span>
            </div>
            <p className="truncate text-base font-bold text-rose-700 sm:text-2xl">{formatCurrency(summary.totalOverdue || 0)}</p>
          </div>
          <div className="rounded-[24px] border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:p-5">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="rounded-2xl bg-amber-50 p-1.5 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 sm:p-2">
                <HiClock className="w-4 h-4 sm:w-6 sm:h-6" />
              </div>
              <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 sm:text-xs">Morosos</span>
            </div>
            <p className="text-base font-bold text-amber-700 sm:text-2xl">{summary.delinquentClients || 0}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">clientes</p>
          </div>
          <div className="rounded-[24px] border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:p-5">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="rounded-2xl bg-slate-100 p-1.5 text-slate-700 dark:bg-slate-900 dark:text-slate-200 sm:p-2">
                <HiChartBar className="w-4 h-4 sm:w-6 sm:h-6" />
              </div>
              <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 sm:text-xs">0-30 días</span>
            </div>
            <p className="truncate text-base font-bold text-slate-950 dark:text-white sm:text-2xl">{formatCurrency(summary.byAge?.['0-30'] || 0)}</p>
          </div>
        </div>
      )}

      {activeTab === 'summary' && topDebtors && topDebtors.length > 0 && (
        <div className="rounded-[28px] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="border-b border-slate-200 px-6 py-4">
            <div className="flex items-center">
              <HiExclamationCircle className="mr-2 h-5 w-5 text-rose-700" />
              <h3 className="text-lg font-semibold text-slate-950 dark:text-white">Top deudores</h3>
            </div>
          </div>
          <div className="overflow-y-auto max-h-96">
            {topDebtors.slice(0, 10).map((debtor: any, index: number) => {
              const overduePercentage = debtor.totalBalance > 0 
                ? (debtor.overdueBalance / debtor.totalBalance) * 100 
                : 0;
              const getRankColor = (pos: number) => {
                if (pos === 0) return 'bg-slate-950';
                if (pos === 1) return 'bg-slate-700';
                if (pos === 2) return 'bg-slate-500';
                return 'bg-slate-300';
              };
              
              return (
                <div 
                  key={debtor.clientId} 
                  className="cursor-pointer border-b border-slate-100 px-4 py-3 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900"
                  onClick={() => {
                    setNavigationState({ targetTab: 'status', clientId: debtor.clientId });
                  }}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`w-6 h-6 rounded-full ${getRankColor(index)} flex items-center justify-center flex-shrink-0`}>
                      <span className="text-white text-sm font-bold">{index + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-950 dark:text-white">{debtor.clientName}</p>
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-500 dark:text-slate-400">Total:</span>
                          <span className="font-semibold text-slate-950 dark:text-white">{formatCurrency(debtor.totalBalance)}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-500 dark:text-slate-400">Vencido:</span>
                          <span className="font-semibold text-rose-700">{formatCurrency(debtor.overdueBalance)}</span>
                        </div>
                        <div className="mt-2 h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800">
                          <div 
                            className="h-full rounded-full bg-slate-900"
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
            <div className="border-t border-slate-200 bg-slate-50 px-6 py-3 text-center dark:border-slate-800 dark:bg-slate-900/80">
              <button
                onClick={() => setActiveTab('overdue')}
                className="text-sm font-medium text-slate-700 transition hover:text-slate-950 dark:text-slate-300 dark:hover:text-white"
              >
                Ver todos ({topDebtors.length}) →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="rounded-[28px] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <nav className="flex overflow-x-auto border-b border-slate-200 px-2 sm:px-6 scrollbar-hide dark:border-slate-800">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex-shrink-0 py-3 sm:py-4 px-2 sm:px-0 sm:mr-8 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap transition-colors
                ${
                  activeTab === tab.id
                    ? 'border-slate-950 text-slate-950 dark:border-white dark:text-white'
                    : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:text-slate-100'
                }
              `}
              title={tab.label}
            >
              <span className="inline-flex items-center gap-1.5">
                <tab.icon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden text-[11px]">{tab.label.split(' ')[0]}</span>
              </span>
            </button>
          ))}
        </nav>

        {/* Tab Content */}
        <div className="p-3 sm:p-6">
          {activeTab === 'status' && (
            <AccountStatusTab 
              branchId={selectedBranchId} 
              initialClientId={navigationState?.clientId}
              onNavigateToInvoice={(invoiceId) => {
                // Navigate to Sales module to view invoice
                window.location.href = `/sales/invoices/${invoiceId}`;
              }}
              onNavigateToPayment={(clientId, invoiceIds) => {
                setActiveTab('payments');
                setNavigationState({ targetTab: 'payments', clientId, invoiceIds });
                setSearchParams({
                  tab: 'payments',
                  clientId,
                  invoiceIds: invoiceIds.join(','),
                });
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
