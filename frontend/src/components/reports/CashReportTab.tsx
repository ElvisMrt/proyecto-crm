import { useEffect, useState } from 'react';
import { reportsApi, branchesApi } from '../../services/api';
import { exportToExcel, exportToPDF } from '../../utils/exportUtils';
import { HiDownload, HiDocumentDownload, HiXCircle } from 'react-icons/hi';
import { useToast } from '../../contexts/ToastContext';

const CashReportTab = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [branches, setBranches] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
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
    setCurrentPage(1);
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
    } catch (error: any) {
      console.error('Error fetching cash report:', error);
      showToast(error?.response?.data?.error?.message || 'Error al cargar el reporte de caja', 'error');
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

  // Pagination calculations
  const totalItems = data?.data?.length || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = data?.data?.slice(startIndex, endIndex) || [];

  if (loading) {
    return <div className="text-center py-12">Cargando...</div>;
  }

  if (!data) {
    return <div className="py-12 text-center text-slate-500 dark:text-slate-400">No hay datos disponibles</div>;
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/70">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-950 dark:text-slate-100">Filtros</h3>
          <div className="flex space-x-2">
            <button
              onClick={handleExportExcel}
              disabled={!data?.data || data.data.length === 0}
              className="flex items-center space-x-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-slate-200 dark:disabled:bg-slate-700"
            >
              <HiDownload className="w-4 h-4" />
              <span>Excel</span>
            </button>
            <button
              onClick={handleExportPDF}
              disabled={!data?.data || data.data.length === 0}
              className="flex items-center space-x-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:disabled:border-slate-800 dark:disabled:bg-slate-900 dark:disabled:text-slate-600"
            >
              <HiDocumentDownload className="w-4 h-4" />
              <span>PDF</span>
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Sucursal</label>
            <select
              value={filters.branchId}
              onChange={(e) => setFilters({ ...filters, branchId: e.target.value })}
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-slate-500 dark:focus:ring-slate-800"
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
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Desde</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-slate-500 dark:focus:ring-slate-800"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Hasta</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-slate-500 dark:focus:ring-slate-800"
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => {
              setFilters({
                branchId: '',
                startDate: new Date(new Date().setDate(1)).toISOString().split('T')[0],
                endDate: new Date().toISOString().split('T')[0],
              });
            }}
            className="flex items-center space-x-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <HiXCircle className="w-4 h-4" />
            <span>Limpiar Filtros</span>
          </button>
        </div>
      </div>

      {/* Summary */}
      {data?.summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/70">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Ingresos</p>
            <p className="mt-2 text-2xl font-bold text-slate-950 dark:text-slate-100">
              {formatCurrency(data.summary.totalIncome)}
            </p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/70">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Egresos</p>
            <p className="mt-2 text-2xl font-bold text-slate-950 dark:text-slate-100">
              {formatCurrency(data.summary.totalExpenses)}
            </p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/70">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Diferencias</p>
            <p className="mt-2 text-2xl font-bold text-slate-950 dark:text-slate-100">
              {formatCurrency(data.summary.totalDifference)}
            </p>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white/90 shadow-sm dark:border-slate-800 dark:bg-slate-950/70">
        {data?.data && data.data.length > 0 ? (
          <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
              <thead className="bg-slate-100/70 dark:bg-slate-900/80">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500 dark:text-slate-400">Fecha Apertura</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500 dark:text-slate-400">Abierto por</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500 dark:text-slate-400">Cerrado por</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase text-slate-500 dark:text-slate-400">Ingresos</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase text-slate-500 dark:text-slate-400">Egresos</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase text-slate-500 dark:text-slate-400">Diferencia</th>
                  <th className="px-6 py-3 text-center text-xs font-medium uppercase text-slate-500 dark:text-slate-400">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-800 dark:bg-slate-950/50">
                  {currentData.map((cash: any) => (
                    <tr key={cash.id} className="hover:bg-slate-100/70 dark:hover:bg-slate-900/70">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                      {formatDate(cash.openedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                      {cash.openedBy}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                      {cash.closedBy || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(cash.income)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-rose-600 dark:text-rose-400">
                      {formatCurrency(cash.expenses)}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-medium ${
                      cash.difference >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`}>
                      {formatCurrency(cash.difference)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          cash.status === 'OPEN'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                            : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
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
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-950/40 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    Siguiente
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                      Mostrando <span className="font-medium">{startIndex + 1}</span> a{' '}
                      <span className="font-medium">{Math.min(endIndex, totalItems)}</span> de{' '}
                      <span className="font-medium">{totalItems}</span> resultados
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center rounded-l-2xl border border-slate-200 bg-white px-2 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        Anterior
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter((page) => {
                          if (totalPages <= 7) return true;
                          if (page === 1 || page === totalPages) return true;
                          if (Math.abs(page - currentPage) <= 1) return true;
                          return false;
                        })
                        .map((page, idx, arr) => {
                          const showEllipsisBefore = idx > 0 && page - arr[idx - 1] > 1;
                          return (
                            <div key={page} className="flex items-center">
                              {showEllipsisBefore && (
                                <span className="relative inline-flex items-center border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                                  ...
                                </span>
                              )}
                              <button
                                onClick={() => setCurrentPage(page)}
                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                  currentPage === page
                                    ? 'z-10 border-slate-900 bg-slate-900 text-white'
                                    : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                                }`}
                              >
                                {page}
                              </button>
                            </div>
                          );
                        })}
                      <button
                        onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center rounded-r-2xl border border-slate-200 bg-white px-2 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        Siguiente
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="py-12 text-center text-slate-500 dark:text-slate-400">No hay datos</div>
        )}
      </div>
    </div>
  );
};

export default CashReportTab;
