import { useEffect, useState } from 'react';
import { receivablesApi } from '../../services/api';

interface SummaryData {
  totalReceivable: number;
  totalOverdue: number;
  delinquentClients: number;
  totalClientsWithReceivables: number;
  byAge: {
    '0-30': number;
    '31-60': number;
    '61-90': number;
    '90+': number;
  };
  overdueCount: number;
  totalInvoices: number;
}

const SummaryTab = ({ summary: initialSummary }: { summary: SummaryData | null }) => {
  const [summary, setSummary] = useState<SummaryData | null>(initialSummary);
  const [loading, setLoading] = useState(!initialSummary);

  useEffect(() => {
    if (!initialSummary) {
      fetchSummary();
    }
  }, []);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const data = await receivablesApi.getSummary();
      setSummary(data);
    } catch (error) {
      console.error('Error fetching summary:', error);
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
        <p className="mt-4 text-gray-600">Cargando resumen...</p>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
        No hay datos disponibles
      </div>
    );
  }

  const overduePercentage = summary.totalReceivable > 0
    ? ((summary.totalOverdue / summary.totalReceivable) * 100).toFixed(1)
    : 0;

  return (
    <div className="space-y-6">
      {/* Resumen General */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total por Cobrar</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {formatCurrency(summary.totalReceivable)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {summary.totalInvoices} factura{summary.totalInvoices !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="text-5xl">💰</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Vencido</p>
              <p className="text-3xl font-bold text-red-600 mt-2">
                {formatCurrency(summary.totalOverdue)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {overduePercentage}% del total
              </p>
            </div>
            <div className="text-5xl">⏰</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Clientes Morosos</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">
                {summary.delinquentClients}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                de {summary.totalClientsWithReceivables} clientes
              </p>
            </div>
            <div className="text-5xl">❓</div>
          </div>
        </div>
      </div>

      {/* Antigüedad de Saldos */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Antigüedad de Saldos Vencidos</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border-l-4 border-orange-500">
            <div className="flex items-center">
              <span className="text-2xl mr-3">📅</span>
              <div>
                <p className="font-medium text-gray-900">0-30 Días</p>
                <p className="text-sm text-gray-600">Facturas vencidas recientes</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(summary.byAge['0-30'])}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border-l-4 border-red-500">
            <div className="flex items-center">
              <span className="text-2xl mr-3">⚠️</span>
              <div>
                <p className="font-medium text-gray-900">31-60 Días</p>
                <p className="text-sm text-gray-600">Facturas con mora moderada</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(summary.byAge['31-60'])}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-red-100 rounded-lg border-l-4 border-red-600">
            <div className="flex items-center">
              <span className="text-2xl mr-3">🔴</span>
              <div>
                <p className="font-medium text-gray-900">61-90 Días</p>
                <p className="text-sm text-gray-600">Facturas con mora alta</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(summary.byAge['61-90'])}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-red-200 rounded-lg border-l-4 border-red-700">
            <div className="flex items-center">
              <span className="text-2xl mr-3">🚨</span>
              <div>
                <p className="font-medium text-gray-900">Más de 90 Días</p>
                <p className="text-sm text-gray-600">Facturas con mora crítica</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(summary.byAge['90+'])}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico de Barras Simple */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Distribución por Antigüedad</h2>
        <div className="space-y-3">
          {Object.entries(summary.byAge).map(([range, amount]) => {
            const maxAmount = Math.max(...Object.values(summary.byAge));
            const percentage = maxAmount > 0 ? (amount / maxAmount) * 100 : 0;
            
            return (
              <div key={range}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700">{range} días</span>
                  <span className="font-medium text-gray-900">{formatCurrency(amount)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className="bg-blue-500 h-4 rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SummaryTab;



