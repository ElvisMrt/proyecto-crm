import { useState, useEffect } from 'react';
import api from '../../services/api';
import { HiDownload, HiExclamationCircle, HiClock, HiCheckCircle } from 'react-icons/hi';

interface PayableInvoice {
  id: string;
  code: string;
  supplier: string;
  invoiceDate: string;
  dueDate: string;
  total: number;
  paid: number;
  balance: number;
  status: string;
  daysOverdue: number | null;
}

const PayablesReportTab = () => {
  const [invoices, setInvoices] = useState<PayableInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalPayable: 0,
    totalOverdue: 0,
    invoicesCount: 0,
    aging: {
      '0-30': 0,
      '31-60': 0,
      '61-90': 0,
      '90+': 0,
    },
  });

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const response = await api.get('/reports/payables');
      setInvoices(response.data.invoices || []);
      setSummary(response.data.summary || {
        totalPayable: 0,
        totalOverdue: 0,
        invoicesCount: 0,
        aging: { '0-30': 0, '31-60': 0, '61-90': 0, '90+': 0 },
      });
    } catch (error) {
      console.error('Error fetching payables report:', error);
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

  const getStatusBadge = (invoice: PayableInvoice) => {
    if (invoice.status === 'PAID') {
      return <span className="px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-800">Pagada</span>;
    }
    if (invoice.daysOverdue && invoice.daysOverdue > 0) {
      return <span className="px-2 py-1 text-xs font-medium rounded bg-red-100 text-red-800">Vencida ({invoice.daysOverdue}d)</span>;
    }
    if (invoice.status === 'PARTIAL') {
      return <span className="px-2 py-1 text-xs font-medium rounded bg-orange-100 text-orange-800">Parcial</span>;
    }
    return <span className="px-2 py-1 text-xs font-medium rounded bg-yellow-100 text-yellow-800">Pendiente</span>;
  };

  const exportToCSV = () => {
    const headers = ['Código', 'Proveedor', 'Fecha Emisión', 'Vencimiento', 'Total', 'Pagado', 'Saldo', 'Estado', 'Días Vencido'];
    const rows = invoices.map(inv => [
      inv.code,
      inv.supplier,
      formatDate(inv.invoiceDate),
      formatDate(inv.dueDate),
      inv.total,
      inv.paid,
      inv.balance,
      inv.status,
      inv.daysOverdue || 0
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte-cuentas-por-pagar-${new Date().toISOString().split('T')[0]}.csv`;
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
              <p className="text-sm text-gray-600">Total por Pagar</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(summary.totalPayable)}</p>
              <p className="text-xs text-gray-500">{summary.invoicesCount} facturas</p>
            </div>
            <HiExclamationCircle className="w-8 h-8 text-red-600" />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Vencido</p>
              <p className="text-2xl font-bold text-orange-600">{formatCurrency(summary.totalOverdue)}</p>
              <p className="text-xs text-gray-500">Atrasado</p>
            </div>
            <HiClock className="w-8 h-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">0-30 días</p>
              <p className="text-2xl font-bold text-yellow-600">{formatCurrency(summary.aging['0-30'])}</p>
            </div>
            <HiClock className="w-8 h-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">+90 días</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(summary.aging['90+'])}</p>
            </div>
            <HiExclamationCircle className="w-8 h-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Aging Chart */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Antigüedad de Saldos</h3>
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center">
            <p className="text-xs text-gray-600 mb-1">0-30 días</p>
            <p className="text-lg font-bold text-yellow-600">{formatCurrency(summary.aging['0-30'])}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-600 mb-1">31-60 días</p>
            <p className="text-lg font-bold text-orange-600">{formatCurrency(summary.aging['31-60'])}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-600 mb-1">61-90 días</p>
            <p className="text-lg font-bold text-red-500">{formatCurrency(summary.aging['61-90'])}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-600 mb-1">+90 días</p>
            <p className="text-lg font-bold text-red-700">{formatCurrency(summary.aging['90+'])}</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Detalle de Facturas por Pagar</h3>
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Emisión</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vencimiento</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Pagado</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Saldo</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{invoice.code}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{invoice.supplier}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{formatDate(invoice.invoiceDate)}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{formatDate(invoice.dueDate)}</td>
                  <td className="px-4 py-3 text-sm text-right text-gray-900">{formatCurrency(invoice.total)}</td>
                  <td className="px-4 py-3 text-sm text-right text-green-600">{formatCurrency(invoice.paid)}</td>
                  <td className="px-4 py-3 text-sm text-right font-semibold text-red-600">{formatCurrency(invoice.balance)}</td>
                  <td className="px-4 py-3 text-sm text-center">{getStatusBadge(invoice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {invoices.length === 0 && (
          <div className="text-center py-12">
            <HiCheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <p className="text-gray-900 font-semibold">¡No hay cuentas por pagar!</p>
            <p className="text-gray-500 text-sm">Todas las facturas están pagadas</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PayablesReportTab;
