import { useState, useEffect } from 'react';
import { receivablesApi, clientsApi } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';

interface Client {
  id: string;
  name: string;
}

interface Invoice {
  id: string;
  number: string;
  balance: number;
  total: number;
}

interface PaymentForm {
  clientId: string;
  invoiceIds: string[];
  invoicePayments: Array<{ invoiceId: string; amount: number }>;
  amount: number;
  method: 'CASH' | 'TRANSFER' | 'CARD';
  reference: string;
  paymentDate: string;
  observations: string;
}

const PaymentRegisterTab = ({ onPaymentCreated }: { onPaymentCreated?: () => void }) => {
  const { showToast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [form, setForm] = useState<PaymentForm>({
    clientId: '',
    invoiceIds: [],
    invoicePayments: [],
    amount: 0,
    method: 'CASH',
    reference: '',
    paymentDate: new Date().toISOString().split('T')[0],
    observations: '',
  });
  const [loading, setLoading] = useState(false);
  const [distributionMode, setDistributionMode] = useState<'auto' | 'manual'>('auto');

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    if (selectedClientId) {
      fetchClientInvoices(selectedClientId);
      setForm({ ...form, clientId: selectedClientId });
    }
  }, [selectedClientId]);

  const fetchClients = async () => {
    try {
      const response = await clientsApi.getClients({ isActive: true, limit: 100 });
      setClients(response.data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchClientInvoices = async (clientId: string) => {
    try {
      const accountStatus = await receivablesApi.getStatus(clientId);
      const pendingInvoices = accountStatus.invoices.filter((inv: any) => inv.balance > 0);
      setInvoices(pendingInvoices);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    }
  };

  const handleInvoiceToggle = (invoiceId: string) => {
    if (form.invoiceIds.includes(invoiceId)) {
      setForm({
        ...form,
        invoiceIds: form.invoiceIds.filter((id) => id !== invoiceId),
        invoicePayments: form.invoicePayments.filter((ip) => ip.invoiceId !== invoiceId),
      });
    } else {
      const invoice = invoices.find((inv) => inv.id === invoiceId);
      if (invoice) {
        setForm({
          ...form,
          invoiceIds: [...form.invoiceIds, invoiceId],
          invoicePayments: [
            ...form.invoicePayments,
            { invoiceId, amount: invoice.balance },
          ],
        });
      }
    }
    calculateTotal();
  };

  const handleInvoiceAmountChange = (invoiceId: string, amount: number) => {
    const invoice = invoices.find((inv) => inv.id === invoiceId);
    if (!invoice) return;

    const maxAmount = invoice.balance;
    const actualAmount = Math.min(amount, maxAmount);

    setForm({
      ...form,
      invoicePayments: form.invoicePayments.map((ip) =>
        ip.invoiceId === invoiceId ? { ...ip, amount: actualAmount } : ip
      ),
    });
    calculateTotal();
  };

  const calculateTotal = () => {
    if (distributionMode === 'manual') {
      const total = form.invoicePayments.reduce((sum, ip) => sum + ip.amount, 0);
      setForm({ ...form, amount: total });
    } else {
      const selectedInvoices = invoices.filter((inv) => form.invoiceIds.includes(inv.id));
      const total = selectedInvoices.reduce((sum, inv) => sum + inv.balance, 0);
      setForm({ ...form, amount: total });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.clientId) {
      showToast('Seleccione un cliente', 'error');
      return;
    }

    if (form.amount <= 0) {
      showToast('El monto debe ser mayor a 0', 'error');
      return;
    }

    try {
      setLoading(true);
      const paymentData: any = {
        clientId: form.clientId,
        amount: form.amount,
        method: form.method,
        reference: form.reference || undefined,
        paymentDate: form.paymentDate ? new Date(form.paymentDate).toISOString() : undefined,
        observations: form.observations || undefined,
      };

      if (distributionMode === 'manual' && form.invoicePayments.length > 0) {
        paymentData.invoicePayments = form.invoicePayments;
      } else if (form.invoiceIds.length > 0) {
        paymentData.invoiceIds = form.invoiceIds;
      }

      await receivablesApi.createPayment(paymentData);
      showToast('Pago registrado exitosamente', 'success');
      
      // Reset form
      setForm({
        clientId: '',
        invoiceIds: [],
        invoicePayments: [],
        amount: 0,
        method: 'CASH',
        reference: '',
        paymentDate: new Date().toISOString().split('T')[0],
        observations: '',
      });
      setSelectedClientId('');
      setInvoices([]);
      
      if (onPaymentCreated) {
        onPaymentCreated();
      }
    } catch (error: any) {
      console.error('Error creating payment:', error);
      showToast(error.response?.data?.error?.message || 'Error al registrar el pago', 'error');
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Formulario */}
      <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Registrar Pago</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Cliente */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cliente *</label>
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Seleccione un cliente</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>

          {/* Modo de Distribución */}
          {selectedClientId && invoices.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Modo de Distribución</label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="auto"
                    checked={distributionMode === 'auto'}
                    onChange={(e) => setDistributionMode(e.target.value as 'auto' | 'manual')}
                    className="mr-2"
                  />
                  Automática (proporcional)
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="manual"
                    checked={distributionMode === 'manual'}
                    onChange={(e) => setDistributionMode(e.target.value as 'auto' | 'manual')}
                    className="mr-2"
                  />
                  Manual (especificar monto por factura)
                </label>
              </div>
            </div>
          )}

          {/* Facturas Pendientes */}
          {selectedClientId && invoices.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Facturas Pendientes</label>
              <div className="border border-gray-200 rounded-md max-h-64 overflow-y-auto">
                {invoices.map((invoice) => (
                  <div key={invoice.id} className="p-3 border-b border-gray-100 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={form.invoiceIds.includes(invoice.id)}
                          onChange={() => handleInvoiceToggle(invoice.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div>
                          <div className="font-medium text-sm">{invoice.number}</div>
                          <div className="text-xs text-gray-500">
                            Balance: {formatCurrency(invoice.balance)}
                          </div>
                        </div>
                      </div>
                      {distributionMode === 'manual' && form.invoiceIds.includes(invoice.id) && (
                        <input
                          type="number"
                          min="0"
                          max={invoice.balance}
                          step="0.01"
                          value={
                            form.invoicePayments.find((ip) => ip.invoiceId === invoice.id)?.amount || 0
                          }
                          onChange={(e) =>
                            handleInvoiceAmountChange(invoice.id, parseFloat(e.target.value) || 0)
                          }
                          className="w-32 px-2 py-1 border border-gray-300 rounded text-sm"
                          placeholder="Monto"
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Monto Total */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Monto Total *</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Método de Pago */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Método de Pago *</label>
            <select
              value={form.method}
              onChange={(e) => setForm({ ...form, method: e.target.value as any })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="CASH">Efectivo</option>
              <option value="TRANSFER">Transferencia</option>
              <option value="CARD">Tarjeta</option>
            </select>
          </div>

          {/* Referencia */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Referencia</label>
            <input
              type="text"
              value={form.reference}
              onChange={(e) => setForm({ ...form, reference: e.target.value })}
              placeholder="Número de referencia (opcional)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Fecha de Pago */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Pago</label>
            <input
              type="date"
              value={form.paymentDate}
              onChange={(e) => setForm({ ...form, paymentDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Observaciones */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
            <textarea
              value={form.observations}
              onChange={(e) => setForm({ ...form, observations: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Notas adicionales (opcional)"
            />
          </div>

          {/* Botón Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Registrando...' : 'Registrar Pago'}
          </button>
        </form>
      </div>

      {/* Resumen */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Facturas Seleccionadas:</span>
            <span className="text-sm font-medium">{form.invoiceIds.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Monto Total:</span>
            <span className="text-sm font-bold text-lg">{formatCurrency(form.amount)}</span>
          </div>
          {form.invoiceIds.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 mb-2">Facturas seleccionadas:</p>
              <div className="space-y-1">
                {invoices
                  .filter((inv) => form.invoiceIds.includes(inv.id))
                  .map((inv) => (
                    <div key={inv.id} className="text-xs text-gray-600">
                      {inv.number}: {formatCurrency(inv.balance)}
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentRegisterTab;


