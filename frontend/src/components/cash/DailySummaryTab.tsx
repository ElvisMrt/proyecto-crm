import { useEffect, useState } from 'react';
import { cashApi } from '../../services/api';
import { exportToExcel, exportToPDF } from '../../utils/exportUtils';
import { 
  HiDocumentDownload, 
  HiTable, 
  HiCurrencyDollar, 
  HiCreditCard, 
  HiPlusCircle, 
  HiMinusCircle, 
  HiChartBar 
} from 'react-icons/hi';
import { DashboardCard, DashboardGrid } from '../DashboardCard';

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

  const totalIncome = (summary.salesTotal || 0) + (summary.paymentsTotal || 0) + (summary.manualEntriesTotal || 0);
  const totalExpenses = summary.manualExitsTotal || 0;
  const maxAmount = Math.max(totalIncome, totalExpenses, Math.abs(summary.netTotal || 0));

  const handleExportExcel = () => {
    const exportData = [
      {
        'Concepto': 'Ventas',
        'Monto': summary.salesTotal || 0,
      },
      {
        'Concepto': 'Pagos Recibidos',
        'Monto': summary.paymentsTotal || 0,
      },
      {
        'Concepto': 'Entradas Manuales',
        'Monto': summary.manualEntriesTotal || 0,
      },
      {
        'Concepto': 'Salidas Manuales',
        'Monto': summary.manualExitsTotal || 0,
      },
      {
        'Concepto': 'Balance Neto',
        'Monto': summary.netTotal || 0,
      },
      {
        'Concepto': 'Aperturas',
        'Monto': summary.openingTotal || 0,
      },
      {
        'Concepto': 'Cierres',
        'Monto': summary.closingTotal || 0,
      },
    ];
    exportToExcel(exportData, `Resumen_Caja_${selectedDate}`, 'Resumen Diario');
  };

  const handleExportPDF = () => {
    const exportData = [
      {
        'Concepto': 'Ventas',
        'Monto': summary.salesTotal || 0,
      },
      {
        'Concepto': 'Pagos Recibidos',
        'Monto': summary.paymentsTotal || 0,
      },
      {
        'Concepto': 'Entradas Manuales',
        'Monto': summary.manualEntriesTotal || 0,
      },
      {
        'Concepto': 'Salidas Manuales',
        'Monto': summary.manualExitsTotal || 0,
      },
      {
        'Concepto': 'Balance Neto',
        'Monto': summary.netTotal || 0,
      },
      {
        'Concepto': 'Aperturas',
        'Monto': summary.openingTotal || 0,
      },
      {
        'Concepto': 'Cierres',
        'Monto': summary.closingTotal || 0,
      },
    ];
    exportToPDF(
      exportData,
      [
        { header: 'Concepto', dataKey: 'Concepto' },
        { header: 'Monto', dataKey: 'Monto' },
      ],
      `Resumen_Caja_${selectedDate}`,
      `Resumen Diario de Caja - ${new Date(selectedDate).toLocaleDateString('es-DO')}`,
      {
        'Total Ingresos': totalIncome,
        'Total Egresos': totalExpenses,
        'Balance Neto': summary.netTotal || 0,
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Selector de Fecha */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <div>
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
          <div className="flex space-x-2">
            <button
              onClick={handleExportExcel}
              className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded flex items-center space-x-1"
            >
              <HiTable className="w-4 h-4" />
              <span>Excel</span>
            </button>
            <button
              onClick={handleExportPDF}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded flex items-center space-x-1"
            >
              <HiDocumentDownload className="w-4 h-4" />
              <span>PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Resumen General */}
      <DashboardGrid columns={4}>
        <DashboardCard
          title="Ventas"
          value={formatCurrency(summary.salesTotal || 0)}
          icon={<HiCurrencyDollar className="w-6 h-6" />}
          iconBgColor="bg-blue-100"
          iconColor="text-blue-600"
        />
        <DashboardCard
          title="Pagos Recibidos"
          value={formatCurrency(summary.paymentsTotal || 0)}
          icon={<HiCreditCard className="w-6 h-6" />}
          iconBgColor="bg-green-100"
          iconColor="text-green-600"
        />
        <DashboardCard
          title="Entradas Manuales"
          value={formatCurrency(summary.manualEntriesTotal || 0)}
          icon={<HiPlusCircle className="w-6 h-6" />}
          iconBgColor="bg-purple-100"
          iconColor="text-purple-600"
        />
        <DashboardCard
          title="Salidas Manuales"
          value={formatCurrency(summary.manualExitsTotal || 0)}
          icon={<HiMinusCircle className="w-6 h-6" />}
          iconBgColor="bg-red-100"
          iconColor="text-red-600"
        />
      </DashboardGrid>

      {/* Balance Neto */}
      <DashboardCard
        title="Balance Neto del Día"
        value={formatCurrency(summary.netTotal || 0)}
        subtitle={summary.branch || 'Todas las sucursales'}
        icon={<HiChartBar className="w-6 h-6" />}
        iconBgColor={summary.netTotal >= 0 ? "bg-green-100" : "bg-red-100"}
        iconColor={summary.netTotal >= 0 ? "text-green-600" : "text-red-600"}
      />

      {/* Aperturas y Cierres */}
      <DashboardGrid columns={2}>
        <DashboardCard
          title="Aperturas"
          value={formatCurrency(summary.openingTotal || 0)}
          icon={<HiPlusCircle className="w-6 h-6" />}
          iconBgColor="bg-blue-100"
          iconColor="text-blue-600"
        />
        <DashboardCard
          title="Cierres"
          value={formatCurrency(summary.closingTotal || 0)}
          icon={<HiMinusCircle className="w-6 h-6" />}
          iconBgColor="bg-gray-100"
          iconColor="text-gray-600"
        />
      </DashboardGrid>

      {/* Gráfico de Ingresos vs Egresos */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribución de Ingresos y Egresos</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium text-gray-700">Total Ingresos</span>
              <span className="font-medium text-green-600">{formatCurrency(totalIncome)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-6">
              <div
                className="bg-green-500 h-6 rounded-full flex items-center justify-end pr-2 transition-all"
                style={{ width: maxAmount > 0 ? `${(totalIncome / maxAmount) * 100}%` : '0%' }}
              >
                {totalIncome > 0 && (
                  <span className="text-xs font-medium text-white">
                    {maxAmount > 0 ? `${((totalIncome / maxAmount) * 100).toFixed(1)}%` : '0%'}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium text-gray-700">Total Egresos</span>
              <span className="font-medium text-red-600">{formatCurrency(totalExpenses)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-6">
              <div
                className="bg-red-500 h-6 rounded-full flex items-center justify-end pr-2 transition-all"
                style={{ width: maxAmount > 0 ? `${(totalExpenses / maxAmount) * 100}%` : '0%' }}
              >
                {totalExpenses > 0 && (
                  <span className="text-xs font-medium text-white">
                    {maxAmount > 0 ? `${((totalExpenses / maxAmount) * 100).toFixed(1)}%` : '0%'}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium text-gray-700">Balance Neto</span>
              <span className={`font-medium ${summary.netTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(summary.netTotal || 0)}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-6">
              <div
                className={`h-6 rounded-full flex items-center justify-end pr-2 transition-all ${
                  summary.netTotal >= 0 ? 'bg-green-500' : 'bg-red-500'
                }`}
                style={{ 
                  width: maxAmount > 0 
                    ? `${(Math.abs(summary.netTotal || 0) / maxAmount) * 100}%` 
                    : '0%' 
                }}
              >
                {summary.netTotal !== 0 && (
                  <span className="text-xs font-medium text-white">
                    {maxAmount > 0 
                      ? `${((Math.abs(summary.netTotal || 0) / maxAmount) * 100).toFixed(1)}%` 
                      : '0%'}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desglose de Ingresos */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Desglose de Ingresos</h3>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-700">Ventas</span>
              <span className="font-medium text-gray-900">{formatCurrency(summary.salesTotal || 0)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-500 h-3 rounded-full transition-all"
                style={{ width: totalIncome > 0 ? `${((summary.salesTotal || 0) / totalIncome) * 100}%` : '0%' }}
              ></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-700">Pagos Recibidos</span>
              <span className="font-medium text-gray-900">{formatCurrency(summary.paymentsTotal || 0)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-purple-500 h-3 rounded-full transition-all"
                style={{ width: totalIncome > 0 ? `${((summary.paymentsTotal || 0) / totalIncome) * 100}%` : '0%' }}
              ></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-700">Entradas Manuales</span>
              <span className="font-medium text-gray-900">{formatCurrency(summary.manualEntriesTotal || 0)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-green-500 h-3 rounded-full transition-all"
                style={{ width: totalIncome > 0 ? `${((summary.manualEntriesTotal || 0) / totalIncome) * 100}%` : '0%' }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailySummaryTab;


