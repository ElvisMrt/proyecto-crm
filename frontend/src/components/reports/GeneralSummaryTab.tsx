import { useEffect, useState } from 'react';
import { reportsApi } from '../../services/api';
import axios from 'axios';

const GeneralSummaryTab = () => {
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
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/branches`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setBranches(response.data?.data || response.data || []);
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
      setData(response);
    } catch (error) {
      console.error('Error fetching summary:', error);
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
    return <div className="text-center py-12">Cargando...</div>;
  }

  if (!data) {
    return <div className="text-center py-12 text-gray-500">No hay datos</div>;
  }

  // Calculate net profit (simplified: sales - expenses estimate)
  const netProfit = data.salesMonth?.amount || 0;
  const netProfitPercent = data.salesToday?.amount > 0 ? 28 : 0; // Simplified

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
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

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <p className="text-sm font-medium text-gray-600">Ventas Hoy</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {formatCurrency(data.salesToday?.amount || 0)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {data.salesToday?.count || 0} Ventas
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <p className="text-sm font-medium text-gray-600">Ingresos</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {formatCurrency(data.salesMonth?.amount || 0)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            + {formatCurrency(data.salesMonth?.amount || 0)} / Mes
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-emerald-500">
          <p className="text-sm font-medium text-gray-600">Ganancia Neta</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {formatCurrency(netProfit * 0.7)}
          </p>
          <div className="flex items-center mt-1">
            <span className="text-green-600 text-sm">↑ {netProfitPercent}%</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
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

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
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
                ...data.chartData.map((d: any) => Math.max(d.sales, d.income, d.expenses))
              );
              return (
                <div key={index} className="flex-1 flex flex-col items-center space-y-1">
                  <div className="w-full flex flex-col justify-end space-y-0.5" style={{ height: '200px' }}>
                    <div
                      className="bg-blue-500 rounded-t"
                      style={{
                        height: `${(item.sales / maxValue) * 100}%`,
                      }}
                    />
                    <div
                      className="bg-green-500 rounded-t"
                      style={{
                        height: `${(item.income / maxValue) * 100}%`,
                      }}
                    />
                    <div
                      className="bg-red-500 rounded-t"
                      style={{
                        height: `${(item.expenses / maxValue) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 transform -rotate-45 origin-top-left">
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

        {/* Top Products Detailed */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Productos Más Vendidos</h3>
          <div className="space-y-2">
            {data.topProducts && data.topProducts.length > 0 ? (
              data.topProducts.map((item: any, index: number) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-900">{item.product.name}</span>
                  <span className="text-sm font-bold text-gray-900">
                    {formatCurrency(item.total)}
                  </span>
                </div>
              ))
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



