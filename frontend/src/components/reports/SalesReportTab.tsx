import { useEffect, useState } from 'react';
import { reportsApi, clientsApi, branchesApi } from '../../services/api';
import { exportToExcel, exportToPDF } from '../../utils/exportUtils';
import { HiDownload, HiDocumentDownload } from 'react-icons/hi';
import { useToast } from '../../contexts/ToastContext';

const SalesReportTab = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [branches, setBranches] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    branchId: '',
    clientId: '',
    startDate: new Date(new Date().setDate(1)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    status: '',
  });

  useEffect(() => {
    fetchBranches();
    fetchClients();
    fetchData();
  }, []);

  useEffect(() => {
    fetchData();
  }, [filters.branchId, filters.clientId, filters.startDate, filters.endDate, filters.status]);

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

  const fetchData = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filters.branchId) params.branchId = filters.branchId;
      if (filters.clientId) params.clientId = filters.clientId;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.status) params.status = filters.status;

      const response = await reportsApi.getSalesReport(params);
      setData(response);
    } catch (error) {
      console.error('Error fetching sales report:', error);
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

    const exportData = data.data.map((invoice: any) => ({
      Número: invoice.number,
      Fecha: formatDate(invoice.date),
      Cliente: invoice.client,
      Sucursal: invoice.branch || '-',
      Total: invoice.total,
      Estado: invoice.status,
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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
            <select
              value={filters.clientId}
              onChange={(e) => setFilters({ ...filters, clientId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Todos</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Todos</option>
              <option value="ISSUED">Emitidas</option>
              <option value="PAID">Pagadas</option>
              <option value="OVERDUE">Vencidas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary */}
      {data?.summary && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Total Ventas</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(data.summary.total)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Cantidad de Facturas</p>
              <p className="text-2xl font-bold text-gray-900">{data.summary.count}</p>
            </div>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Número</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sucursal</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.data.map((invoice: any) => (
                  <tr key={invoice.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {invoice.number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(invoice.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {invoice.client}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {invoice.branch || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                      {formatCurrency(invoice.total)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          invoice.status === 'PAID'
                            ? 'bg-green-100 text-green-800'
                            : invoice.status === 'OVERDUE'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {invoice.status}
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

export default SalesReportTab;


