import { useState, useEffect } from 'react';
import api from '../../services/api';
import { HiDownload, HiTruck, HiCurrencyDollar, HiExclamationCircle } from 'react-icons/hi';

interface SupplierReportData {
  id: string;
  code: string;
  name: string;
  totalPurchased: number;
  totalPaid: number;
  totalBalance: number;
  invoicesCount: number;
  overdueInvoices: number;
  isActive: boolean;
}

const SuppliersReportTab = () => {
  const [suppliers, setSuppliers] = useState<SupplierReportData[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalSuppliers: 0,
    activeSuppliers: 0,
    totalDebt: 0,
    totalOverdue: 0,
  });

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const response = await api.get('/reports/suppliers');
      setSuppliers(response.data.data || []);
      setSummary(response.data.summary || {
        totalSuppliers: 0,
        activeSuppliers: 0,
        totalDebt: 0,
        totalOverdue: 0,
      });
    } catch (error) {
      console.error('Error fetching suppliers report:', error);
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

  const exportToCSV = () => {
    const headers = ['Código', 'Proveedor', 'Total Comprado', 'Total Pagado', 'Saldo', 'Facturas', 'Vencidas', 'Estado'];
    const rows = suppliers.map(s => [
      s.code,
      s.name,
      s.totalPurchased,
      s.totalPaid,
      s.totalBalance,
      s.invoicesCount,
      s.overdueInvoices,
      s.isActive ? 'Activo' : 'Inactivo'
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte-proveedores-${new Date().toISOString().split('T')[0]}.csv`;
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
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Proveedores</p>
              <p className="text-2xl font-bold text-gray-900">{summary.totalSuppliers}</p>
              <p className="text-xs text-gray-500">{summary.activeSuppliers} activos</p>
            </div>
            <HiTruck className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Deuda Total</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(summary.totalDebt)}</p>
              <p className="text-xs text-gray-500">Por pagar</p>
            </div>
            <HiCurrencyDollar className="w-8 h-8 text-red-600" />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Deuda Vencida</p>
              <p className="text-2xl font-bold text-orange-600">{formatCurrency(summary.totalOverdue)}</p>
              <p className="text-xs text-gray-500">Atrasada</p>
            </div>
            <HiExclamationCircle className="w-8 h-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Proveedores Activos</p>
              <p className="text-2xl font-bold text-green-600">{summary.activeSuppliers}</p>
              <p className="text-xs text-gray-500">{((summary.activeSuppliers / summary.totalSuppliers) * 100 || 0).toFixed(0)}% del total</p>
            </div>
            <HiTruck className="w-8 h-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Detalle por Proveedor</h3>
        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
        >
          <HiDownload className="w-4 h-4" />
          Exportar CSV
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Proveedor</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Comprado</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Pagado</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Saldo</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Facturas</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Vencidas</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {suppliers.map((supplier) => (
                <tr key={supplier.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{supplier.code}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{supplier.name}</td>
                  <td className="px-4 py-3 text-sm text-right text-gray-900">{formatCurrency(supplier.totalPurchased)}</td>
                  <td className="px-4 py-3 text-sm text-right text-green-600">{formatCurrency(supplier.totalPaid)}</td>
                  <td className="px-4 py-3 text-sm text-right font-semibold text-red-600">{formatCurrency(supplier.totalBalance)}</td>
                  <td className="px-4 py-3 text-sm text-center text-gray-900">{supplier.invoicesCount}</td>
                  <td className="px-4 py-3 text-sm text-center">
                    {supplier.overdueInvoices > 0 ? (
                      <span className="px-2 py-1 text-xs font-medium rounded bg-red-100 text-red-800">
                        {supplier.overdueInvoices}
                      </span>
                    ) : (
                      <span className="text-gray-400">0</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-center">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      supplier.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {supplier.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {suppliers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No hay datos para mostrar</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuppliersReportTab;
