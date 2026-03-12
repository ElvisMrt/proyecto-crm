import { useEffect, useState } from 'react';
import { reportsApi, clientsApi, branchesApi, inventoryApi } from '../../services/api';
import { exportToExcel, exportToPDF } from '../../utils/exportUtils';
import { HiDownload, HiDocumentDownload, HiXCircle } from 'react-icons/hi';
import { useToast } from '../../contexts/ToastContext';

const SalesReportTab = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [branches, setBranches] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [filters, setFilters] = useState({
    branchId: '',
    clientIds: [] as string[],
    categoryIds: [] as string[],
    productIds: [] as string[],
    startDate: new Date(new Date().setDate(1)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    status: '',
  });
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showProductDropdown, setShowProductDropdown] = useState(false);

  useEffect(() => {
    fetchBranches();
    fetchClients();
    fetchCategories();
    fetchProducts();
    fetchData();
  }, []);

  useEffect(() => {
    fetchData();
    setCurrentPage(1); // Reset to first page when filters change
  }, [filters.branchId, filters.clientIds, filters.categoryIds, filters.productIds, filters.startDate, filters.endDate, filters.status]);

  const fetchBranches = async () => {
    try {
      const response = await branchesApi.getBranches();
      setBranches(response.data || response || []);
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await clientsApi.getClients({ limit: 1000 });
      setClients(response.data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await inventoryApi.getCategories();
      setCategories(response.data || response || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await inventoryApi.getProducts({ limit: 1000 });
      setProducts(response.data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filters.branchId) params.branchId = filters.branchId;
      if (filters.clientIds.length > 0) params.clientIds = filters.clientIds.join(',');
      if (filters.categoryIds.length > 0) params.categoryIds = filters.categoryIds.join(',');
      if (filters.productIds.length > 0) params.productIds = filters.productIds.join(',');
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.status) params.status = filters.status;

      const response = await reportsApi.getSalesReport(params);
      console.log('Sales Report Response from API:', response);
      
      // Verify data is real (not mock)
      if (response && typeof response === 'object') {
        console.log('Data verification:', {
          hasData: Array.isArray(response.data),
          dataCount: response.data?.length || 0,
          hasSummary: !!response.summary,
          summaryTotal: response.summary?.total || 0,
          summaryCount: response.summary?.count || 0,
        });
      setData(response);
      } else {
        console.error('Invalid response format:', response);
        showToast('Error: Datos inválidos recibidos del servidor', 'error');
        setData(null);
      }
    } catch (error: any) {
      console.error('Error fetching sales report:', error);
      console.error('Error details:', error?.response?.data);
      showToast(error?.response?.data?.error?.message || 'Error al cargar el reporte de ventas', 'error');
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

    const getStatusLabel = (status: string) => {
      const labels: Record<string, string> = {
        PAID: 'Pagada',
        OVERDUE: 'Vencida',
        ISSUED: 'Emitida',
        CANCELLED: 'Anulada',
      };
      return labels[status] || status;
    };

    const exportData = data.data.map((invoice: any) => ({
      Número: invoice.number,
      Fecha: formatDate(invoice.date),
      Cliente: invoice.client,
      Sucursal: invoice.branch || '-',
      Total: invoice.total,
      Estado: getStatusLabel(invoice.status),
    }));

    exportToExcel(exportData, `Reporte_Ventas_${filters.startDate}_${filters.endDate}`, 'Ventas');
    showToast('Reporte exportado a Excel exitosamente', 'success');
  };

  const handleExportPDF = () => {
    if (!data?.data || data.data.length === 0) {
      showToast('No hay datos para exportar', 'error');
      return;
    }

    const columns = [
      { header: 'Número', dataKey: 'number', width: 60 },
      { header: 'Fecha', dataKey: 'date', width: 60 },
      { header: 'Cliente', dataKey: 'client', width: 80 },
      { header: 'Sucursal', dataKey: 'branch', width: 60 },
      { header: 'Total', dataKey: 'total', width: 50 },
      { header: 'Estado', dataKey: 'status', width: 50 },
    ];

    const getStatusLabel = (status: string) => {
      const labels: Record<string, string> = {
        PAID: 'Pagada',
        OVERDUE: 'Vencida',
        ISSUED: 'Emitida',
        CANCELLED: 'Anulada',
      };
      return labels[status] || status;
    };

    const exportData = data.data.map((invoice: any) => ({
      number: invoice.number,
      date: new Date(invoice.date),
      client: invoice.client,
      branch: invoice.branch || '-',
      total: invoice.total,
      status: getStatusLabel(invoice.status),
    }));

    const summary = {
      'Total Ventas': data.summary?.total || 0,
      'Cantidad Facturas': data.summary?.count || 0,
    };

    exportToPDF(
      exportData,
      columns,
      `Reporte_Ventas_${filters.startDate}_${filters.endDate}`,
      'Reporte de Ventas',
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
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4">
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
          <div className="relative">
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Clientes</label>
            <button
              type="button"
              onClick={() => setShowClientDropdown(!showClientDropdown)}
              className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-3 py-2 text-left text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-slate-500 dark:focus:ring-slate-800"
            >
              <span className="text-sm text-slate-700 dark:text-slate-300">
                {filters.clientIds.length === 0 ? 'Todos' : `${filters.clientIds.length} seleccionado(s)`}
              </span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showClientDropdown && (
              <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-2xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
                <div className="p-2">
                  {clients.map((client) => (
                    <label key={client.id} className="flex cursor-pointer items-center rounded-xl px-2 py-2 hover:bg-slate-100 dark:hover:bg-slate-800">
                      <input
                        type="checkbox"
                        checked={filters.clientIds.includes(client.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFilters({ ...filters, clientIds: [...filters.clientIds, client.id] });
                          } else {
                            setFilters({ ...filters, clientIds: filters.clientIds.filter(id => id !== client.id) });
                          }
                        }}
                        className="rounded border-slate-300 text-slate-900 focus:ring-slate-400 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-slate-700"
                      />
                      <span className="ml-2 text-sm text-slate-700 dark:text-slate-300">{client.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="relative">
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Categorías</label>
            <button
              type="button"
              onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
              className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-3 py-2 text-left text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-slate-500 dark:focus:ring-slate-800"
            >
              <span className="text-sm text-slate-700 dark:text-slate-300">
                {filters.categoryIds.length === 0 ? 'Todas' : `${filters.categoryIds.length} seleccionada(s)`}
              </span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showCategoryDropdown && (
              <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-2xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
                <div className="p-2">
                  {categories.map((category) => (
                    <label key={category.id} className="flex cursor-pointer items-center rounded-xl px-2 py-2 hover:bg-slate-100 dark:hover:bg-slate-800">
                      <input
                        type="checkbox"
                        checked={filters.categoryIds.includes(category.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFilters({ ...filters, categoryIds: [...filters.categoryIds, category.id] });
                          } else {
                            setFilters({ ...filters, categoryIds: filters.categoryIds.filter(id => id !== category.id) });
                          }
                        }}
                        className="rounded border-slate-300 text-slate-900 focus:ring-slate-400 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-slate-700"
                      />
                      <span className="ml-2 text-sm text-slate-700 dark:text-slate-300">{category.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="relative">
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Productos</label>
            <button
              type="button"
              onClick={() => setShowProductDropdown(!showProductDropdown)}
              className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-3 py-2 text-left text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-slate-500 dark:focus:ring-slate-800"
            >
              <span className="text-sm text-slate-700 dark:text-slate-300">
                {filters.productIds.length === 0 ? 'Todos' : `${filters.productIds.length} seleccionado(s)`}
              </span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showProductDropdown && (
              <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-2xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
                <div className="p-2">
                  {products.map((product) => (
                    <label key={product.id} className="flex cursor-pointer items-center rounded-xl px-2 py-2 hover:bg-slate-100 dark:hover:bg-slate-800">
                      <input
                        type="checkbox"
                        checked={filters.productIds.includes(product.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFilters({ ...filters, productIds: [...filters.productIds, product.id] });
                          } else {
                            setFilters({ ...filters, productIds: filters.productIds.filter(id => id !== product.id) });
                          }
                        }}
                        className="rounded border-slate-300 text-slate-900 focus:ring-slate-400 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-slate-700"
                      />
                      <span className="ml-2 text-sm text-slate-700 dark:text-slate-300">{product.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Estado</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-slate-500 dark:focus:ring-slate-800"
            >
              <option value="">Todos</option>
              <option value="ISSUED">Emitidas</option>
              <option value="PAID">Pagadas</option>
              <option value="OVERDUE">Vencidas</option>
            </select>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => {
              setFilters({
                branchId: '',
                clientIds: [],
                categoryIds: [],
                productIds: [],
                startDate: new Date(new Date().setDate(1)).toISOString().split('T')[0],
                endDate: new Date().toISOString().split('T')[0],
                status: '',
              });
              setShowClientDropdown(false);
              setShowCategoryDropdown(false);
              setShowProductDropdown(false);
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
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/70">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Total Ventas</p>
              <p className="text-2xl font-bold text-slate-950 dark:text-slate-100">
                {formatCurrency(data.summary.total)}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Cantidad de Facturas</p>
              <p className="text-2xl font-bold text-slate-950 dark:text-slate-100">{data.summary.count}</p>
            </div>
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
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500 dark:text-slate-400">Número</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500 dark:text-slate-400">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500 dark:text-slate-400">Cliente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500 dark:text-slate-400">Sucursal</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase text-slate-500 dark:text-slate-400">Total</th>
                  <th className="px-6 py-3 text-center text-xs font-medium uppercase text-slate-500 dark:text-slate-400">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-800 dark:bg-slate-950/50">
                  {currentData.map((invoice: any) => (
                    <tr key={invoice.id} className="hover:bg-slate-100/70 dark:hover:bg-slate-900/70">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-950 dark:text-slate-100">
                      {invoice.number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                      {formatDate(invoice.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                      {invoice.client}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                      {invoice.branch || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-slate-950 dark:text-slate-100">
                      {formatCurrency(invoice.total)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          invoice.status === 'PAID'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                            : invoice.status === 'OVERDUE'
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300'
                                : invoice.status === 'CANCELLED'
                                  ? 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'
                        }`}
                      >
                          {invoice.status === 'PAID'
                            ? 'Pagada'
                            : invoice.status === 'OVERDUE'
                              ? 'Vencida'
                              : invoice.status === 'CANCELLED'
                                ? 'Anulada'
                                : invoice.status === 'ISSUED'
                                  ? 'Emitida'
                                  : invoice.status}
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

export default SalesReportTab;
