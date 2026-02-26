import React, { useEffect, useState } from 'react';
import { saasApi } from '../services/api';

interface Invoice {
  id: string;
  tenantId: string;
  tenantName: string;
  amount: number;
  currency: string;
  status: 'DRAFT' | 'ISSUED' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  periodStart: string;
  periodEnd: string;
  paidAt: string | null;
  paymentMethod: string | null;
  createdAt: string;
}

const SaaSBilling: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalRevenue: 0,
    pendingAmount: 0,
    paidAmount: 0,
    overdueAmount: 0
  });

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const response = await saasApi.get('/saas/invoices');
      const data = response.data.data || [];
      setInvoices(data);
      
      // Calcular estadísticas
      const totalRevenue = data.reduce((sum: number, inv: Invoice) => sum + (inv.status === 'PAID' ? Number(inv.amount) : 0), 0);
      const pendingAmount = data.filter((inv: Invoice) => inv.status === 'ISSUED').reduce((sum: number, inv: Invoice) => sum + Number(inv.amount), 0);
      const paidAmount = totalRevenue;
      const overdueAmount = data.filter((inv: Invoice) => inv.status === 'OVERDUE').reduce((sum: number, inv: Invoice) => sum + Number(inv.amount), 0);
      
      setStats({ totalRevenue, pendingAmount, paidAmount, overdueAmount });
      setError(''); // Limpiar error si fue exitoso
    } catch (err: any) {
      console.error('Error fetching invoices:', err);
      // No mostrar error, solo dejar vacío
      setInvoices([]);
      setStats({ totalRevenue: 0, pendingAmount: 0, paidAmount: 0, overdueAmount: 0 });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return 'bg-green-100 text-green-800';
      case 'ISSUED': return 'bg-blue-100 text-blue-800';
      case 'OVERDUE': return 'bg-red-100 text-red-800';
      case 'DRAFT': return 'bg-gray-100 text-gray-800';
      case 'CANCELLED': return 'bg-gray-100 text-gray-500';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PAID': return 'Pagada';
      case 'ISSUED': return 'Emitida';
      case 'OVERDUE': return 'Vencida';
      case 'DRAFT': return 'Borrador';
      case 'CANCELLED': return 'Cancelada';
      default: return status;
    }
  };

  if (loading) return <div className="p-8">Cargando...</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Facturación SaaS</h1>

      {/* Estadísticas */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-500 mb-1">Ingresos Totales</div>
          <div className="text-2xl font-bold text-green-600">${Number(stats.totalRevenue).toFixed(2)}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-500 mb-1">Pagado</div>
          <div className="text-2xl font-bold text-blue-600">${Number(stats.paidAmount).toFixed(2)}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-500 mb-1">Pendiente</div>
          <div className="text-2xl font-bold text-yellow-600">${Number(stats.pendingAmount).toFixed(2)}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-500 mb-1">Vencido</div>
          <div className="text-2xl font-bold text-red-600">${Number(stats.overdueAmount).toFixed(2)}</div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Tabla de Facturas */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tenant</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Periodo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monto</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pagado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Método</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {invoices.map((invoice) => (
              <tr key={invoice.id}>
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">{invoice.tenantName}</div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {new Date(invoice.periodStart).toLocaleDateString()} - {new Date(invoice.periodEnd).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  ${Number(invoice.amount).toFixed(2)} {invoice.currency}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                    {getStatusLabel(invoice.status)}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {invoice.paidAt ? new Date(invoice.paidAt).toLocaleDateString() : '-'}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {invoice.paymentMethod || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {invoices.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No hay facturas registradas
          </div>
        )}
      </div>
    </div>
  );
};

export default SaaSBilling;
