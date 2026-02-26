import { useState, useEffect } from 'react';
import api from '../../services/api';
import { HiDownload, HiShoppingCart, HiCheckCircle, HiClock } from 'react-icons/hi';

interface PurchaseReportData {
  id: string;
  code: string;
  supplier: string;
  purchaseDate: string;
  status: string;
  total: number;
  hasInvoice: boolean;
}

const PurchasesReportTab = () => {
  const [purchases, setPurchases] = useState<PurchaseReportData[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [summary, setSummary] = useState({
    totalPurchases: 0,
    totalAmount: 0,
    pending: 0,
    received: 0,
  });

  useEffect(() => {
    fetchReport();
  }, [startDate, endDate, statusFilter]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        startDate,
        endDate,
        ...(statusFilter !== 'ALL' && { status: statusFilter }),
      });
      const response = await api.get(`/reports/purchases?${params}`);
      setPurchases(response.data.data || []);
      setSummary(response.data.summary || {
        totalPurchases: 0,
        totalAmount: 0,
        pending: 0,
        received: 0,
      });
    } catch (error) {
      console.error('Error fetching purchases report:', error);
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
    return new Date(dateString).toLocaleDateString('es-DO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; className: string }> = {
      PENDING: { label: 'Pendiente', className: 'bg-yellow-100 text-yellow-800' },
      RECEIVED: { label: 'Recibida', className: 'bg-green-100 text-green-800' },
      CANCELLED: { label: 'Cancelada', className: 'bg-gray-100 text-gray-800' },
    };
    const badge = badges[status] || badges.PENDING;
    return <span className={`px-2 py-1 text-xs font-medium rounded ${badge.className}`}>{badge.label}</span>;
  };

  const exportToCSV = () => {
    const headers = ['Código', 'Proveedor', 'Fecha', 'Estado', 'Total', 'Tiene Factura'];
    const rows = purchases.map(p => [
      p.code,
      p.supplier,
      formatDate(p.purchaseDate),
      p.status,
      p.total,
      p.hasInvoice ? 'Sí' : 'No'
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte-compras-${startDate}-${endDate}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Inicio</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Fin</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="ALL">Todos</option>
              <option value="PENDING">Pendiente</option>
              <option value="RECEIVED">Recibida</option>
              <option value="CANCELLED">Cancelada</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={exportToCSV}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
            >
              <HiDownload className="w-4 h-4" />
              Exportar
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Compras</p>
              <p className="text-2xl font-bold text-gray-900">{summary.totalPurchases}</p>
            </div>
            <HiShoppingCart className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Monto Total</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.totalAmount)}</p>
            </div>
            <HiShoppingCart className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pendientes</p>
              <p className="text-2xl font-bold text-yellow-600">{summary.pending}</p>
            </div>
            <HiClock className="w-8 h-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Recibidas</p>
              <p className="text-2xl font-bold text-green-600">{summary.received}</p>
            </div>
            <HiCheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Proveedor</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Factura</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {purchases.map((purchase) => (
                <tr key={purchase.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{purchase.code}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{purchase.supplier}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{formatDate(purchase.purchaseDate)}</td>
                  <td className="px-4 py-3 text-sm text-center">{getStatusBadge(purchase.status)}</td>
                  <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">{formatCurrency(purchase.total)}</td>
                  <td className="px-4 py-3 text-sm text-center">
                    {purchase.hasInvoice ? (
                      <span className="px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800">Sí</span>
                    ) : (
                      <span className="text-gray-400">No</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {purchases.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No hay datos para mostrar en el rango seleccionado</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PurchasesReportTab;
