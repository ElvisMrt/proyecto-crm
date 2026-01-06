import { useEffect, useState } from 'react';
import { reportsApi, branchesApi } from '../../services/api';
import { exportToExcel, exportToPDF } from '../../utils/exportUtils';
import { HiDownload, HiDocumentDownload } from 'react-icons/hi';
import { useToast } from '../../contexts/ToastContext';

const CashReportTab = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [branches, setBranches] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    branchId: '',
    startDate: new Date(new Date().setDate(1)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchBranches();
    fetchData();
  }, []);

  useEffect(() => {
    fetchData();
  }, [filters.branchId, filters.startDate, filters.endDate]);

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
      const params: any = {};
      if (filters.branchId) params.branchId = filters.branchId;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const response = await reportsApi.getCashReport(params);
      setData(response);
    } catch (error) {
      console.error('Error fetching cash report:', error);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-DO');
  };

  const handleExportExcel = () => {
    if (!data?.data || data.data.length === 0) {
      showToast('No hay datos para exportar', 'error');
      return;
    }

    const exportData = data.data.map((cash: any) => ({
      'Fecha Apertura': formatDate(cash.openedAt),
      'Abierto por': cash.openedBy,
      'Cerrado por': cash.closedBy || '-',
      'Ingresos': cash.income,
      'Egresos': cash.expenses,
      'Diferencia': cash.difference,
      'Estado': cash.status === 'OPEN' ? 'Abierta' : 'Cerrada',
    }));

    exportToExcel(exportData, `Reporte_Caja_${filters.startDate}_${filters.endDate}`, 'Caja');
    showToast('Reporte exportado a Excel exitosamente', 'success');
  };

  const handleExportPDF = () => {
    if (!data?.data || data.data.length === 0) {
      showToast('No hay datos para exportar', 'error');
      return;
    }

    const columns = [
      { header: 'Fecha Apertura', dataKey: 'openedAt', width: 60 },
      { header: 'Abierto por', dataKey: 'openedBy', width: 70 },
      { header: 'Cerrado por', dataKey: 'closedBy', width: 70 },
      { header: 'Ingresos', dataKey: 'income', width: 50 },
      { header: 'Egresos', dataKey: 'expenses', width: 50 },
      { header: 'Diferencia', dataKey: 'difference', width: 50 },
      { header: 'Estado', dataKey: 'status', width: 50 },
    ];

    const exportData = data.data.map((cash: any) => ({
      openedAt: formatDate(cash.openedAt),
      openedBy: cash.openedBy,
      closedBy: cash.closedBy || '-',
      income: cash.income,
      expenses: cash.expenses,
      difference: cash.difference,
      status: cash.status === 'OPEN' ? 'Abierta' : 'Cerrada',
    }));

    const summary = data.summary ? {
      'Total Ingresos': data.summary.totalIncome,
      'Total Egresos': data.summary.totalExpenses,
      'Total Diferencias': data.summary.totalDifference,
    } : undefined;

    exportToPDF(
      exportData,
      columns,
      `Reporte_Caja_${filters.startDate}_${filters.endDate}`,
      'Reporte de Caja',
      summary
    );
    showToast('Reporte exportado a PDF exitosamente', 'success');
  };

  if (loading) {
    return <div className="text-center py-12">Cargando...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Filtros</h3>
          <div className="flex space-x-2">
            <button
              onClick={handleExportExcel}
              disabled={!data?.data || data.data.length === 0}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-md flex items-center space-x-2"
            >
              <HiDownload className="w-4 h-4" />
              <span>Excel</span>
            </button>
            <button
              onClick={handleExportPDF}
              disabled={!data?.data || data.data.length === 0}
              className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-md flex items-center space-x-2"
            >
              <HiDocumentDownload className="w-4 h-4" />
              <span>PDF</span>
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sucursal</label>
            <select
              value={filters.branchId}
              onChange={(e) => setFilters({ ...filters, branchId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Todas</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
        </div>
      </div>

      {/* Summary */}
      {data?.summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
            <p className="text-sm font-medium text-gray-600">Total Ingresos</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {formatCurrency(data.summary.totalIncome)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
            <p className="text-sm font-medium text-gray-600">Total Egresos</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {formatCurrency(data.summary.totalExpenses)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
            <p className="text-sm font-medium text-gray-600">Total Diferencias</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {formatCurrency(data.summary.totalDifference)}
            </p>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {data?.data && data.data.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha Apertura</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Abierto por</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cerrado por</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ingresos</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Egresos</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Diferencia</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.data.map((cash: any) => (
                  <tr key={cash.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(cash.openedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {cash.openedBy}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {cash.closedBy || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-green-600">
                      {formatCurrency(cash.income)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-red-600">
                      {formatCurrency(cash.expenses)}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-medium ${
                      cash.difference >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(cash.difference)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          cash.status === 'OPEN'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {cash.status === 'OPEN' ? 'Abierta' : 'Cerrada'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">No hay datos</div>
        )}
      </div>
    </div>
  );
};

export default CashReportTab;


