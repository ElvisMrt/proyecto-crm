import { useEffect, useState } from 'react';
import { reportsApi, branchesApi, inventoryApi } from '../../services/api';
import { exportToExcel, exportToPDF } from '../../utils/exportUtils';
import { HiDownload, HiDocumentDownload, HiXCircle } from 'react-icons/hi';
import { useToast } from '../../contexts/ToastContext';

const InventoryReportTab = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [branches, setBranches] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [branchId, setBranchId] = useState('');
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  useEffect(() => {
    fetchBranches();
    fetchCategories();
    fetchData();
  }, []);

  useEffect(() => {
    fetchData();
    setCurrentPage(1);
  }, [branchId, categoryIds]);

  const fetchBranches = async () => {
    try {
      const response = await branchesApi.getBranches();
      setBranches(response.data || response || []);
    } catch (error) {
      console.error('Error fetching branches:', error);
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

  const fetchData = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (branchId) params.branchId = branchId;
      if (categoryIds.length > 0) params.categoryIds = categoryIds.join(',');

      const response = await reportsApi.getInventoryReport(params);
      setData(response);
    } catch (error: any) {
      console.error('Error fetching inventory report:', error);
      showToast(error?.response?.data?.error?.message || 'Error al cargar el reporte de inventario', 'error');
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
    const exportDataToUse = showLowStockOnly ? (data?.lowStock || []) : (data?.stocks || []);
    if (!exportDataToUse || exportDataToUse.length === 0) {
      showToast('No hay datos para exportar', 'error');
      return;
    }

    const exportData = exportDataToUse.map((item: any) => ({
      Producto: item.product?.name || 'N/A',
      Sucursal: item.branch,
      Cantidad: item.quantity,
      'Stock Mínimo': item.minStock,
      Valor: item.product?.cost ? Number(item.product.cost) * item.quantity : 0,
      Estado: item.isLowStock ? 'Bajo Stock' : 'Normal',
    }));

    const fileName = showLowStockOnly
      ? `Reporte_Inventario_BajoStock_${new Date().toISOString().split('T')[0]}`
      : `Reporte_Inventario_Completo_${new Date().toISOString().split('T')[0]}`;
    exportToExcel(exportData, fileName, showLowStockOnly ? 'Bajo Stock' : 'Inventario');
    showToast('Reporte exportado a Excel exitosamente', 'success');
  };

  const handleExportPDF = () => {
    const exportDataToUse = showLowStockOnly ? (data?.lowStock || []) : (data?.stocks || []);
    if (!exportDataToUse || exportDataToUse.length === 0) {
      showToast('No hay datos para exportar', 'error');
      return;
    }

    const columns = [
      { header: 'Producto', dataKey: 'product', width: 100 },
      { header: 'Sucursal', dataKey: 'branch', width: 70 },
      { header: 'Cantidad', dataKey: 'quantity', width: 50 },
      { header: 'Stock Mínimo', dataKey: 'minStock', width: 60 },
      { header: 'Valor', dataKey: 'value', width: 60 },
      { header: 'Estado', dataKey: 'status', width: 60 },
    ];

    const exportData = exportDataToUse.map((item: any) => ({
      product: item.product?.name || 'N/A',
      branch: item.branch,
      quantity: item.quantity,
      minStock: item.minStock,
      value: item.product?.cost ? Number(item.product.cost) * item.quantity : 0,
      status: item.isLowStock ? 'Bajo Stock' : 'Normal',
    }));

    const summary = {
      'Total Productos': data.totalProducts || 0,
      'Productos Bajo Stock': data.lowStockCount || 0,
      'Valor Total Inventario': data.totalValue || 0,
    };

    const fileName = showLowStockOnly
      ? `Reporte_Inventario_BajoStock_${new Date().toISOString().split('T')[0]}`
      : `Reporte_Inventario_Completo_${new Date().toISOString().split('T')[0]}`;
    const title = showLowStockOnly
      ? 'Reporte de Inventario - Productos Bajo Stock'
      : 'Reporte de Inventario Completo';

    exportToPDF(exportData, columns, fileName, title, summary);
    showToast('Reporte exportado a PDF exitosamente', 'success');
  };

  // Filter and pagination calculations
  const displayData = showLowStockOnly ? (data?.lowStock || []) : (data?.stocks || []);
  const totalItems = displayData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = displayData.slice(startIndex, endIndex);

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
              disabled={!displayData || displayData.length === 0}
              className="flex items-center space-x-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-slate-200 dark:disabled:bg-slate-700"
            >
              <HiDownload className="w-4 h-4" />
              <span>Excel</span>
            </button>
            <button
              onClick={handleExportPDF}
              disabled={!displayData || displayData.length === 0}
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
          <div className="relative">
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Categorías</label>
            <button
              type="button"
              onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
              className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-3 py-2 text-left text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-slate-500 dark:focus:ring-slate-800"
            >
              <span className="text-sm text-slate-700 dark:text-slate-300">
                {categoryIds.length === 0 ? 'Todas' : `${categoryIds.length} seleccionada(s)`}
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
                        checked={categoryIds.includes(category.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setCategoryIds([...categoryIds, category.id]);
                          } else {
                            setCategoryIds(categoryIds.filter(id => id !== category.id));
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
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Filtro</label>
            <label className="flex items-center mt-2">
              <input
                type="checkbox"
                checked={showLowStockOnly}
                onChange={(e) => {
                  setShowLowStockOnly(e.target.checked);
                  setCurrentPage(1);
                }}
                className="rounded border-slate-300 text-slate-900 focus:ring-slate-400 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-slate-700"
              />
              <span className="ml-2 text-sm text-slate-700 dark:text-slate-300">Solo productos bajo stock</span>
            </label>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => {
              setBranchId('');
              setCategoryIds([]);
              setShowLowStockOnly(false);
              setShowCategoryDropdown(false);
            }}
            className="flex items-center space-x-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <HiXCircle className="w-4 h-4" />
            <span>Limpiar Filtros</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/70">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Productos</p>
          <p className="mt-2 text-3xl font-bold text-slate-950 dark:text-slate-100">
            {data?.totalProducts || 0}
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/70">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Productos Bajo Stock</p>
          <p className="mt-2 text-3xl font-bold text-slate-950 dark:text-slate-100">
            {data?.lowStockCount || 0}
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/70">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Valor Total Inventario</p>
          <p className="mt-2 text-2xl font-bold text-slate-950 dark:text-slate-100">
            {formatCurrency(data?.totalValue || 0)}
          </p>
        </div>
      </div>

      {/* Inventory Table */}
      {displayData && displayData.length > 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/70">
          <h3 className="mb-4 text-lg font-semibold text-slate-950 dark:text-slate-100">
            {showLowStockOnly ? 'Productos Bajo Stock Mínimo' : 'Inventario Completo'}
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
              <thead className="bg-slate-100/70 dark:bg-slate-900/80">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500 dark:text-slate-400">Producto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-slate-500 dark:text-slate-400">Sucursal</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase text-slate-500 dark:text-slate-400">Cantidad</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase text-slate-500 dark:text-slate-400">Stock Mínimo</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase text-slate-500 dark:text-slate-400">Valor</th>
                  <th className="px-6 py-3 text-center text-xs font-medium uppercase text-slate-500 dark:text-slate-400">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-800 dark:bg-slate-950/50">
                {currentData.map((item: any, index: number) => (
                  <tr key={index} className="hover:bg-slate-100/70 dark:hover:bg-slate-900/70">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-950 dark:text-slate-100">
                      {item.product?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                      {item.branch}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-medium ${
                      item.isLowStock ? 'text-rose-500 dark:text-rose-400' : 'text-slate-950 dark:text-slate-100'
                    }`}>
                      {item.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-slate-500 dark:text-slate-400">
                      {item.minStock}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-slate-500 dark:text-slate-400">
                      {item.product?.cost ? formatCurrency(Number(item.product.cost) * item.quantity) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {item.isLowStock ? (
                        <span className="rounded-full bg-rose-100 px-2 py-1 text-xs font-semibold text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">
                          Bajo Stock
                        </span>
                      ) : (
                        <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                          Normal
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between border-t border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-950/40 sm:px-6">
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
            <p className="text-lg font-medium mb-2">
              {showLowStockOnly ? 'No hay productos bajo stock' : 'No hay productos en inventario'}
            </p>
            <p className="text-sm">
              {showLowStockOnly 
                ? 'Todos los productos tienen stock suficiente'
                : 'No se encontraron productos registrados'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryReportTab;
