import { useEffect, useState } from 'react';
import { receivablesApi } from '../../services/api';
import { exportToExcel, exportToPDF } from '../../utils/exportUtils';
import { HiDocumentDownload, HiTable } from 'react-icons/hi';

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
  topClients?: Array<{
    client: {
      id: string;
      name: string;
      identification: string;
    };
    totalReceivable: number;
    invoiceCount: number;
  }>;
}

interface SummaryTabProps {
  summary: SummaryData | null;
  branchId?: string;
}

const SummaryTab = ({ summary: initialSummary, branchId }: SummaryTabProps) => {
  const [summary, setSummary] = useState<SummaryData | null>(initialSummary);
  const [loading, setLoading] = useState(!initialSummary);

  useEffect(() => {
    if (!initialSummary) {
      fetchSummary();
    }
  }, []);

  useEffect(() => {
    if (initialSummary) {
      fetchSummary();
    }
  }, [branchId]);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (branchId) {
        params.branchId = branchId;
      }
      const data = await receivablesApi.getSummary(params);
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
            <div className="text-5xl text-gray-400">💰</div>
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
            <div className="text-5xl text-gray-400">⏰</div>
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
            <div className="text-5xl text-gray-400">❓</div>
          </div>
        </div>
      </div>

      {/* Antigüedad de Saldos */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Antigüedad de Saldos Vencidos</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border-l-4 border-orange-500">
            <div className="flex items-center">
              <span className="text-2xl mr-3 text-gray-400">📅</span>
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
              <span className="text-2xl mr-3 text-gray-400">⚠️</span>
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
              <span className="text-2xl mr-3 text-gray-400">🔴</span>
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
              <span className="text-2xl mr-3 text-gray-400">🚨</span>
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

      {/* Gráfico Circular y Distribución */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico Circular */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Distribución por Antigüedad</h2>
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  const exportData = Object.entries(summary.byAge).map(([range, amount]) => ({
                    'Rango de Días': range,
                    'Monto': amount,
                  }));
                  exportToExcel(exportData, 'Distribucion_Antiguedad', 'Distribución');
                }}
                className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded flex items-center space-x-1"
              >
                <HiTable className="w-4 h-4" />
                <span>Excel</span>
              </button>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <PieChart data={summary.byAge} />
          </div>
        </div>

        {/* Gráfico de Barras */}
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

      {/* Top 10 Clientes */}
      {summary.topClients && summary.topClients.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Top 10 Clientes por Saldo</h2>
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  const exportData = summary.topClients!.map((item, index) => ({
                    '#': index + 1,
                    'Cliente': item.client.name,
                    'Identificación': item.client.identification,
                    'Total por Cobrar': item.totalReceivable,
                    'Número de Facturas': item.invoiceCount,
                  }));
                  exportToExcel(exportData, 'Top_10_Clientes', 'Top 10 Clientes');
                }}
                className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded flex items-center space-x-1"
              >
                <HiTable className="w-4 h-4" />
                <span>Excel</span>
              </button>
              <button
                onClick={() => {
                  const exportData = summary.topClients!.map((item, index) => ({
                    '#': index + 1,
                    'Cliente': item.client.name,
                    'Identificación': item.client.identification,
                    'Total por Cobrar': item.totalReceivable,
                    'Número de Facturas': item.invoiceCount,
                  }));
                  exportToPDF(
                    exportData,
                    [
                      { header: '#', dataKey: '#' },
                      { header: 'Cliente', dataKey: 'Cliente' },
                      { header: 'Identificación', dataKey: 'Identificación' },
                      { header: 'Total por Cobrar', dataKey: 'Total por Cobrar' },
                      { header: 'Número de Facturas', dataKey: 'Número de Facturas' },
                    ],
                    'Top_10_Clientes',
                    'Top 10 Clientes por Saldo',
                    {
                      'Total por Cobrar': summary.topClients!.reduce((sum, item) => sum + item.totalReceivable, 0),
                      'Total Facturas': summary.topClients!.reduce((sum, item) => sum + item.invoiceCount, 0),
                    }
                  );
                }}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded flex items-center space-x-1"
              >
                <HiDocumentDownload className="w-4 h-4" />
                <span>PDF</span>
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Identificación</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total por Cobrar</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Facturas</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {summary.topClients.map((item, index) => (
                  <tr key={item.client.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{index + 1}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{item.client.name}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{item.client.identification}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                      {formatCurrency(item.totalReceivable)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-center">
                      {item.invoiceCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// Componente de Gráfico Circular (Pie Chart) usando SVG
const PieChart = ({ data }: { data: { '0-30': number; '31-60': number; '61-90': number; '90+': number } }) => {
  const size = 200;
  const radius = 80;
  const center = size / 2;
  
  const colors = {
    '0-30': '#f97316', // orange
    '31-60': '#ef4444', // red
    '61-90': '#dc2626', // dark red
    '90+': '#991b1b', // darker red
  };

  const labels = {
    '0-30': '0-30 días',
    '31-60': '31-60 días',
    '61-90': '61-90 días',
    '90+': 'Más de 90 días',
  };

  const total = Object.values(data).reduce((sum, val) => sum + val, 0);
  
  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No hay datos para mostrar
      </div>
    );
  }

  let currentAngle = -90; // Start from top
  const segments: Array<{ range: string; path: string; color: string; percentage: number }> = [];

  Object.entries(data).forEach(([range, value]) => {
    if (value > 0) {
      const percentage = (value / total) * 100;
      const angle = (value / total) * 360;
      
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      
      const x1 = center + radius * Math.cos((startAngle * Math.PI) / 180);
      const y1 = center + radius * Math.sin((startAngle * Math.PI) / 180);
      const x2 = center + radius * Math.cos((endAngle * Math.PI) / 180);
      const y2 = center + radius * Math.sin((endAngle * Math.PI) / 180);
      
      const largeArc = angle > 180 ? 1 : 0;
      
      const path = `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
      
      segments.push({
        range,
        path,
        color: colors[range as keyof typeof colors],
        percentage,
      });
      
      currentAngle += angle;
    }
  });

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="mb-4">
        {segments.map((segment, index) => (
          <path
            key={segment.range}
            d={segment.path}
            fill={segment.color}
            stroke="white"
            strokeWidth="2"
            className="hover:opacity-80 transition-opacity cursor-pointer"
          />
        ))}
      </svg>
      <div className="grid grid-cols-2 gap-2 text-sm">
        {segments.map((segment) => (
          <div key={segment.range} className="flex items-center space-x-2">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: segment.color }}
            ></div>
            <span className="text-gray-700">{labels[segment.range as keyof typeof labels]}:</span>
            <span className="font-medium text-gray-900">{segment.percentage.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SummaryTab;



