import { useState, useEffect } from 'react';
import { cashApi } from '../services/api';
import OpenCashTab from '../components/cash/OpenCashTab';
import MovementsTab from '../components/cash/MovementsTab';
import CloseCashTab from '../components/cash/CloseCashTab';
import HistoryTab from '../components/cash/HistoryTab';
import DailySummaryTab from '../components/cash/DailySummaryTab';
import {
  HiLockOpen,
  HiRefresh,
  HiLockClosed,
  HiFolder,
  HiChartBar,
  HiCash,
  HiTrendingUp,
  HiTrendingDown,
} from 'react-icons/hi';
import { MinimalStatCard } from '../components/MinimalStatCard';

type TabType = 'open' | 'movements' | 'close' | 'history' | 'summary';

const Cash = () => {
  const [activeTab, setActiveTab] = useState<TabType>('open');
  const [currentCash, setCurrentCash] = useState<any[]>([]);
  const [selectedCashId, setSelectedCashId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCurrentCash();
  }, []);

  const fetchCurrentCash = async () => {
    try {
      setLoading(true);
      const data = await cashApi.getCurrentCash();
      // Handle both array response and legacy single object response
      const cashArray = Array.isArray(data) ? data : (data ? [data] : []);
      setCurrentCash(cashArray);
      setSelectedCashId((prev) => {
        if (cashArray.length === 0) return '';
        if (prev && cashArray.some((cash) => cash.id === prev)) return prev;
        return cashArray[0].id;
      });
    } catch (error: any) {
      if (error.response?.status !== 404) {
        console.error('Error fetching current cash:', error);
      }
      setCurrentCash([]);
    } finally {
      setLoading(false);
    }
  };

  const selectedCash = currentCash.find((cash) => cash.id === selectedCashId) || currentCash[0] || null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const tabs = [
    { id: 'open' as TabType, label: 'Apertura de Caja', icon: HiLockOpen },
    { id: 'movements' as TabType, label: 'Movimientos', icon: HiRefresh },
    { id: 'close' as TabType, label: 'Cierre de Caja', icon: HiLockClosed },
    { id: 'history' as TabType, label: 'Historial', icon: HiFolder },
    { id: 'summary' as TabType, label: 'Resumen Diario', icon: HiChartBar },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-[28px] border border-slate-200 bg-white/85 px-5 py-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] backdrop-blur dark:border-slate-800 dark:bg-slate-950/85 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">Operación</p>
          <h1 className="text-xl font-bold text-slate-950 dark:text-white sm:text-2xl">Caja</h1>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 sm:text-sm">Apertura, movimientos y cierre diario</p>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-xs text-slate-500 dark:text-slate-400">Cajas activas</p>
          <p className="text-sm font-medium text-slate-950 dark:text-white">{currentCash.length}</p>
        </div>
      </div>

      {!loading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="rounded-[24px] border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className={`${currentCash.length > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'} rounded-2xl p-1.5 sm:p-2`}>
                {currentCash.length > 0 ? (
                  <HiLockOpen className="w-4 h-4 sm:w-6 sm:h-6" />
                ) : (
                  <HiLockClosed className="w-4 h-4 sm:w-6 sm:h-6" />
                )}
              </div>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Estado</span>
            </div>
            <p className="text-xl font-bold text-slate-950 dark:text-white sm:text-3xl">{currentCash.length}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
              {currentCash.length > 0 ? `${currentCash.length} activa${currentCash.length > 1 ? 's' : ''}` : 'Ninguna abierta'}
            </p>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="rounded-2xl bg-slate-100 p-1.5 text-slate-700 sm:p-2">
                <HiCash className="w-4 h-4 sm:w-6 sm:h-6" />
              </div>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Balance</span>
            </div>
            <p className="truncate text-base font-bold text-slate-950 dark:text-white sm:text-3xl">
              {formatCurrency(currentCash.reduce((sum, cash) => sum + (cash.currentBalance || 0), 0))}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 sm:text-sm">Total</p>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="rounded-2xl bg-emerald-50 p-1.5 text-emerald-700 sm:p-2">
                <HiTrendingUp className="w-4 h-4 sm:w-6 sm:h-6" />
              </div>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Ingresos</span>
            </div>
            <p className="truncate text-base font-bold text-emerald-700 sm:text-3xl">
              {formatCurrency(currentCash.reduce((sum, cash) => sum + (cash.totalIncome || 0), 0))}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 sm:text-sm">Hoy</p>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="rounded-2xl bg-rose-50 p-1.5 text-rose-700 sm:p-2">
                <HiTrendingDown className="w-4 h-4 sm:w-6 sm:h-6" />
              </div>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Egresos</span>
            </div>
            <p className="truncate text-base font-bold text-rose-700 sm:text-3xl">
              {formatCurrency(currentCash.reduce((sum, cash) => sum + (cash.totalExpenses || 0), 0))}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 sm:text-sm">Hoy</p>
          </div>
        </div>
      )}

      {!loading && currentCash.length > 1 && (
        <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
            Caja activa
          </label>
          <select
            value={selectedCashId}
            onChange={(e) => setSelectedCashId(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-700 outline-none transition focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:focus:border-slate-500 dark:focus:bg-slate-900 sm:w-auto"
          >
            {currentCash.map((cash) => (
              <option key={cash.id} value={cash.id}>
                {cash.branch?.name || 'Caja sin sucursal'} - {formatCurrency(cash.currentBalance || 0)}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Tabs */}
      <div className="rounded-[28px] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <nav className="flex overflow-x-auto border-b border-slate-200 px-2 dark:border-slate-800 sm:px-6 scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex-shrink-0 py-3 sm:py-4 px-2 sm:px-0 sm:mr-8 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap transition-colors
                ${
                  activeTab === tab.id
                    ? 'border-slate-950 text-slate-950 dark:border-white dark:text-white'
                    : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:text-white'
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
          {activeTab === 'open' && <OpenCashTab onCashOpened={fetchCurrentCash} currentCash={currentCash} />}
          {activeTab === 'movements' && <MovementsTab currentCash={selectedCash} onMovementCreated={fetchCurrentCash} />}
          {activeTab === 'close' && <CloseCashTab currentCash={selectedCash} onCashClosed={fetchCurrentCash} />}
          {activeTab === 'history' && <HistoryTab />}
          {activeTab === 'summary' && <DailySummaryTab />}
        </div>
      </div>
    </div>
  );
};

export default Cash;
