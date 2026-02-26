import { useEffect, useState } from 'react';
import { reportsApi, branchesApi } from '../../services/api';
import { exportToExcel, exportToPDF } from '../../utils/exportUtils';
import { HiDownload, HiDocumentDownload, HiXCircle } from 'react-icons/hi';
import { useToast } from '../../contexts/ToastContext';

const DailyProfitTab = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [branchId, setBranchId] = useState('');

  useEffect(() => {
    fetchBranches();
    fetchData();
  }, []);

  useEffect(() => {
    fetchData();
  }, [selectedDate, branchId]);

  const fetchBranches = async () => {
    try {
      const response = await branchesApi.getBranches();
      setBranches(response.data || response || []);
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const params: any = { date: selectedDate };
      if (branchId) params.branchId = branchId;

      const response = await reportsApi.getDailyProfit(params);
      setData(response);
    } catch (error: any) {
      console.error('Error fetching daily profit:', error);
      showToast(error?.response?.data?.error?.message || 'Error al cargar el reporte de ganancia diaria', 'error');
      setData(null);
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

  const handleExportExcel = () => {
    if (!data) {
      showToast('No hay datos para exportar', 'error');
      return;
    }

    const exportData = [
      { 'Concepto': 'Ventas', 'Monto': data.sales || 0 },
      { 'Concepto': 'Costos', 'Monto': data.costs || 0 },
      { 'Concepto': 'Gastos', 'Monto': data.expenses || 0 },
      { 'Concepto': 'Ganancia Neta', 'Monto': data.netProfit || 0 },
    ];

    exportToExcel(exportData, `Reporte_Ganancia_${selectedDate}`, 'Ganancia del Día');
    showToast('Reporte exportado a Excel exitosamente', 'success');
  };

  const handleExportPDF = () => {
    if (!data) {
      showToast('No hay datos para exportar', 'error');
      return;
    }

    const columns = [
      { header: 'Concepto', dataKey: 'concepto', width: 100 },
      { header: 'Monto', dataKey: 'monto', width: 100 },
    ];

    const exportData = [
      { concepto: 'Ventas', monto: data.sales || 0 },
      { concepto: 'Costos', monto: data.costs || 0 },
      { concepto: 'Gastos', monto: data.expenses || 0 },
      { concepto: 'Ganancia Neta', monto: data.netProfit || 0 },
    ];

    const summary = {
      'Fecha': selectedDate,
      'Ganancia Positiva': data.isPositive ? 'Sí' : 'No',
    };

    exportToPDF(
      exportData,
      columns,
      `Reporte_Ganancia_${selectedDate}`,
      `Ganancia del Día - ${selectedDate}`,
      summary
    );
    showToast('Reporte exportado a PDF exitosamente', 'success');
  };

  if (loading) {
    return <div className="text-center py-12">Cargando...</div>;
  }

  if (!data) {
    return <div className="text-center py-12 text-gray-500">No hay datos</div>;
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Filtros</h3>
          <div className="flex space-x-2">
            <button
              onClick={handleExportExcel}
              disabled={!data}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-md flex items-center space-x-2"
            >
              <HiDownload className="w-4 h-4" />
              <span>Excel</span>
            </button>
            <button
              onClick={handleExportPDF}
              disabled={!data}
              className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-md flex items-center space-x-2"
            >
              <HiDocumentDownload className="w-4 h-4" />
              <span>PDF</span>
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sucursal</label>
            <select
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => {
              setSelectedDate(new Date().toISOString().split('T')[0]);
              setBranchId('');
            }}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            <HiXCircle className="w-4 h-4" />
            <span>Limpiar Filtros</span>
          </button>
        </div>
      </div>

      {/* Main Profit Card */}
      <div
        className={`rounded-lg shadow-lg p-8 ${
          data.isPositive ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gradient-to-r from-red-500 to-red-600'
        }`}
      >
        <div className="text-center text-white">
          <h2 className="text-2xl font-bold mb-4">¿Cuánto gané hoy?</h2>
          <div className="text-5xl font-bold mb-2">{formatCurrency(data.netProfit)}</div>
          <p className="text-lg opacity-90">
            {new Date(data.date).toLocaleDateString('es-DO', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
      </div>

      {/* Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-600">Ventas Totales</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {formatCurrency(data.sales)}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-600">Costos</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {formatCurrency(data.costs)}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-600">Gastos</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {formatCurrency(data.expenses)}
          </p>
        </div>
      </div>

      {/* Calculation */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Cálculo de Utilidad</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Ventas:</span>
            <span className="font-medium text-gray-900">{formatCurrency(data.sales)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">(-) Costos:</span>
            <span className="font-medium text-red-600">-{formatCurrency(data.costs)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">(-) Gastos:</span>
            <span className="font-medium text-red-600">-{formatCurrency(data.expenses)}</span>
          </div>
          <div className="border-t border-gray-300 pt-2 mt-2 flex justify-between">
            <span className="font-semibold text-gray-900">Utilidad Neta:</span>
            <span
              className={`font-bold ${data.isPositive ? 'text-green-600' : 'text-red-600'}`}
            >
              {formatCurrency(data.netProfit)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyProfitTab;


