import { useState, useEffect } from 'react';
import { HiPlus, HiDocumentText, HiCash, HiExclamationCircle, HiCheckCircle, HiDotsVertical, HiPencil, HiTrash } from 'react-icons/hi';
import api from '../services/api';
import { MinimalStatCard } from '../components/MinimalStatCard';
import { useToast } from '../hooks/useToast';

interface Invoice {
  id: string;
  code: string;
  supplierId: string;
  supplier?: { name: string };
  invoiceDate: string;
  dueDate: string;
  total: number;
  paid: number;
  balance: number;
  status: string;
}

interface Payment {
  id: string;
  code: string;
  supplierId: string;
  supplier?: { name: string };
  paymentDate: string;
  amount: number;
  paymentMethod: string;
  reference?: string;
}

export default function PayablesManagement() {
  const { showToast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [filterSupplier, setFilterSupplier] = useState('');
  const [formData, setFormData] = useState({
    supplierId: '',
    paymentDate: new Date().toISOString().split('T')[0],
    amount: 0,
    paymentMethod: 'TRANSFER',
    reference: '',
    notes: '',
    invoices: [] as { invoiceId: string; amount: number }[],
  });

  const [stats, setStats] = useState({
    totalDebt: 0,
    overdueDebt: 0,
    pendingInvoices: 0,
    paymentsThisMonth: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [invoicesRes, paymentsRes, suppliersRes, statsRes] = await Promise.all([
        api.get('/supplier-invoices'),
        api.get('/supplier-payments'),
        api.get('/suppliers'),
        api.get('/supplier-invoices/stats')
      ]);

      setInvoices(invoicesRes.data?.data || []);
      setPayments(paymentsRes.data?.data || []);
      setSuppliers(suppliersRes.data?.data || []);
      
      const statsData = statsRes.data?.data || {};
      setStats({
        totalDebt: statsData.totalDebt || 0,
        overdueDebt: statsData.overdueDebt || 0,
        pendingInvoices: statsData.pendingInvoices || 0,
        paymentsThisMonth: 0,
      });
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePaySelected = () => {
    if (selectedInvoices.length === 0) {
      showToast('Selecciona al menos una factura para pagar', 'warning');
      return;
    }

    const invoicesToPay = invoices.filter(inv => selectedInvoices.includes(inv.id));
    const totalAmount = invoicesToPay.reduce((sum, inv) => sum + inv.balance, 0);
    const supplierId = invoicesToPay[0]?.supplierId || '';

    setFormData({
      ...formData,
      supplierId,
      amount: totalAmount,
      invoices: invoicesToPay.map(inv => ({ invoiceId: inv.id, amount: inv.balance }))
    });
    setShowPaymentModal(true);
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const totalInvoices = formData.invoices.reduce((sum, inv) => sum + inv.amount, 0);
    if (totalInvoices !== formData.amount) {
      showToast('El total de las facturas debe coincidir con el monto del pago', 'error');
      return;
    }

    try {
      await api.post('/supplier-payments', formData);
      showToast('Pago registrado exitosamente', 'success');
      setShowPaymentModal(false);
      setSelectedInvoices([]);
      fetchData();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || 'Error al registrar pago';
      showToast(errorMessage, 'error');
    }
  };

  const handleDeletePayment = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este pago? Esto revertirá los montos aplicados a las facturas.')) return;
    
    try {
      await api.delete(`/supplier-payments/${id}`);
      showToast('Pago eliminado exitosamente', 'success');
      fetchData();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || 'Error al eliminar pago';
      showToast(errorMessage, 'error');
    }
    setOpenMenuId(null);
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

  const filteredInvoices = filterSupplier
    ? invoices.filter(inv => inv.supplierId === filterSupplier && inv.balance > 0)
    : invoices.filter(inv => inv.balance > 0);

  const recentPayments = payments.slice(0, 10);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cuentas por Pagar</h1>
          <p className="text-sm text-gray-600 mt-1">Gestión de facturas y pagos a proveedores</p>
        </div>
        <button
          onClick={handlePaySelected}
          disabled={selectedInvoices.length === 0}
          className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm hover:shadow"
        >
          <HiCash className="w-5 h-5" />
          <span>Registrar Pago {selectedInvoices.length > 0 && `(${selectedInvoices.length})`}</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MinimalStatCard
          title="Deuda Total"
          value={formatCurrency(stats.totalDebt)}
          icon={<HiDocumentText className="w-full h-full" />}
          color="red"
        />
        <MinimalStatCard
          title="Vencida"
          value={formatCurrency(stats.overdueDebt)}
          icon={<HiExclamationCircle className="w-full h-full" />}
          color="orange"
        />
        <MinimalStatCard
          title="Facturas Pendientes"
          value={stats.pendingInvoices}
          icon={<HiDocumentText className="w-full h-full" />}
          color="orange"
        />
        <MinimalStatCard
          title="Pagos Este Mes"
          value={stats.paymentsThisMonth}
          icon={<HiCheckCircle className="w-full h-full" />}
          color="green"
        />
      </div>

      {/* Filtros */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Filtrar por proveedor:</label>
          <select
            value={filterSupplier}
            onChange={(e) => setFilterSupplier(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">Todos los proveedores</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          {selectedInvoices.length > 0 && (
            <span className="text-sm text-blue-600 font-medium">
              {selectedInvoices.length} factura(s) seleccionada(s)
            </span>
          )}
        </div>
      </div>

      {/* Facturas Pendientes */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900">Facturas Pendientes</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedInvoices.length === filteredInvoices.length && filteredInvoices.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedInvoices(filteredInvoices.map(inv => inv.id));
                      } else {
                        setSelectedInvoices([]);
                      }
                    }}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Proveedor</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vencimiento</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Saldo</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInvoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedInvoices.includes(invoice.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedInvoices([...selectedInvoices, invoice.id]);
                        } else {
                          setSelectedInvoices(selectedInvoices.filter(id => id !== invoice.id));
                        }
                      }}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{invoice.code}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{invoice.supplier?.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{formatDate(invoice.dueDate)}</td>
                  <td className="px-4 py-3 text-sm text-right text-gray-900">{formatCurrency(invoice.total)}</td>
                  <td className="px-4 py-3 text-sm text-right font-semibold text-red-600">{formatCurrency(invoice.balance)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      invoice.status === 'OVERDUE' ? 'bg-red-100 text-red-800' :
                      invoice.status === 'PARTIAL' ? 'bg-orange-100 text-orange-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {invoice.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Últimos Pagos */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900">Últimos Pagos Realizados</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Proveedor</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Método</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Monto</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentPayments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{payment.code}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{payment.supplier?.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{formatDate(payment.paymentDate)}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{payment.paymentMethod}</td>
                  <td className="px-4 py-3 text-sm text-right font-semibold text-green-600">{formatCurrency(payment.amount)}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="relative">
                      <button
                        onClick={() => setOpenMenuId(openMenuId === payment.id ? null : payment.id)}
                        className="text-gray-500 hover:text-gray-700 p-1"
                      >
                        <HiDotsVertical className="h-5 w-5" />
                      </button>
                      {openMenuId === payment.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                          <button
                            onClick={() => handleDeletePayment(payment.id)}
                            className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                          >
                            <HiTrash className="h-4 w-4 mr-2" />
                            Eliminar
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Pago */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">Registrar Pago</h2>
            <form onSubmit={handleSubmitPayment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha *</label>
                <input
                  type="date"
                  required
                  value={formData.paymentDate}
                  onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monto Total *</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Método de Pago *</label>
                <select
                  required
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="CASH">Efectivo</option>
                  <option value="TRANSFER">Transferencia</option>
                  <option value="CHECK">Cheque</option>
                  <option value="CARD">Tarjeta</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Referencia</label>
                <input
                  type="text"
                  value={formData.reference}
                  onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Número de transferencia/cheque"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Registrar Pago
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
