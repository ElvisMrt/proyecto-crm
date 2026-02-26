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
    } catch (error: any) {
      if (error.response?.status !== 404) {
        console.error('Error fetching current cash:', error);
      }
      setCurrentCash([]);
    } finally {
      setLoading(false);
    }
  };

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
    <div className="p-4 md:p-6 space-y-4 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Caja</h1>
          <p className="text-sm text-gray-500 mt-1">Gestión de cajas y movimientos</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Cajas activas</p>
          <p className="text-sm font-medium text-gray-900">{currentCash.length}</p>
        </div>
      </div>

      {/* KPI Cards */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className={`${currentCash.length > 0 ? 'bg-green-100' : 'bg-red-100'} rounded-lg p-2`}>
                {currentCash.length > 0 ? (
                  <HiLockOpen className="w-6 h-6 text-green-600" />
                ) : (
                  <HiLockClosed className="w-6 h-6 text-red-600" />
                )}
              </div>
              <span className="text-xs font-medium text-gray-500">Estado</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{currentCash.length}</p>
            <p className="text-sm text-gray-500">
              {currentCash.length > 0 ? `${currentCash.length} activa${currentCash.length > 1 ? 's' : ''}` : 'Ninguna abierta'}
            </p>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-blue-100 rounded-lg p-2">
                <HiCash className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-xs font-medium text-gray-500">Balance</span>
            </div>
            <p className="text-3xl font-bold text-blue-600">
              {formatCurrency(currentCash.reduce((sum, cash) => sum + (cash.currentBalance || 0), 0))}
            </p>
            <p className="text-sm text-gray-500">Total</p>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-green-100 rounded-lg p-2">
                <HiTrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-xs font-medium text-gray-500">Ingresos</span>
            </div>
            <p className="text-3xl font-bold text-green-600">
              {formatCurrency(currentCash.reduce((sum, cash) => sum + (cash.totalIncome || 0), 0))}
            </p>
            <p className="text-sm text-gray-500">Hoy</p>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-red-100 rounded-lg p-2">
                <HiTrendingDown className="w-6 h-6 text-red-600" />
              </div>
              <span className="text-xs font-medium text-gray-500">Egresos</span>
            </div>
            <p className="text-3xl font-bold text-red-600">
              {formatCurrency(currentCash.reduce((sum, cash) => sum + (cash.totalExpenses || 0), 0))}
            </p>
            <p className="text-sm text-gray-500">Hoy</p>
          </div>
        </div>
      )}

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
              </span>
            </button>
          ))}
        </nav>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'open' && <OpenCashTab onCashOpened={fetchCurrentCash} currentCash={currentCash} />}
          {activeTab === 'movements' && <MovementsTab currentCash={currentCash[0] || null} onMovementCreated={fetchCurrentCash} />}
          {activeTab === 'close' && <CloseCashTab currentCash={currentCash[0] || null} onCashClosed={fetchCurrentCash} />}
          {activeTab === 'history' && <HistoryTab />}
          {activeTab === 'summary' && <DailySummaryTab />}
        </div>
      </div>
    </div>
  );
};

export default Cash;
