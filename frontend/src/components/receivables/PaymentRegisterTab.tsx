import { useState, useEffect } from 'react';
import { receivablesApi, clientsApi } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { HiSearch, HiUser, HiCheckCircle, HiCash } from 'react-icons/hi';

interface Client {
  id: string;
  name: string;
  identification: string;
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

interface PaymentRegisterTabProps {
  branchId?: string;
  initialClientId?: string;
  initialInvoiceIds?: string[];
  onPaymentCreated?: () => void;
  onNavigateToStatus?: (clientId: string) => void;
}

const PaymentRegisterTab = ({ branchId, initialClientId, initialInvoiceIds, onPaymentCreated, onNavigateToStatus }: PaymentRegisterTabProps) => {
  const { showToast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState(initialClientId || '');
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
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    if (initialClientId && initialClientId !== selectedClientId) {
      setSelectedClientId(initialClientId);
    }
  }, [initialClientId]);

  useEffect(() => {
    if (selectedClientId) {
      fetchClientInvoices(selectedClientId);
      setForm(prev => ({ ...prev, clientId: selectedClientId }));
    }
  }, [selectedClientId]);

  useEffect(() => {
    if (initialInvoiceIds && initialInvoiceIds.length > 0 && invoices.length > 0) {
      // Pre-select invoices
      const newInvoiceIds = initialInvoiceIds.filter(id => 
        invoices.some(inv => inv.id === id && inv.balance > 0)
      );
      if (newInvoiceIds.length > 0) {
        const total = newInvoiceIds.reduce((sum, id) => {
          const invoice = invoices.find(inv => inv.id === id);
          return sum + (invoice ? invoice.balance : 0);
        }, 0);
        setForm(prev => ({
          ...prev,
          invoiceIds: newInvoiceIds,
          invoicePayments: newInvoiceIds.map(id => {
            const invoice = invoices.find(inv => inv.id === id);
            return { invoiceId: id, amount: invoice ? invoice.balance : 0 };
          }),
          amount: total,
        }));
      }
    }
  }, [initialInvoiceIds, invoices]);

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

      const params: any = {};
      if (branchId) {
        params.branchId = branchId;
      }

      await receivablesApi.createPayment(paymentData, params);
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

  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.identification && client.identification.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSelectClient = (client: Client) => {
    setSelectedClientId(client.id);
    setSearchTerm(client.name);
    setShowSuggestions(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => 
        prev < filteredClients.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < filteredClients.length) {
        handleSelectClient(filteredClients[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setHighlightedIndex(-1);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Formulario */}
      <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Registrar Pago</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Cliente con Buscador */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <HiSearch className="w-4 h-4 mr-1 text-blue-600" />
              Buscar Cliente *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <HiUser className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Haz click para ver clientes o escribe para buscar..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowSuggestions(true);
                  setHighlightedIndex(-1);
                  if (!e.target.value) {
                    setSelectedClientId('');
                    setInvoices([]);
                  }
                }}
                onFocus={() => setShowSuggestions(true)}
                onClick={() => setShowSuggestions(true)}
                onKeyDown={handleKeyDown}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
              
              {/* Sugerencias */}
              {showSuggestions && filteredClients.length > 0 && (
                <div className="absolute z-20 w-full mt-2 bg-white border-2 border-blue-200 rounded-xl shadow-2xl max-h-64 overflow-y-auto">
                  <div className="px-3 py-2 bg-blue-50 border-b border-blue-100">
                    <p className="text-xs font-medium text-blue-800">
                      {filteredClients.length} cliente(s) encontrado(s)
                    </p>
                  </div>
                  {filteredClients.map((client, index) => (
                    <button
                      key={client.id}
                      type="button"
                      onClick={() => handleSelectClient(client)}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      className={`w-full text-left px-3 py-3 hover:bg-blue-50 transition-all border-b border-gray-100 last:border-b-0 ${
                        index === highlightedIndex ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <HiUser className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">{client.name}</p>
                            {client.identification && (
                              <p className="text-xs text-gray-500">ID: {client.identification}</p>
                            )}
                          </div>
                        </div>
                        <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              
              {/* No hay resultados */}
              {showSuggestions && searchTerm && filteredClients.length === 0 && (
                <div className="absolute z-20 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3">
                  <p className="text-gray-500 text-sm text-center">No se encontraron clientes</p>
                </div>
              )}
            </div>
            
            {/* Cliente seleccionado */}
            {selectedClientId && clients.find(c => c.id === selectedClientId) && (
              <div className="mt-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg">
                <div className="flex items-center">
                  <HiCheckCircle className="w-5 h-5 text-green-600 mr-2" />
                  <div>
                    <p className="text-xs font-medium text-green-700 uppercase">Cliente Seleccionado</p>
                    <p className="text-sm font-bold text-gray-900">
                      {clients.find(c => c.id === selectedClientId)?.name}
                    </p>
                  </div>
                </div>
              </div>
            )}
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
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <HiCash className="w-4 h-4 mr-1 text-green-600" />
                Facturas Pendientes ({invoices.length})
              </label>
              <div className="border-2 border-gray-200 rounded-lg max-h-64 overflow-y-auto">
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


