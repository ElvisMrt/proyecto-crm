import { useEffect, useState } from 'react';
import { cashApi, branchesApi } from '../../services/api';
import { exportToExcel, exportToPDF } from '../../utils/exportUtils';
import { HiDocumentDownload, HiTable, HiOfficeBuilding, HiLockOpen, HiLockClosed, HiCalendar, HiX, HiSearch } from 'react-icons/hi';

const HistoryTab = () => {
  const [history, setHistory] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    branchId: '',
    status: '',
    startDate: '',
    endDate: '',
    page: 1,
    limit: 10,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      const response = await branchesApi.getBranches();
      const branchesData = response?.data || response || [];
      setBranches(branchesData);
    } catch (error: any) {
      // Si falla por permisos, intentar con el endpoint directo
      if (error.response?.status === 403 || error.response?.status === 401) {
        try {
          const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
          const token = localStorage.getItem('token');
          const directResponse = await fetch(`${API_BASE_URL}/branches`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          
          if (directResponse.ok) {
            const data = await directResponse.json();
            const branchesData = data?.data || data || [];
            setBranches(branchesData);
          }
        } catch (err) {
          console.error('Error fetching branches:', err);
        }
      } else {
        console.error('Error fetching branches:', error);
      }
    }
  };

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: filters.page,
        limit: filters.limit,
      };
      if (filters.branchId) params.branchId = filters.branchId;
      if (filters.status) params.status = filters.status;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const response = await cashApi.getHistory(params);
      setHistory(response.data || []);
      setPagination(response.pagination || pagination);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [filters.page, filters.branchId, filters.status, filters.startDate, filters.endDate]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('es-DO');
  };

  const handleExportExcel = () => {
    const exportData = history.map((item) => ({
      'Sucursal': item.branch?.name || '-',
      'Estado': item.status === 'OPEN' ? 'Abierta' : 'Cerrada',
      'Monto Inicial': item.initialAmount,
      'Ingresos': item.totalIncome,
      'Egresos': item.totalExpenses,
      'Balance': item.balance,
      'Diferencia': item.difference !== null ? item.difference : 0,
      'Fecha Apertura': item.openedAt ? new Date(item.openedAt).toLocaleDateString('es-DO') : '-',
      'Fecha Cierre': item.closedAt ? new Date(item.closedAt).toLocaleDateString('es-DO') : '-',
      'Abierta por': item.openedBy?.name || '-',
    }));
    exportToExcel(exportData, 'Historial_Caja', 'Historial de Caja');
  };

  const handleExportPDF = () => {
    const exportData = history.map((item) => ({
      'Sucursal': item.branch?.name || '-',
      'Estado': item.status === 'OPEN' ? 'Abierta' : 'Cerrada',
      'Monto Inicial': item.initialAmount,
      'Ingresos': item.totalIncome,
      'Egresos': item.totalExpenses,
      'Balance': item.balance,
      'Diferencia': item.difference !== null ? item.difference : 0,
      'Fecha Apertura': item.openedAt ? new Date(item.openedAt).toLocaleDateString('es-DO') : '-',
      'Fecha Cierre': item.closedAt ? new Date(item.closedAt).toLocaleDateString('es-DO') : '-',
      'Abierta por': item.openedBy?.name || '-',
    }));
    exportToPDF(
      exportData,
      [
        { header: 'Sucursal', dataKey: 'Sucursal' },
        { header: 'Estado', dataKey: 'Estado' },
        { header: 'Monto Inicial', dataKey: 'Monto Inicial' },
        { header: 'Ingresos', dataKey: 'Ingresos' },
        { header: 'Egresos', dataKey: 'Egresos' },
        { header: 'Balance', dataKey: 'Balance' },
        { header: 'Diferencia', dataKey: 'Diferencia' },
        { header: 'Fecha Apertura', dataKey: 'Fecha Apertura' },
        { header: 'Fecha Cierre', dataKey: 'Fecha Cierre' },
        { header: 'Abierta por', dataKey: 'Abierta por' },
      ],
      'Historial_Caja',
      'Historial de Caja'
    );
  };

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <HiOfficeBuilding className="w-4 h-4 mr-1 text-gray-400" />
              Sucursal
            </label>
            <select
              value={filters.branchId}
              onChange={(e) => setFilters({ ...filters, branchId: e.target.value, page: 1 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
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
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <HiLockOpen className="w-4 h-4 mr-1 text-gray-400" />
              Estado
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos</option>
              <option value="OPEN">Abierta</option>
              <option value="CLOSED">Cerrada</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <HiCalendar className="w-4 h-4 mr-1 text-gray-400" />
              Desde
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value, page: 1 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <HiCalendar className="w-4 h-4 mr-1 text-gray-400" />
              Hasta
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value, page: 1 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex items-end space-x-2">
            <button
              onClick={fetchHistory}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md flex items-center justify-center"
            >
              <HiSearch className="w-4 h-4 mr-2" />
              Buscar
            </button>
            <button
              onClick={() => {
                setFilters({
                  branchId: '',
                  status: '',
                  startDate: '',
                  endDate: '',
                  page: 1,
                  limit: 10,
                });
              }}
              className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium rounded-md flex items-center"
            >
              <HiX className="w-4 h-4 mr-1" />
              Limpiar
            </button>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="text-center py-12">Cargando...</div>
        ) : history.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No hay registros de caja</div>
        ) : (
          <>
            {history.length > 0 && (
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Registros de Caja</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={handleExportExcel}
                    className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded flex items-center space-x-1"
                  >
                    <HiTable className="w-4 h-4" />
                    <span>Excel</span>
                  </button>
                  <button
                    onClick={handleExportPDF}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded flex items-center space-x-1"
                  >
                    <HiDocumentDownload className="w-4 h-4" />
                    <span>PDF</span>
                  </button>
                </div>
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sucursal</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monto Inicial</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ingresos</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Egresos</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Balance</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Diferencia</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Abierta</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cerrada</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Abierta por</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {history.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.branch?.name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full flex items-center w-fit ${
                          item.status === 'OPEN'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {item.status === 'OPEN' ? (
                            <>
                              <HiLockOpen className="w-3 h-3 mr-1" />
                              Abierta
                            </>
                          ) : (
                            <>
                              <HiLockClosed className="w-3 h-3 mr-1" />
                              Cerrada
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(item.initialAmount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                        {formatCurrency(item.totalIncome)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                        {formatCurrency(item.totalExpenses)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(item.balance)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {item.difference !== null ? (
                          <span className={item.difference === 0 ? 'text-green-600' : 'text-red-600 font-medium'}>
                            {formatCurrency(item.difference)}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(item.openedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(item.closedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.openedBy?.name || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {pagination.totalPages > 1 && (
              <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200">
                <div className="text-sm text-gray-700">
                  Mostrando {((pagination.page - 1) * pagination.limit) + 1} a{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} de{' '}
                  {pagination.total} registros
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                    disabled={filters.page === 1}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                    disabled={filters.page >= pagination.totalPages}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default HistoryTab;



