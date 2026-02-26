import { useState, useEffect } from 'react';
import { HiPlus, HiCash, HiCheckCircle, HiCalendar, HiDotsVertical, HiPencil, HiTrash } from 'react-icons/hi';
import api from '../services/api';
import { MinimalStatCard } from '../components/MinimalStatCard';
import { useToast } from '../hooks/useToast';

interface SupplierPayment {
  id: string;
  code: string;
  supplierId: string;
  supplier?: {
    name: string;
  };
  paymentDate: string;
  amount: number;
  paymentMethod: string;
  reference?: string;
  notes?: string;
}

const SupplierPayments = () => {
  const { showToast } = useToast();
  const [payments, setPayments] = useState<SupplierPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState<SupplierPayment | null>(null);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [pendingInvoices, setPendingInvoices] = useState<any[]>([]);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
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
    total: 0,
    thisMonth: 0,
    totalAmount: 0,
    thisMonthAmount: 0,
  });

  useEffect(() => {
    fetchPayments();
    fetchSuppliers();
  }, []);

  useEffect(() => {
    if (formData.supplierId && !editingPayment) {
      fetchPendingInvoices(formData.supplierId);
    }
  }, [formData.supplierId]);

  const fetchPayments = async () => {
    try {
      const response = await api.get('/supplier-payments');
      const data = response.data?.data || response.data || [];
      setPayments(data);
      
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      const totalPayments = data.length;
      const thisMonth = data.filter((p: SupplierPayment) => {
        const paymentDate = new Date(p.paymentDate);
        return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
      }).length;
      
      const totalAmount = data.reduce((sum: number, p: SupplierPayment) => sum + (p.amount || 0), 0);
      const thisMonthAmount = data
        .filter((p: SupplierPayment) => {
          const paymentDate = new Date(p.paymentDate);
          return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
        })
        .reduce((sum: number, p: SupplierPayment) => sum + (p.amount || 0), 0);
      
      setStats({
        total: totalPayments,
        thisMonth,
        totalAmount,
        thisMonthAmount,
      });
    } catch (error) {
      console.error('Error fetching supplier payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await api.get('/suppliers');
      setSuppliers(response.data.data || []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  const fetchPendingInvoices = async (supplierId: string) => {
    if (!supplierId) {
      setPendingInvoices([]);
      return;
    }
    try {
      const response = await api.get(`/supplier-invoices?supplierId=${supplierId}&status=PENDING,PARTIAL`);
      const invoices = response.data?.data || [];
      setPendingInvoices(invoices.filter((inv: any) => inv.balance > 0));
    } catch (error) {
      console.error('Error fetching pending invoices:', error);
      setPendingInvoices([]);
    }
  };

  const handleCreate = () => {
    setEditingPayment(null);
    setFormData({
      supplierId: '',
      paymentDate: new Date().toISOString().split('T')[0],
      amount: 0,
      paymentMethod: 'TRANSFER',
      reference: '',
      notes: '',
      invoices: [],
    });
    setShowModal(true);
  };

  const handleEdit = (payment: SupplierPayment) => {
    setEditingPayment(payment);
    setFormData({
      supplierId: payment.supplierId,
      paymentDate: new Date(payment.paymentDate).toISOString().split('T')[0],
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      reference: payment.reference || '',
      notes: payment.notes || '',
      invoices: [],
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este pago? Esto revertirá los montos aplicados a las facturas.')) return;
    try {
      await api.delete(`/supplier-payments/${id}`);
      showToast('Pago eliminado exitosamente', 'success');
      fetchPayments();
    } catch (error: any) {
      console.error('Error deleting payment:', error);
      const errorMessage = error.response?.data?.error?.message || 'Error al eliminar pago';
      showToast(errorMessage, 'error');
    }
    setOpenMenuId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar que el total de invoices coincida con el monto del pago
    const totalInvoices = formData.invoices.reduce((sum, inv) => sum + inv.amount, 0);
    if (!editingPayment && totalInvoices !== formData.amount) {
      showToast('El total de las facturas debe coincidir con el monto del pago', 'error');
      return;
    }
    
    try {
      if (editingPayment) {
        await api.put(`/supplier-payments/${editingPayment.id}`, formData);
        showToast('Pago actualizado exitosamente', 'success');
      } else {
        await api.post('/supplier-payments', formData);
        showToast('Pago registrado exitosamente', 'success');
      }
      setShowModal(false);
      fetchPayments();
    } catch (error: any) {
      console.error('Error saving payment:', error);
      const errorMessage = error.response?.data?.error?.message || 'Error al guardar pago';
      showToast(errorMessage, 'error');
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

  const getPaymentMethodLabel = (method: string) => {
    const methods: Record<string, string> = {
      CASH: 'Efectivo',
      TRANSFER: 'Transferencia',
      CHECK: 'Cheque',
      CARD: 'Tarjeta',
    };
    return methods[method] || method;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Pagos a Proveedores</h1>
          <p className="text-sm text-gray-500">Historial de pagos realizados</p>
        </div>
        <button 
          onClick={handleCreate}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <HiPlus className="w-4 h-4" />
          <span>Registrar Pago</span>
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MinimalStatCard
          title="Total Pagos"
          value={stats.total}
          icon={<HiCash className="w-full h-full" />}
          color="blue"
        />
        <MinimalStatCard
          title="Este Mes"
          value={stats.thisMonth}
          subtitle="pagos"
          icon={<HiCalendar className="w-full h-full" />}
          color="green"
        />
        <MinimalStatCard
          title="Monto Total"
          value={formatCurrency(stats.totalAmount)}
          icon={<HiCheckCircle className="w-full h-full" />}
          color="purple"
        />
        <MinimalStatCard
          title="Mes Actual"
          value={formatCurrency(stats.thisMonthAmount)}
          icon={<HiCash className="w-full h-full" />}
          color="orange"
        />
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Número
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Proveedor
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Método
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Referencia
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Monto
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payments.length > 0 ? (
                payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50 cursor-pointer">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      {payment.code}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {payment.supplier?.name || 'N/A'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(payment.paymentDate)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {getPaymentMethodLabel(payment.paymentMethod)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {payment.reference || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <div className="relative">
                        <button
                          onClick={() => setOpenMenuId(openMenuId === payment.id ? null : payment.id)}
                          className="text-gray-500 hover:text-gray-700 p-1"
                        >
                          <HiDotsVertical className="h-5 w-5" />
                        </button>
                        {openMenuId === payment.id && (
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                            <div className="py-1">
                              <button
                                onClick={() => {
                                  handleEdit(payment);
                                  setOpenMenuId(null);
                                }}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                <HiPencil className="h-4 w-4 mr-2" />
                                Editar
                              </button>
                              <button
                                onClick={() => handleDelete(payment.id)}
                                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                              >
                                <HiTrash className="h-4 w-4 mr-2" />
                                Eliminar
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">
                    No hay pagos registrados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">
              {editingPayment ? 'Editar Pago' : 'Registrar Pago'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor *</label>
                <select
                  required
                  value={formData.supplierId}
                  onChange={(e) => {
                    const supplierId = e.target.value;
                    setFormData({ ...formData, supplierId, invoices: [] });
                    fetchPendingInvoices(supplierId);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Seleccionar proveedor</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              
              {/* Selector de Facturas Pendientes */}
              {formData.supplierId && pendingInvoices.length > 0 && (
                <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Facturas Pendientes</label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {pendingInvoices.map((invoice) => {
                      const isSelected = formData.invoices.some(inv => inv.invoiceId === invoice.id);
                      const selectedInvoice = formData.invoices.find(inv => inv.invoiceId === invoice.id);
                      return (
                        <div key={invoice.id} className="flex items-center justify-between bg-white p-2 rounded border">
                          <div className="flex items-center gap-2 flex-1">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData({
                                    ...formData,
                                    invoices: [...formData.invoices, { invoiceId: invoice.id, amount: invoice.balance }]
                                  });
                                } else {
                                  setFormData({
                                    ...formData,
                                    invoices: formData.invoices.filter(inv => inv.invoiceId !== invoice.id)
                                  });
                                }
                              }}
                              className="w-4 h-4 text-blue-600 rounded"
                            />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">{invoice.code}</p>
                              <p className="text-xs text-gray-500">Saldo: ${invoice.balance.toLocaleString()}</p>
                            </div>
                          </div>
                          {isSelected && (
                            <input
                              type="number"
                              step="0.01"
                              value={selectedInvoice?.amount || 0}
                              onChange={(e) => {
                                const newAmount = parseFloat(e.target.value) || 0;
                                setFormData({
                                  ...formData,
                                  invoices: formData.invoices.map(inv =>
                                    inv.invoiceId === invoice.id ? { ...inv, amount: newAmount } : inv
                                  )
                                });
                              }}
                              className="w-24 px-2 py-1 text-sm border border-gray-300 rounded"
                              placeholder="Monto"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-gray-700">Total a aplicar:</span>
                      <span className="font-bold text-gray-900">
                        ${formData.invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha *</label>
                <input
                  type="date"
                  required
                  value={formData.paymentDate}
                  onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monto Total del Pago *</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                />
                {formData.invoices.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Aplicado a facturas: ${formData.invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0).toLocaleString()}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Método de Pago *</label>
                <select
                  required
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                  placeholder="Número de transferencia o cheque"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500"
                  rows={2}
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingPayment ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierPayments;
