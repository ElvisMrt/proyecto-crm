import { useEffect, useState } from 'react';
import { reportsApi, branchesApi } from '../../services/api';
import { exportToExcel, exportToPDF } from '../../utils/exportUtils';
import { HiDownload, HiDocumentDownload } from 'react-icons/hi';
import { useToast } from '../../contexts/ToastContext';

const InventoryReportTab = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [branches, setBranches] = useState<any[]>([]);
  const [branchId, setBranchId] = useState('');

  useEffect(() => {
    fetchBranches();
    fetchData();
  }, []);

  useEffect(() => {
    fetchData();
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
    } catch (error) {
      console.error('Error fetching inventory report:', error);
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
    if (!data?.lowStock || data.lowStock.length === 0) {
      showToast('No hay datos para exportar', 'error');
      return;
    }

    const exportData = data.lowStock.map((item: any) => ({
      Producto: item.product.name,
      Sucursal: item.branch,
      Cantidad: item.quantity,
      'Stock Mínimo': item.minStock,
    }));

    exportToExcel(exportData, `Reporte_Inventario_BajoStock_${new Date().toISOString().split('T')[0]}`, 'Bajo Stock');
    showToast('Reporte exportado a Excel exitosamente', 'success');
  };

  const handleExportPDF = () => {
    if (!data?.lowStock || data.lowStock.length === 0) {
      showToast('No hay datos para exportar', 'error');
      return;
    }

    const columns = [
      { header: 'Producto', dataKey: 'product', width: 100 },
      { header: 'Sucursal', dataKey: 'branch', width: 70 },
      { header: 'Cantidad', dataKey: 'quantity', width: 50 },
      { header: 'Stock Mínimo', dataKey: 'minStock', width: 60 },
    ];

    const exportData = data.lowStock.map((item: any) => ({
      product: item.product.name,
      branch: item.branch,
      quantity: item.quantity,
      minStock: item.minStock,
    }));

    const summary = {
      'Total Productos': data.totalProducts || 0,
      'Productos Bajo Stock': data.lowStockCount || 0,
      'Valor Total Inventario': data.totalValue || 0,
    };

    exportToPDF(
      exportData,
      columns,
      `Reporte_Inventario_BajoStock_${new Date().toISOString().split('T')[0]}`,
      'Reporte de Inventario - Productos Bajo Stock',
      summary
    );
    showToast('Reporte exportado a PDF exitosamente', 'success');
  };

  if (loading) {
    return <div className="text-center py-12">Cargando...</div>;
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
              disabled={!data?.lowStock || data.lowStock.length === 0}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-md flex items-center space-x-2"
            >
              <HiDownload className="w-4 h-4" />
              <span>Excel</span>
            </button>
            <button
              onClick={handleExportPDF}
              disabled={!data?.lowStock || data.lowStock.length === 0}
              className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-md flex items-center space-x-2"
            >
              <HiDocumentDownload className="w-4 h-4" />
              <span>PDF</span>
            </button>
          </div>
        </div>
        <div className="max-w-xs">
          <label className="block text-sm font-medium text-gray-700 mb-1">Sucursal</label>
          <select
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
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

      {/* Low Stock Products */}
      {data?.lowStock && data.lowStock.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Productos Bajo Stock Mínimo</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sucursal</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Mínimo</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.lowStock.map((item: any, index: number) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.product.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.branch}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-red-600 font-medium">
                      {item.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                      {item.minStock}
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

export default InventoryReportTab;


