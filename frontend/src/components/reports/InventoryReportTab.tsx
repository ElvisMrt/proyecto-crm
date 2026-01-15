import { useEffect, useState } from 'react';
import { reportsApi, branchesApi } from '../../services/api';
import { exportToExcel, exportToPDF } from '../../utils/exportUtils';
import { HiDownload, HiDocumentDownload, HiXCircle } from 'react-icons/hi';
import { useToast } from '../../contexts/ToastContext';

const InventoryReportTab = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [branches, setBranches] = useState<any[]>([]);
  const [branchId, setBranchId] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

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
    return <div className="text-center py-12 text-gray-500">No hay datos disponibles</div>;
  }

  return (
    <div className="space-y-6">
      {/* Filter */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Filtros</h3>
          <div className="flex space-x-2">
            <button
              onClick={handleExportExcel}
              disabled={!displayData || displayData.length === 0}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-md flex items-center space-x-2"
            >
              <HiDownload className="w-4 h-4" />
              <span>Excel</span>
            </button>
            <button
              onClick={handleExportPDF}
              disabled={!displayData || displayData.length === 0}
              className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-md flex items-center space-x-2"
            >
              <HiDocumentDownload className="w-4 h-4" />
              <span>PDF</span>
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filtro</label>
            <label className="flex items-center mt-2">
              <input
                type="checkbox"
                checked={showLowStockOnly}
                onChange={(e) => {
                  setShowLowStockOnly(e.target.checked);
                  setCurrentPage(1);
                }}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Solo productos bajo stock</span>
            </label>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => {
              setBranchId('');
              setShowLowStockOnly(false);
            }}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            <HiXCircle className="w-4 h-4" />
            <span>Limpiar Filtros</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <p className="text-sm font-medium text-gray-600">Total Productos</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {data?.totalProducts || 0}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
          <p className="text-sm font-medium text-gray-600">Productos Bajo Stock</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {data?.lowStockCount || 0}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <p className="text-sm font-medium text-gray-600">Valor Total Inventario</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {formatCurrency(data?.totalValue || 0)}
          </p>
        </div>
      </div>

      {/* Inventory Table */}
      {displayData && displayData.length > 0 ? (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {showLowStockOnly ? 'Productos Bajo Stock Mínimo' : 'Inventario Completo'}
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sucursal</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Stock Mínimo</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Valor</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentData.map((item: any, index: number) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.product?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.branch}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-medium ${
                      item.isLowStock ? 'text-red-600' : 'text-gray-900'
                    }`}>
                      {item.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                      {item.minStock}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                      {item.product?.cost ? formatCurrency(Number(item.product.cost) * item.quantity) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {item.isLowStock ? (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                          Bajo Stock
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
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
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-4">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
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
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
                              <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                                ...
                              </span>
                            )}
                            <button
                              onClick={() => setCurrentPage(page)}
                              className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                currentPage === page
                                  ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                  : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
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
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center py-12 text-gray-500">
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


