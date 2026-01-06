import { useEffect, useState } from 'react';
import { cashApi } from '../../services/api';

const DailySummaryTab = () => {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchSummary();
  }, [selectedDate]);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const data = await cashApi.getDailySummary({ date: selectedDate });
      setSummary(data);
    } catch (error) {
      console.error('Error fetching daily summary:', error);
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


  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Cargando resumen diario...</p>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
        No hay datos disponibles para esta fecha
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Selector de Fecha */}
      <div className="bg-white rounded-lg shadow p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Seleccionar Fecha
        </label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Resumen General */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ventas</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {formatCurrency(summary.salesTotal || 0)}
              </p>
            </div>
            <div className="text-5xl">💰</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pagos Recibidos</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {formatCurrency(summary.paymentsTotal || 0)}
              </p>
            </div>
            <div className="text-5xl">💳</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Entradas Manuales</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {formatCurrency(summary.manualEntriesTotal || 0)}
              </p>
            </div>
            <div className="text-5xl">➕</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Salidas Manuales</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {formatCurrency(summary.manualExitsTotal || 0)}
              </p>
            </div>
            <div className="text-5xl">➖</div>
          </div>
        </div>
      </div>

      {/* Balance Neto */}
      <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Balance Neto del Día</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {formatCurrency(summary.netTotal || 0)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {summary.branch || 'Todas las sucursales'}
            </p>
          </div>
          <div className="text-5xl">📊</div>
        </div>
      </div>

      {/* Aperturas y Cierres */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Aperturas</h3>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(summary.openingTotal || 0)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Cierres</h3>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(summary.closingTotal || 0)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default DailySummaryTab;


