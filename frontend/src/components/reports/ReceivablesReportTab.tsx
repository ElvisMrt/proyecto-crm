import { useEffect, useState } from 'react';
import { reportsApi, branchesApi } from '../../services/api';
import { exportToExcel, exportToPDF } from '../../utils/exportUtils';
import { HiDownload, HiDocumentDownload, HiXCircle } from 'react-icons/hi';
import { useToast } from '../../contexts/ToastContext';

const ReceivablesReportTab = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [branches, setBranches] = useState<any[]>([]);
  const [branchId, setBranchId] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  useEffect(() => {
    fetchBranches();
    fetchData();
  }, []);

  useEffect(() => {
    fetchData();
    setCurrentPage(1);
  }, [branchId]);

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
      if (branchId) params.branchId = branchId;

      const response = await reportsApi.getReceivablesReport(params);
      setData(response);
    } catch (error: any) {
      console.error('Error fetching receivables report:', error);
      showToast(error?.response?.data?.error?.message || 'Error al cargar el reporte de cuentas por cobrar', 'error');
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

  // Pagination calculations
  const totalItems = data?.invoices?.length || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentInvoices = data?.invoices?.slice(startIndex, endIndex) || [];

  const handleExportExcel = () => {
    if (!data) {
      showToast('No hay datos para exportar', 'error');
      return;
    }

    const exportData = data.invoices?.map((inv: any) => ({
      Número: inv.number,
      Fecha: formatDate(inv.date),
      'Fecha Vencimiento': inv.dueDate ? formatDate(inv.dueDate) : '-',
      Cliente: inv.client,
      Total: inv.total,
      Saldo: inv.balance,
      'Días Vencido': inv.daysOverdue || '-',
      Estado: inv.status === 'PAID' ? 'Pagada' : inv.status === 'OVERDUE' ? 'Vencida' : 'Emitida',
    })) || [];

    exportToExcel(exportData, `Reporte_CuentasPorCobrar_${new Date().toISOString().split('T')[0]}`, 'Ctas. por Cobrar');
    showToast('Reporte exportado a Excel exitosamente', 'success');
  };

  const handleExportPDF = () => {
    if (!data) {
      showToast('No hay datos para exportar', 'error');
      return;
    }

    const columns = [
      { header: 'Número', dataKey: 'number', width: 60 },
      { header: 'Fecha', dataKey: 'date', width: 60 },
      { header: 'Fecha Vencimiento', dataKey: 'dueDate', width: 80 },
      { header: 'Cliente', dataKey: 'client', width: 100 },
      { header: 'Total', dataKey: 'total', width: 60 },
      { header: 'Saldo', dataKey: 'balance', width: 60 },
      { header: 'Días Vencido', dataKey: 'daysOverdue', width: 60 },
      { header: 'Estado', dataKey: 'status', width: 60 },
    ];

    const exportData = data.invoices?.map((inv: any) => ({
      number: inv.number,
      date: new Date(inv.date),
      dueDate: inv.dueDate ? new Date(inv.dueDate) : '-',
      client: inv.client,
      total: inv.total,
      balance: inv.balance,
      daysOverdue: inv.daysOverdue || '-',
      status: inv.status === 'PAID' ? 'Pagada' : inv.status === 'OVERDUE' ? 'Vencida' : 'Emitida',
    })) || [];

    const summary = {
      'Total Facturas': data.invoicesCount || 0,
      'Total por Cobrar': data.totalReceivable || 0,
      'Total Vencido': data.totalOverdue || 0,
    };

    exportToPDF(
      exportData,
      columns,
      `Reporte_CuentasPorCobrar_${new Date().toISOString().split('T')[0]}`,
      'Reporte de Cuentas por Cobrar',
      summary
    );
    showToast('Reporte exportado a PDF exitosamente', 'success');
  };

  if (loading) {
    return <div className="text-center py-12">Cargando...</div>;
  }

  if (!data) {
    return <div className="py-12 text-center text-slate-500 dark:text-slate-400">No hay datos disponibles</div>;
  }

  return (
    <div className="space-y-6">
      {/* Filter */}
      <div className="rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/70">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-950 dark:text-slate-100">Filtros</h3>
          <div className="flex space-x-2">
            <button
              onClick={handleExportExcel}
              disabled={!data}
              className="flex items-center space-x-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-slate-200 dark:disabled:bg-slate-700"
            >
              <HiDownload className="w-4 h-4" />
              <span>Excel</span>
            </button>
            <button
              onClick={handleExportPDF}
              disabled={!data}
              className="flex items-center space-x-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:disabled:border-slate-800 dark:disabled:bg-slate-900 dark:disabled:text-slate-600"
            >
              <HiDocumentDownload className="w-4 h-4" />
              <span>PDF</span>
            </button>
          </div>
        </div>
        <div className="max-w-xs">
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Sucursal</label>
          <select
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
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
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => setBranchId('')}
            className="flex items-center space-x-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <HiXCircle className="w-4 h-4" />
            <span>Limpiar Filtros</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/70">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total por Cobrar</p>
          <p className="mt-2 text-3xl font-bold text-slate-950 dark:text-slate-100">
            {formatCurrency(data?.totalReceivable || 0)}
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/70">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Vencido</p>
          <p className="mt-2 text-3xl font-bold text-slate-950 dark:text-slate-100">
            {formatCurrency(data?.totalOverdue || 0)}
          </p>
        </div>
      </div>

      {/* Aging Report */}
      {data?.aging && (
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/70">
          <h3 className="mb-4 text-lg font-semibold text-slate-950 dark:text-slate-100">Antigüedad de Saldos</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="rounded-2xl bg-slate-100/80 p-4 dark:bg-slate-900">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">0-30 días</p>
              <p className="mt-2 text-2xl font-bold text-slate-950 dark:text-slate-100">
                {formatCurrency(data.aging['0-30'] || 0)}
              </p>
            </div>
            <div className="rounded-2xl bg-amber-50 p-4 dark:bg-amber-500/10">
              <p className="text-sm font-medium text-amber-700 dark:text-amber-300">31-60 días</p>
              <p className="mt-2 text-2xl font-bold text-amber-900 dark:text-amber-200">
                {formatCurrency(data.aging['31-60'] || 0)}
              </p>
            </div>
            <div className="rounded-2xl bg-orange-50 p-4 dark:bg-orange-500/10">
              <p className="text-sm font-medium text-orange-700 dark:text-orange-300">61-90 días</p>
              <p className="mt-2 text-2xl font-bold text-orange-900 dark:text-orange-200">
                {formatCurrency(data.aging['61-90'] || 0)}
              </p>
            </div>
            <div className="rounded-2xl bg-rose-50 p-4 dark:bg-rose-500/10">
              <p className="text-sm font-medium text-rose-700 dark:text-rose-300">+90 días</p>
              <p className="mt-2 text-2xl font-bold text-rose-900 dark:text-rose-200">
                {formatCurrency(data.aging['90+'] || 0)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Invoices Table */}
      {data?.invoices && data.invoices.length > 0 ? (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white/90 shadow-sm dark:border-slate-800 dark:bg-slate-950/70">
          <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-800">
            <h3 className="text-lg font-semibold text-slate-950 dark:text-slate-100">Facturas por Cobrar</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
              <thead className="bg-slate-100/70 dark:bg-slate-900/80">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500 dark:text-slate-400">Número</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500 dark:text-slate-400">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500 dark:text-slate-400">Vencimiento</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500 dark:text-slate-400">Cliente</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase text-slate-500 dark:text-slate-400">Total</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase text-slate-500 dark:text-slate-400">Saldo</th>
                  <th className="px-6 py-3 text-center text-xs font-medium uppercase text-slate-500 dark:text-slate-400">Días Vencido</th>
                  <th className="px-6 py-3 text-center text-xs font-medium uppercase text-slate-500 dark:text-slate-400">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-800 dark:bg-slate-950/50">
                {currentInvoices.map((invoice: any) => (
                  <tr key={invoice.id} className="hover:bg-slate-100/70 dark:hover:bg-slate-900/70">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-950 dark:text-slate-100">
                      {invoice.number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                      {formatDate(invoice.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                      {invoice.dueDate ? formatDate(invoice.dueDate) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                      {invoice.client}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-slate-500 dark:text-slate-400">
                      {formatCurrency(invoice.total)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-slate-950 dark:text-slate-100">
                      {formatCurrency(invoice.balance)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                      {invoice.daysOverdue !== null ? (
                        <span className={`font-medium ${invoice.daysOverdue > 0 ? 'text-rose-500 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'}`}>
                          {invoice.daysOverdue > 0 ? `${invoice.daysOverdue} días` : '-'}
                        </span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          invoice.status === 'PAID'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                            : invoice.status === 'OVERDUE'
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'
                        }`}
                      >
                        {invoice.status === 'PAID'
                          ? 'Pagada'
                          : invoice.status === 'OVERDUE'
                            ? 'Vencida'
                            : 'Emitida'}
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
        </div>
      ) : (
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/70">
          <div className="py-12 text-center text-slate-500 dark:text-slate-400">
            <p className="text-lg font-medium mb-2">No hay facturas por cobrar</p>
            <p className="text-sm">No se encontraron facturas pendientes de pago</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceivablesReportTab;
