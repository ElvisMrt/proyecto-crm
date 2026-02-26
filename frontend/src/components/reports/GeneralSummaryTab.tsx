import { useEffect, useState } from 'react';
import { reportsApi, branchesApi } from '../../services/api';
import { exportToExcel, exportToPDF } from '../../utils/exportUtils';
import { HiDownload, HiDocumentDownload, HiXCircle } from 'react-icons/hi';
import { useToast } from '../../contexts/ToastContext';

const GeneralSummaryTab = () => {
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

      const response = await reportsApi.getGeneralSummary(params);
      console.log('General Summary Response from API:', response);
      
      // Verify data is real (not mock)
      if (response && typeof response === 'object') {
        console.log('Data verification:', {
          hasSalesToday: !!response.salesToday,
          hasSalesMonth: !!response.salesMonth,
          hasReceivables: !!response.receivables,
          hasCash: !!response.cash,
          hasLowStockProducts: Array.isArray(response.lowStockProducts),
          hasChartData: Array.isArray(response.chartData),
          hasTopProducts: Array.isArray(response.topProducts),
          hasBestClients: Array.isArray(response.bestClients),
        });
        setData(response);
      } else {
        console.error('Invalid response format:', response);
        showToast('Error: Datos inválidos recibidos del servidor', 'error');
        setData(null);
      }
    } catch (error: any) {
      console.error('Error fetching summary:', error);
      console.error('Error details:', error?.response?.data);
      showToast(error?.response?.data?.error?.message || 'Error al cargar el resumen general', 'error');
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
    if (!data) {
      showToast('No hay datos para exportar', 'error');
      return;
    }

    const exportData = [
      { 'Concepto': 'Ventas Hoy', 'Monto': data.salesToday?.amount || 0, 'Cantidad': data.salesToday?.count || 0 },
      { 'Concepto': 'Ventas del Mes', 'Monto': data.salesMonth?.amount || 0 },
      { 'Concepto': 'Total por Cobrar', 'Monto': data.receivables?.total || 0 },
      { 'Concepto': 'Total Vencido', 'Monto': data.receivables?.overdue || 0 },
      { 'Concepto': 'Balance de Caja', 'Monto': data.cash?.balance || 0, 'Estado': data.cash?.status === 'OPEN' ? 'Abierta' : 'Cerrada' },
      { 'Concepto': 'Productos Bajo Stock', 'Cantidad': data.lowStockProducts?.length || 0 },
    ];

    exportToExcel(exportData, `Resumen_General_${filters.startDate}_${filters.endDate}`, 'Resumen General');
    showToast('Reporte exportado a Excel exitosamente', 'success');
  };

  const handleExportPDF = () => {
    if (!data) {
      showToast('No hay datos para exportar', 'error');
      return;
    }

    const columns = [
      { header: 'Concepto', dataKey: 'concepto', width: 100 },
      { header: 'Monto', dataKey: 'monto', width: 80 },
      { header: 'Cantidad', dataKey: 'cantidad', width: 60 },
      { header: 'Estado', dataKey: 'estado', width: 60 },
    ];

    const exportData = [
      { concepto: 'Ventas Hoy', monto: data.salesToday?.amount || 0, cantidad: data.salesToday?.count || 0, estado: '-' },
      { concepto: 'Ventas del Mes', monto: data.salesMonth?.amount || 0, cantidad: '-', estado: '-' },
      { concepto: 'Total por Cobrar', monto: data.receivables?.total || 0, cantidad: '-', estado: '-' },
      { concepto: 'Total Vencido', monto: data.receivables?.overdue || 0, cantidad: '-', estado: '-' },
      { concepto: 'Balance de Caja', monto: data.cash?.balance || 0, cantidad: '-', estado: data.cash?.status === 'OPEN' ? 'Abierta' : 'Cerrada' },
      { concepto: 'Productos Bajo Stock', monto: 0, cantidad: data.lowStockProducts?.length || 0, estado: '-' },
    ];

    const summary = {
      'Período': `${formatDate(filters.startDate)} - ${formatDate(filters.endDate)}`,
      'Sucursal': filters.branchId ? branches.find(b => b.id === filters.branchId)?.name || 'Todas' : 'Todas',
    };

    exportToPDF(
      exportData,
      columns,
      `Resumen_General_${filters.startDate}_${filters.endDate}`,
      'Resumen General',
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

  // Calculate net profit (sales - estimated costs - estimated expenses)
  // Using a simplified calculation: assuming 30% margin and 10% expenses
  const salesAmount = data.salesMonth?.amount || 0;
  const estimatedCosts = salesAmount * 0.7; // 70% cost
  const estimatedExpenses = salesAmount * 0.1; // 10% expenses
  const netProfit = salesAmount - estimatedCosts - estimatedExpenses;
  const netProfitPercent = salesAmount > 0 ? Math.round((netProfit / salesAmount) * 100) : 0;

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sucursal</label>
            <select
              value={filters.branchId}
              onChange={(e) => setFilters({ ...filters, branchId: e.target.value })}
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            <HiXCircle className="w-4 h-4" />
            <span>Limpiar Filtros</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-600">Ventas Hoy</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {formatCurrency(data.salesToday?.amount || 0)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {data.salesToday?.count || 0} Ventas
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-600">Ingresos</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {formatCurrency(data.salesMonth?.amount || 0)}
          </p>
            <p className="text-xs text-gray-500 mt-1">
            Mes actual
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-600">Ganancia Neta Estimada</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {formatCurrency(netProfit)}
          </p>
          <div className="flex items-center mt-1">
            <span className={`text-sm ${netProfitPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {netProfitPercent >= 0 ? '↑' : '↓'} {Math.abs(netProfitPercent)}%
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-600">Productos Críticos</p>
          {data.lowStockProducts && data.lowStockProducts.length > 0 ? (
            <>
              <p className="text-lg font-bold text-orange-900 mt-2">
                {data.lowStockProducts[0].name}
              </p>
              <p className="text-xs text-orange-700 mt-1">
                Stock bajo. {data.lowStockProducts[0].stock} unid.
              </p>
            </>
          ) : (
            <p className="text-sm text-gray-500 mt-2">Sin productos críticos</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-600">Caja</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {formatCurrency(data.cash?.balance || 0)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {data.cash?.status === 'OPEN' ? 'Abierta' : 'Cerrada'}
          </p>
        </div>
      </div>

      {/* Chart Section */}
      {data.chartData && data.chartData.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Ventas vs. Ingresos vs. Egresos</h3>
            <div className="flex space-x-2 text-sm">
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">Ventas</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded">Ingresos</span>
              <span className="px-2 py-1 bg-red-100 text-red-800 rounded">Egresos</span>
            </div>
          </div>
          <div className="h-64 flex items-end space-x-1">
            {data.chartData.slice(-7).map((item: any, index: number) => {
              const maxValue = Math.max(
                ...data.chartData.map((d: any) => Math.max(d.sales || 0, d.income || 0, d.expenses || 0)),
                1
              );
              const salesHeight = maxValue > 0 ? (item.sales / maxValue) * 100 : 0;
              const incomeHeight = maxValue > 0 ? (item.income / maxValue) * 100 : 0;
              const expensesHeight = maxValue > 0 ? (item.expenses / maxValue) * 100 : 0;
              return (
                <div key={index} className="flex-1 flex flex-col items-center space-y-1 group">
                  <div className="w-full flex flex-col justify-end space-y-0.5 relative" style={{ height: '200px' }}>
                    <div
                      className="bg-blue-500 rounded-t hover:bg-blue-600 transition-colors cursor-pointer relative"
                      style={{
                        height: `${salesHeight}%`,
                        minHeight: salesHeight > 0 ? '2px' : '0',
                      }}
                      title={`Ventas: ${formatCurrency(item.sales || 0)}`}
                    >
                      {salesHeight > 5 && (
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                          {formatCurrency(item.sales || 0)}
                        </div>
                      )}
                    </div>
                    <div
                      className="bg-green-500 rounded-t hover:bg-green-600 transition-colors cursor-pointer relative"
                      style={{
                        height: `${incomeHeight}%`,
                        minHeight: incomeHeight > 0 ? '2px' : '0',
                      }}
                      title={`Ingresos: ${formatCurrency(item.income || 0)}`}
                    >
                      {incomeHeight > 5 && (
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                          {formatCurrency(item.income || 0)}
                        </div>
                      )}
                    </div>
                    <div
                      className="bg-red-500 rounded-t hover:bg-red-600 transition-colors cursor-pointer relative"
                      style={{
                        height: `${expensesHeight}%`,
                        minHeight: expensesHeight > 0 ? '2px' : '0',
                      }}
                      title={`Egresos: ${formatCurrency(item.expenses || 0)}`}
                    >
                      {expensesHeight > 5 && (
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                          {formatCurrency(item.expenses || 0)}
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 transform -rotate-45 origin-top-left whitespace-nowrap">
                    {new Date(item.date).toLocaleDateString('es-DO', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom Lists */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Top Products */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Productos Más Vendidos</h3>
          <div className="space-y-3">
            {data.topProducts && data.topProducts.length > 0 ? (
              data.topProducts.map((item: any, index: number) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-900">{item.product.name}</span>
                  <span className="text-sm font-medium text-gray-600">
                    {formatCurrency(item.total)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No hay datos</p>
            )}
          </div>
        </div>

        {/* Best Clients */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Mejores Clientes</h3>
          <div className="space-y-3">
            {data.bestClients && data.bestClients.length > 0 ? (
              data.bestClients.map((item: any, index: number) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-900">{item.client.name}</span>
                  <span className="text-sm font-medium text-gray-600">
                    {formatCurrency(item.total)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No hay datos</p>
            )}
          </div>
        </div>

        {/* Recent Activity or Additional Info */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen de Cuentas por Cobrar</h3>
          <div className="space-y-3">
            {data.receivables ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total por Cobrar</span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatCurrency(data.receivables.total || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Vencido</span>
                  <span className="text-sm font-medium text-red-600">
                    {formatCurrency(data.receivables.overdue || 0)}
                  </span>
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-500">No hay datos</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneralSummaryTab;



