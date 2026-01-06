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
} from 'react-icons/hi';

type TabType = 'open' | 'movements' | 'close' | 'history' | 'summary';

const Cash = () => {
  const [activeTab, setActiveTab] = useState<TabType>('summary');
  const [currentCash, setCurrentCash] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCurrentCash();
  }, []);

  const fetchCurrentCash = async () => {
    try {
      setLoading(true);
      const data = await cashApi.getCurrentCash();
      setCurrentCash(data);
    } catch (error: any) {
      if (error.response?.status !== 404) {
        console.error('Error fetching current cash:', error);
      }
      setCurrentCash(null);
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Caja</h1>
      </div>

      {/* Estado de Caja Actual */}
      {!loading && (
        <div className={`rounded-lg shadow-md p-6 border-l-4 ${
          currentCash 
            ? 'bg-green-50 border-green-500' 
            : 'bg-red-50 border-red-500'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Estado de Caja</p>
              <p className={`text-2xl font-bold mt-1 flex items-center ${
                currentCash ? 'text-green-700' : 'text-red-700'
              }`}>
                {currentCash ? (
                  <>
                    <HiLockOpen className="w-6 h-6 mr-2" />
                    Caja Abierta
                  </>
                ) : (
                  <>
                    <HiLockClosed className="w-6 h-6 mr-2" />
                    Caja Cerrada
                  </>
                )}
              </p>
              {currentCash && (
                <div className="mt-2 space-y-1">
                  <p className="text-sm text-gray-600">
                    Sucursal: <span className="font-medium">{currentCash.branch?.name || 'N/A'}</span>
                  </p>
                  <p className="text-sm text-gray-600">
                    Balance Actual: <span className="font-bold text-lg">{formatCurrency(currentCash.currentBalance || 0)}</span>
                  </p>
                  <p className="text-xs text-gray-500">
                    Abierta por: {currentCash.openedBy?.name || 'N/A'} el {new Date(currentCash.openedAt).toLocaleDateString('es-DO')}
                  </p>
                </div>
              )}
            </div>
            {currentCash && (
              <div className="text-right">
                <div className="text-sm text-gray-600">Ingresos</div>
                <div className="text-xl font-bold text-green-600">
                  {formatCurrency(currentCash.summary?.totalIncome || 0)}
                </div>
                <div className="text-sm text-gray-600 mt-2">Egresos</div>
                <div className="text-xl font-bold text-red-600">
                  {formatCurrency(currentCash.summary?.totalExpenses || 0)}
                </div>
              </div>
            )}
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
        {activeTab === 'open' && <OpenCashTab onCashOpened={fetchCurrentCash} currentCash={currentCash} />}
        {activeTab === 'movements' && <MovementsTab currentCash={currentCash} onMovementCreated={fetchCurrentCash} />}
        {activeTab === 'close' && <CloseCashTab currentCash={currentCash} onCashClosed={fetchCurrentCash} />}
        {activeTab === 'history' && <HistoryTab />}
        {activeTab === 'summary' && <DailySummaryTab />}
      </div>
    </div>
  );
};

export default Cash;
